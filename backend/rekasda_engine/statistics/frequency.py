from __future__ import annotations
import numpy as np
from typing import TypedDict, List, Dict, Any
from ..constants.tables import GUMBEL_YN, GUMBEL_SN, GUMBEL_YTR, LOG_PEARSON_K, NORMAL_Z
from ..utils.math_helpers import interpolate_table, interpolate_log_pearson_k, calculate_statistical_params

class StatisticalParameters(TypedDict):
    n: int
    mean: float
    std_dev: float
    cv: float
    cs: float
    ck: float

class DesignValue(TypedDict):
    return_period: int
    frequency: float
    design_value: float

class FrequencyResult(TypedDict):
    method: str
    parameters: StatisticalParameters
    design_values: List[DesignValue]

def fit_normal(params: StatisticalParameters, return_periods: List[int]) -> List[DesignValue]:
    """
    Normal Distribution Analysis
    Formula: XT = X̄ + K * S
    """
    results = []
    for T in return_periods:
        K = NORMAL_Z.get(T, 0.0) # Default to 0 if not in table, though usually it should be there
        if T not in NORMAL_Z:
            # Fallback to interpolation if needed, but instructions say import from tables
            pass
        
        XT = params['mean'] + K * params['std_dev']
        results.append({
            'return_period': T,
            'frequency': K,
            'design_value': round(XT, 2)
        })
    return results

def fit_log_normal(params_log: StatisticalParameters, return_periods: List[int]) -> List[DesignValue]:
    """
    Log-Normal Distribution Analysis
    Transform data to log space, fit, then back-transform
    """
    results = []
    for T in return_periods:
        K = NORMAL_Z.get(T, 0.0)
        log_XT = params_log['mean'] + K * params_log['std_dev']
        XT = np.exp(log_XT)
        results.append({
            'return_period': T,
            'frequency': K,
            'design_value': round(XT, 2)
        })
    return results

def fit_gumbel(params: StatisticalParameters, n: int, return_periods: List[int]) -> List[DesignValue]:
    """
    Gumbel Distribution Analysis
    K = (YTr - Yn) / Sn
    """
    results = []
    yn = interpolate_table(GUMBEL_YN, n)
    sn = interpolate_table(GUMBEL_SN, n)
    
    for T in return_periods:
        ytr = GUMBEL_YTR.get(T, 0.0)
        K = (ytr - yn) / sn
        XT = params['mean'] + K * params['std_dev']
        results.append({
            'return_period': T,
            'frequency': K,
            'design_value': round(XT, 2)
        })
    return results

def fit_log_pearson_3(params_log: StatisticalParameters, return_periods: List[int]) -> List[DesignValue]:
    """
    Log-Pearson Type III Distribution Analysis
    """
    results = []
    for T in return_periods:
        K = interpolate_log_pearson_k(params_log['cs'], T)
        log_XT = params_log['mean'] + K * params_log['std_dev']
        XT = np.exp(log_XT)
        results.append({
            'return_period': T,
            'frequency': K,
            'design_value': round(XT, 2)
        })
    return results

def frequency_analysis(data: List[float], return_periods: List[int] = [2, 5, 10, 25, 50, 100]) -> List[FrequencyResult]:
    """
    Perform frequency analysis for all 4 distributions
    """
    n = len(data)
    params = calculate_statistical_params(data)
    
    # Log-transform data for Log-Normal and LP3
    # Use natural log as per TS Math.exp/Math.log usage in frequencyMath.ts
    log_data = [np.log(max(x, 1e-10)) for x in data]
    params_log = calculate_statistical_params(log_data)
    
    results = [
        {
            'method': 'normal',
            'parameters': params,
            'design_values': fit_normal(params, return_periods)
        },
        {
            'method': 'lognormal',
            'parameters': params,
            'design_values': fit_log_normal(params_log, return_periods)
        },
        {
            'method': 'gumbel',
            'parameters': params,
            'design_values': fit_gumbel(params, n, return_periods)
        },
        {
            'method': 'logpearson3',
            'parameters': params,
            'design_values': fit_log_pearson_3(params_log, return_periods)
        }
    ]
    return results

def select_best_method(gof_results: List[Dict[str, Any]]) -> str:
    """
    Select best distribution method based on GoF results
    Priority: LP3 > Gumbel > LogNormal > Normal
    """
    passed = [g for g in gof_results if g['chi_square']['accepted'] and g['kolmogorov_smirnov']['accepted']]
    priority = ['logpearson3', 'gumbel', 'lognormal', 'normal']
    
    if passed:
        for method in priority:
            for p in passed:
                if p['method'] == method:
                    return method
        return passed[0]['method']
    
    # If none passed, return the one with minimum deviation (sum of statistics)
    best = min(gof_results, key=lambda x: x['chi_square']['statistic'] + x['kolmogorov_smirnov']['statistic'])
    return best['method']
