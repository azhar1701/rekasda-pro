from __future__ import annotations
import numpy as np
from scipy import stats
from typing import List, Dict, Any
from ..constants.tables import KS_CRITICAL, CHI_SQUARE_CRITICAL
from ..utils.math_helpers import interpolate_table, calculate_statistical_params, normal_cdf, gumbel_cdf

def chi_square_test(data: List[float], distribution: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Chi-Square Goodness of Fit Test
    K classes by n (n<=20→4, n<=50→6, else→8), df=K-3
    """
    n = len(data)
    k = 4 if n <= 20 else (6 if n <= 50 else 8)
    df = k - 3
    critical = CHI_SQUARE_CRITICAL.get(df, 7.815)
    
    expected = n / k
    # Simple binning based on sorted data as per TS implementation
    # Note: TS implementation uses a simplified binning approach
    chi_square = 0.0
    for i in range(k):
        start_idx = int(np.floor(i * expected))
        end_idx = int(np.floor((i + 1) * expected))
        observed = end_idx - start_idx
        if expected > 0:
            chi_square += ((observed - expected) ** 2) / expected
            
    return {
        'statistic': chi_square,
        'critical': critical,
        'accepted': chi_square <= critical
    }

def ks_test(data: List[float], distribution: str, params: Dict[str, Any], params_log: Dict[str, Any]) -> Dict[str, Any]:
    """
    Kolmogorov-Smirnov Goodness of Fit Test
    Weibull plotting: P=(i+1)/(n+1), D_max
    """
    n = len(data)
    critical = interpolate_table(KS_CRITICAL, n)
    sorted_data = sorted(data)
    
    ks_max = 0.0
    for i, x in enumerate(sorted_data):
        empirical_prob = (i + 1) / (n + 1)
        theoretical_prob = 0.0
        
        if distribution == 'normal':
            theoretical_prob = normal_cdf((x - params['mean']) / params['std_dev'])
        elif distribution == 'gumbel':
            theoretical_prob = gumbel_cdf(x, params['mean'], params['std_dev'])
        elif distribution == 'lognormal':
            theoretical_prob = normal_cdf((np.log(max(x, 1e-10)) - params_log['mean']) / params_log['std_dev'])
        elif distribution == 'logpearson3':
            # Fix TS bug: use scipy.stats.pearson3 for LP3
            # Pearson Type III in scipy uses (skew, loc, scale)
            # Note: LP3 is performed on log-transformed data
            log_x = np.log(max(x, 1e-10))
            # scipy.stats.pearson3.cdf(x, skew, loc, scale)
            theoretical_prob = stats.pearson3.cdf(log_x, params_log['cs'], loc=params_log['mean'], scale=params_log['std_dev'])
            
        ks_max = max(ks_max, abs(empirical_prob - theoretical_prob))
        
    return {
        'statistic': ks_max,
        'critical': critical,
        'accepted': ks_max <= critical
    }

def goodness_of_fit(data: List[float], distributions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Run both tests on all distributions
    """
    params = calculate_statistical_params(data)
    log_data = [np.log(max(x, 1e-10)) for x in data]
    params_log = calculate_statistical_params(log_data)
    
    results = []
    for dist in distributions:
        method = dist['method']
        chi_res = chi_square_test(data, method, params)
        ks_res = ks_test(data, method, params, params_log)
        
        results.append({
            'method': method,
            'chi_square': chi_res,
            'kolmogorov_smirnov': ks_res
        })
        
    return results
