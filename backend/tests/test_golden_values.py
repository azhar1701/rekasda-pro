import pytest
from rekasda_engine.utils.math_helpers import (
    calculate_statistical_params,
    interpolate_table,
    interpolate_log_pearson_k
)
from rekasda_engine.constants.tables import GUMBEL_YN, LOG_PEARSON_K
from rekasda_engine.statistics.frequency import fit_normal

def test_calculate_statistical_params_golden():
    data = [120.0, 135.0, 142.0, 95.0, 110.0, 85.0]
    res = calculate_statistical_params(data)
    assert res['n'] == 6
    assert res['mean'] == pytest.approx(114.5)
    assert res['std_dev'] > 0

def test_interpolate_table_golden():
    # Exact bound match
    assert interpolate_table(GUMBEL_YN, 10) == pytest.approx(0.4952)
    # Upper bound
    assert interpolate_table(GUMBEL_YN, 100) == pytest.approx(0.5600)
    # Linear interpolation check (midpoint 12.5 between 10 and 15)
    mid_val = interpolate_table(GUMBEL_YN, 12.5)
    assert mid_val == pytest.approx((0.4952 + 0.5128) / 2)

def test_interpolate_log_pearson_k_golden():
    # Exact match cs=0.0, Tr=10 -> 1.282
    k = interpolate_log_pearson_k(0.0, 10, LOG_PEARSON_K)
    assert k == pytest.approx(1.282)
    
    # Exact match cs=1.0, Tr=25 -> 1.366
    k2 = interpolate_log_pearson_k(1.0, 25, LOG_PEARSON_K)
    assert k2 == pytest.approx(1.366)

def test_normal_distribution_golden():
    params = {'mean': 100, 'std_dev': 20, 'n': 10, 'cv': 0.2, 'cs': 0, 'ck': 0}
    # For Tr=2 -> K = 0.0 -> XT = 100
    # For Tr=10 -> K = 1.282 -> XT = 100 + 1.282*20 = 125.64
    res = fit_normal(params, [2, 10])
    
    assert res[0]['return_period'] == 2
    assert res[0]['design_value'] == pytest.approx(100.0)
    
    assert res[1]['return_period'] == 10
    assert res[1]['design_value'] == pytest.approx(125.64)
