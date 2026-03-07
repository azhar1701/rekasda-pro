from __future__ import annotations
import math
from typing import TypedDict, Literal

# Constants
GRAVITY = 9.81  # m/s²
WATER_UNIT_WEIGHT = 9810  # N/m³
KINEMATIC_VISCOSITY = 1.004e-6  # m²/s at 20°C

class ManningResults(TypedDict):
    Area: str
    Perimeter: str
    Radius: str
    TopWidth: str
    Velocity: str
    Discharge: str
    Froude: str
    FlowType: str
    VelocityHead: str
    SpecificEnergy: str
    ReynoldsNumber: str
    ShearStress: str
    StreamPower: str
    Freeboard: str
    SafetyStatus: str

def calculate_trapezoid_area(bottom_width: float, water_depth: float, side_slope: float) -> float:
    """
    Calculate cross-sectional area for trapezoid channel
    Formula: A = (b + z*h) * h
    """
    if bottom_width <= 0 or water_depth <= 0:
        return 0.0
    return (bottom_width + side_slope * water_depth) * water_depth

def calculate_trapezoid_perimeter(bottom_width: float, water_depth: float, side_slope: float) -> float:
    """
    Calculate wetted perimeter for trapezoid channel
    Formula: P = b + 2*h*√(1+z²)
    """
    if bottom_width <= 0 or water_depth <= 0:
        return 0.0
    return bottom_width + 2 * water_depth * math.sqrt(1 + side_slope * side_slope)

def calculate_circular_geometry(diameter: float, depth: float) -> dict[str, float]:
    """
    Calculate geometry for circular channel using central angle method
    θ = 2 * arccos(1 - 2h/D)
    """
    D = diameter
    h = min(depth, D)

    if h <= 0 or h > D:
        return {"area": 0.0, "perimeter": 0.0, "top_width": 0.0}

    # Central angle (radians)
    theta = 2 * math.acos(1 - (2 * h) / D)

    # Cross-sectional area
    area = (D**2 / 8) * (theta - math.sin(theta))

    # Wetted perimeter (arc length)
    perimeter = (theta * D) / 2

    # Top width (chord length)
    top_width = D * math.sin(theta / 2)

    return {"area": area, "perimeter": perimeter, "top_width": top_width}

def calculate_hydraulic_radius(area: float, perimeter: float) -> float:
    """R = A / P"""
    return area / perimeter if perimeter > 0 else 0.0

def calculate_manning_velocity(roughness: float, hydraulic_radius: float, slope: float) -> float:
    """V = (1/n) * R^(2/3) * S^(1/2)"""
    if roughness <= 0 or hydraulic_radius <= 0 or slope <= 0:
        return 0.0
    velocity = (1 / roughness) * (hydraulic_radius**(2/3)) * (slope**0.5)
    return velocity if math.isfinite(velocity) else 0.0

def calculate_discharge(area: float, velocity: float) -> float:
    """Q = A * V"""
    return area * velocity

def calculate_froude_number(velocity: float, hydraulic_depth: float) -> float:
    """Fr = V / √(g * Dh)"""
    if hydraulic_depth <= 0:
        return 0.0
    sqrt_g_dh = math.sqrt(GRAVITY * hydraulic_depth)
    return velocity / sqrt_g_dh if sqrt_g_dh > 0 else 0.0

def classify_flow_regime(froude_number: float) -> str:
    if froude_number < 0.9:
        return 'Sub-kritis (Aliran Tenang)'
    if froude_number > 1.1:
        return 'Super-kritis (Aliran Deras)'
    return 'Kritis'

def calculate_reynolds_number(velocity: float, radius: float) -> str:
    """Re = V*R / ν"""
    re = (velocity * radius) / KINEMATIC_VISCOSITY
    if re < 500:
        return f"Laminar (Re = {re:.0f})"
    if re < 2000:
        return f"Transisi (Re = {re:.0f})"
    return f"Turbulen (Re = {re:.0f})"

