import pytest
from rekasda_engine.flood.nakayasu import hss_nakayasu
from rekasda_engine.flood.rational import rational_method

def test_nakayasu_sni_case():
    """
    Validation for Nakayasu HSS.
    Based on standard example: A=10km2, L=5km, Ro=1mm, Tr=1h, Alpha=2
    """
    Ro = 1.0
    Tg = 0.0 # letting it calculate
    Tr = 1.0
    Alpha = 2.0
    A = 10.0
    L = 5.0
    
    result = hss_nakayasu(Ro, Tg, Tr, Alpha, A, L)
    
    # Tg = 0.4 + 0.058*5 = 0.4 + 0.29 = 0.69
    # Tp = 0.69 + 0.8*1 = 1.49
    assert result['Tp'] == pytest.approx(1.49, rel=1e-2)
    
    # Qp = (10 * 1) / (3.6 * (0.3 * 1.49 + 2 * 0.69))
    # Qp = 10 / (3.6 * (0.447 + 1.38)) = 10 / (3.6 * 1.827) = 10 / 6.5772 = 1.52
    assert result['Qp'] == pytest.approx(1.52, rel=1e-2)
    
    # Hydrograph endpoints
    assert result['hydrograph'][0]['discharge'] == 0
    # Peak should be at roughly t=1.5
    peak_points = [p for p in result['hydrograph'] if p['time'] == 1.5]
    if peak_points:
        assert peak_points[0]['discharge'] == pytest.approx(1.52, rel=1e-1)
