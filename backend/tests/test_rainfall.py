import pytest
from rekasda_engine.rainfall.abm import generate_hyetograph, arrange_abm

def test_abm_precision_sni():
    """
    Validation test for ABM (Alternating Block Method).
    Checks if the intensities are calculated correctly and peak is central.
    """
    r_total = 100.0  # mm
    duration = 4  # hours
    
    # generate_hyetograph(R24, duration)
    result = generate_hyetograph(r_total, duration)
    
    assert result['durasi'] == 4
    # The sum of blocks should be equal to the cumulative at t=4
    # I(4) = (100/24) * (24/4)^(2/3) = 4.166 * 3.3019 = 13.758
    # Cumulative = 13.758 * 4 = 55.03
    assert result['totalHujan'] == pytest.approx(55.03, rel=1e-2)
    
    # Check if peak is roughly central (for 4 blocks, index 1 or 2 should be highest)
    # result['rows'] is a list of dicts with 'abm' key
    abm_values = [row['abm'] for row in result['rows']]
    max_val = max(abm_values)
    max_idx = abm_values.index(max_val)
    assert max_idx in [1, 2]

def test_abm_zero_input():
    with pytest.raises(ValueError):
        generate_hyetograph(0, 6)
