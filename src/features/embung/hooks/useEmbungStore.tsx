/**
 * =============================================================================
 * useEmbungStore — React Context-based store for Embung form state
 * =============================================================================
 * Preserves form data across tab switches and modal interactions.
 * Uses React Context (no extra Zustand dependency needed).
 * =============================================================================
 */

import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type {
    MonthlyData,
    SequentPeakResult,
    FloodRoutingInput,
    FloodRoutingResult,
    WaterBalanceConfig,
    WaterBalanceStepInput,
    WaterBalanceResult,
    SedimentationInput,
    SedimentYieldResult,
    StageStorageCurve,
    SpillwayConfig,
    ReservoirZoning,
} from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

interface EmbungState {
    /** Active sub-tab or step */
    activeTab: 'capacity' | 'routing' | 'operation' | 'sediment' | 'geometry';

    /** Step 1: Geometry Data (Curve builder) */
    stageStorageCurve: StageStorageCurve | null;

    /** Reservoir standard zoning (MAD, MAN, MAB) */
    zoning: ReservoirZoning | null;

    /** Spillway parameters (Crest El, Width, Cd) */
    spillwayConfig: SpillwayConfig | null;

    /** Tab 1: Capacity Analysis */
    capacityData: MonthlyData[];
    capacityResult: SequentPeakResult | null;

    /** Tab 2: Flood Routing */
    routingInput: Partial<FloodRoutingInput> | null;
    routingResult: FloodRoutingResult | null;

    /** Tab 3: Water Balance */
    waterBalanceConfig: Partial<WaterBalanceConfig> | null;
    waterBalanceSteps: WaterBalanceStepInput[];
    waterBalanceResult: WaterBalanceResult | null;

    /** Tab 4: Sedimentation */
    sedimentInput: Partial<SedimentationInput> | null;
    sedimentResult: SedimentYieldResult | null;

    /** Global UI state */
    isCalculating: boolean;
    lastError: string | null;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];

const DEFAULT_CAPACITY_DATA: MonthlyData[] = MONTH_LABELS.map((month, i) => ({
    id: String(i + 1),
    month,
    inflow: [1.2, 1.5, 1.1, 0.8, 0.5, 0.3, 0.2, 0.2, 0.4, 0.7, 1.0, 1.3][i] ?? 0,
    outflow: [0.8, 0.8, 0.9, 1.0, 1.2, 1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.8][i] ?? 0,
}));

export const DEFAULT_STAGE_STORAGE_CURVE: StageStorageCurve = {
    elevation: [100, 101, 102, 103, 104, 105],
    storage: [0, 50000, 120000, 210000, 320000, 450000],
    area: [0, 10000, 22000, 35000, 50000, 67000],
};

export const DEFAULT_ZONING: ReservoirZoning = {
    riverbedElevation: 100,
    deadStorageElevation: 101,
    normalWaterLevel: 104,
    floodWaterLevel: 105,
    freeboard: 1.0,
    deadStorageVolume: 50000,
    activeStorageVolume: 270000,
    floodStorageVolume: 130000,
    totalStorageVolume: 450000,
};

export const DEFAULT_SPILLWAY_CONFIG: SpillwayConfig = {
    crestElevation: 104,
    crestLength: 10.0,
    dischargeCoefficient: 2.0,
    spillwayType: 'ogee',
};

export const DEFAULT_WATER_BALANCE_STEPS: WaterBalanceStepInput[] = MONTH_LABELS.map(() => ({
    inflow: 50000,
    demand: 30000,
    evaporation: 120,
    rainfall: 150,
}));