def calculate_velocity_head(velocity: float) -> float:
    """hv = V² / (2g)"""
    return (velocity * velocity) / (2 * GRAVITY)

def calculate_shear_stress(unit_weight: float, radius: float, slope: float) -> float:
    """τ = γ * R * S"""
    return unit_weight * radius * slope

def calculate_manning(
    shape: Literal['circular', 'trapezoid'],
    roughness: float,
    slope: float,
    depth: float,
    width: float = 0.0,
    diameter: float = 0.0,
    side_slope: float = 0.0
) -> ManningResults:
    """
    Full Manning calculation with comprehensive hydraulic parameters
    """
    # ===== INPUT VALIDATION =====
    if roughness <= 0:
        raise ValueError('Manning roughness coefficient must be > 0')
    if not (0 < slope <= 1):
        raise ValueError('Slope must be between 0 and 1 m/m')
    if depth <= 0:
        raise ValueError('Water depth must be > 0')

    # ===== GEOMETRY CALCULATIONS =====
    area = 0.0
    perimeter = 0.0
    top_width = 0.0

    if shape == 'circular':
        if diameter <= 0:
            raise ValueError('Diameter must be > 0')
        circular = calculate_circular_geometry(diameter, depth)
        area = circular["area"]
        perimeter = circular["perimeter"]
        top_width = circular["top_width"]
    else:
        # TRAPEZOID (default)
        if width <= 0:
            raise ValueError('Channel width must be > 0')
        area = calculate_trapezoid_area(width, depth, side_slope)
        perimeter = calculate_trapezoid_perimeter(width, depth, side_slope)
        top_width = width + 2 * side_slope * depth

    # ===== BASIC HYDRAULICS =====
    radius = calculate_hydraulic_radius(area, perimeter)
    velocity = calculate_manning_velocity(roughness, radius, slope)
    discharge = calculate_discharge(area, velocity)

    # ===== FLOW CHARACTERISTICS =====
    hydraulic_depth = area / top_width if top_width > 0 else 0.0
    froude_number = calculate_froude_number(velocity, hydraulic_depth)
    flow_type = classify_flow_regime(froude_number)

    # ===== ENERGY & MOMENTUM =====
    velocity_head = calculate_velocity_head(velocity)
    specific_energy = depth + velocity_head
    shear_stress = calculate_shear_stress(WATER_UNIT_WEIGHT, radius, slope)
    stream_power = WATER_UNIT_WEIGHT * discharge * slope

    # ===== FLOW REGIMES =====
    reynolds_classification = calculate_reynolds_number(velocity, radius)

    # ===== SAFETY CHECKS =====
    physical_height = diameter if shape == 'circular' else depth * 1.5
    freeboard = max(0.0, physical_height - depth)
    
    if freeboard < 0: # Should not happen due to max(0, ...) but following TS logic
        safety_status = 'MELUAP'
    elif freeboard < 0.3:
        safety_status = 'Waspada'
    else:
        safety_status = 'Aman'

    # Re-check MELUAP if depth > physicalHeight (for circular)
    if shape == 'circular' and depth > diameter:
        safety_status = 'MELUAP'
        freeboard = 0.0

    return {
        "Area": f"{area:.3f}",
        "Perimeter": f"{perimeter:.3f}",
        "Radius": f"{radius:.3f}",
        "TopWidth": f"{top_width:.3f}",
        "Velocity": f"{velocity:.3f}",
        "Discharge": f"{discharge:.3f}",
        "Froude": f"{froude_number:.3f}",
        "FlowType": flow_type,
        "VelocityHead": f"{velocity_head:.3f}",
        "SpecificEnergy": f"{specific_energy:.3f}",
        "ReynoldsNumber": reynolds_classification,
        "ShearStress": f"{shear_stress:.2f}",
        "StreamPower": f"{stream_power:.2f}",
        "Freeboard": f"{freeboard:.3f}",
        "SafetyStatus": safety_status,
    }
