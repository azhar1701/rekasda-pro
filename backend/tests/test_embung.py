import pytest
import numpy as np
from rekasda_engine.embung.routing import calculate_flood_routing

def test_reservoir_routing_simple():
    """
    Standard Level-Pool Routing Test.
    Checks if outflow is attenuated and delayed compared to inflow.
    """
    # Simple triangular inflow
    inflow = [
        {"time": 0, "discharge": 0},
        {"time": 3600, "discharge": 10},
        {"time": 7200, "discharge": 20},
        {"time": 10800, "discharge": 10},
        {"time": 14400, "discharge": 0},
    ]
    
    # Simple Stage-Storage-Discharge (Linear)
    curves = {
        "elevation": [100.0, 101.0, 102.0],
        "storage": [0, 10000, 20000],
        "discharge": [0, 5, 10]
    }
    
    result = calculate_flood_routing(
        inflowHydrograph=inflow,
        stageStorageCurve=curves,
        stageDischargeCurve=curves, # simplified
        deltaT=3600,
        initialElevation=100.0
    )
    
    assert result['peakInflow'] == 20
    # Peak outflow should be lower than peak inflow due to attenuation
    assert result['peakOutflow'] < 20
    # Attenuation ratio is percentage (1 - O/I) * 100
    assert 0 < result['attenuationRatio'] < 100
    
    # Final step checks
    assert len(result['steps']) > 0
    assert result['steps'][0]['elevation'] == 100.0