const initialState: EmbungState = {
    activeTab: 'geometry',
    stageStorageCurve: DEFAULT_STAGE_STORAGE_CURVE,
    zoning: DEFAULT_ZONING,
    spillwayConfig: DEFAULT_SPILLWAY_CONFIG,
    capacityData: DEFAULT_CAPACITY_DATA,
    capacityResult: null,
    routingInput: null,
    routingResult: null,
    waterBalanceConfig: null,
    waterBalanceSteps: DEFAULT_WATER_BALANCE_STEPS,
    waterBalanceResult: null,
    sedimentInput: null,
    sedimentResult: null,
    isCalculating: false,
    lastError: null,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

type EmbungAction =
    | { type: 'SET_ACTIVE_TAB'; payload: EmbungState['activeTab'] }
    | { type: 'SET_STAGE_STORAGE_CURVE'; payload: StageStorageCurve | null }
    | { type: 'SET_ZONING'; payload: ReservoirZoning | null }
    | { type: 'SET_SPILLWAY_CONFIG'; payload: SpillwayConfig | null }
    | { type: 'SET_CAPACITY_DATA'; payload: MonthlyData[] }
    | { type: 'SET_CAPACITY_RESULT'; payload: SequentPeakResult | null }
    | { type: 'SET_ROUTING_INPUT'; payload: Partial<FloodRoutingInput> | null }
    | { type: 'SET_ROUTING_RESULT'; payload: FloodRoutingResult | null }
    | { type: 'SET_WATER_BALANCE_CONFIG'; payload: Partial<WaterBalanceConfig> | null }
    | { type: 'SET_WATER_BALANCE_STEPS'; payload: WaterBalanceStepInput[] }
    | { type: 'SET_WATER_BALANCE_RESULT'; payload: WaterBalanceResult | null }
    | { type: 'SET_SEDIMENT_INPUT'; payload: Partial<SedimentationInput> | null }
    | { type: 'SET_SEDIMENT_RESULT'; payload: SedimentYieldResult | null }
    | { type: 'SET_CALCULATING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'RESET' };

function embungReducer(state: EmbungState, action: EmbungAction): EmbungState {
    switch (action.type) {
        case 'SET_ACTIVE_TAB':
            return { ...state, activeTab: action.payload };
        case 'SET_STAGE_STORAGE_CURVE':
            return { ...state, stageStorageCurve: action.payload };
        case 'SET_ZONING':
            return { ...state, zoning: action.payload };
        case 'SET_SPILLWAY_CONFIG':
            return { ...state, spillwayConfig: action.payload };
        case 'SET_CAPACITY_DATA':
            return { ...state, capacityData: action.payload };
        case 'SET_CAPACITY_RESULT':
            return { ...state, capacityResult: action.payload };
        case 'SET_ROUTING_INPUT':
            return { ...state, routingInput: action.payload };
        case 'SET_ROUTING_RESULT':
            return { ...state, routingResult: action.payload };
        case 'SET_WATER_BALANCE_CONFIG':
            return { ...state, waterBalanceConfig: action.payload };
        case 'SET_WATER_BALANCE_STEPS':
            return { ...state, waterBalanceSteps: action.payload };
        case 'SET_WATER_BALANCE_RESULT':
            return { ...state, waterBalanceResult: action.payload };
        case 'SET_SEDIMENT_INPUT':
            return { ...state, sedimentInput: action.payload };
        case 'SET_SEDIMENT_RESULT':
            return { ...state, sedimentResult: action.payload };
        case 'SET_CALCULATING':
            return { ...state, isCalculating: action.payload };
        case 'SET_ERROR':
            return { ...state, lastError: action.payload };
        case 'RESET':
            return initialState;
        default:
            return state;
    }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EmbungContext = createContext<{
    state: EmbungState;
    dispatch: React.Dispatch<EmbungAction>;
} | null>(null);

export function EmbungProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(embungReducer, initialState);
    return (
        <EmbungContext.Provider value={{ state, dispatch }}>
            {children}
        </EmbungContext.Provider>
    );
}

export function useEmbungStore() {
    const ctx = useContext(EmbungContext);
    if (!ctx) throw new Error('useEmbungStore must be used within <EmbungProvider>');
    return ctx;
}
