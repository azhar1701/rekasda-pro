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
} from '@/features/embung/types/embung.types';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

interface EmbungState {
    /** Active sub-tab or step */
    activeTab: 'capacity' | 'routing' | 'operation' | 'sediment' | 'geometry';

    /** Step 1: Geometry Data (Curve builder) */
    stageStorageCurve: StageStorageCurve | null;

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
    inflow: 0,
    outflow: 0,
}));

const initialState: EmbungState = {
    activeTab: 'geometry',
    stageStorageCurve: null,
    capacityData: DEFAULT_CAPACITY_DATA,
    capacityResult: null,
    routingInput: null,
    routingResult: null,
    waterBalanceConfig: null,
    waterBalanceSteps: [],
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
