import pytest
from rekasda_engine.water_balance.fj_mock import calculate_fj_mock

def test_fj_mock_simple():
    """
    Test FJ Mock calculation with simple inputs.
    Checks if water balance components sum up reasonably.
    """
    # 12 months of test data (mm/bulan) — Stasiun Pilot Citanduy
    p   = [120, 150, 180, 210, 90, 60, 40, 30, 50, 80, 130, 160]
    pet = [100] * 12  # Evapotranspirasi potensial (mm/bulan)

    # 12 months of test data
    data = [
        {"month": str(i), "precipitation": p[i], "eto": pet[i], "daysInMonth": 30}
        for i in range(12)
    ]
    params = {
        "luasDas": 100.0,
        "smc": 3.0,
        "ism": 50.0,
        "infiltrationFactor": 0.1,
        "k": 0.7,
        "exposedSurface": 0.1,
        "initialGwStorage": 10.0
    }
    
    result = calculate_fj_mock(params, data)
    
    assert len(result) == 12
    # Total discharge should be positive for high rainfall months
    assert result[0]['discharge'] > 0
