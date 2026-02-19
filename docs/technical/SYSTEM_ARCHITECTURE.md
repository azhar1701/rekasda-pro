# System Architecture Documentation

**RekaSDA Pro - Rekayasa Sumber Daya Air**

Version: 1.0.0  
Last Updated: 2024

---

## 1. Project Overview

### 1.1 Introduction

**RekaSDA Pro** (Rekayasa Sumber Daya Air) is a production-grade web application designed for Indonesian water resources engineers. It provides specialized tools for hydrological analysis, hydraulic calculations, and water resources management.

### 1.2 Key Value Proposition

- **SNI Compliant**: All calculations strictly follow Indonesian National Standards (SNI)
- **Production Grade**: Professional-level accuracy and reliability
- **Field-Ready**: Mobile-first design for on-site data collection
- **AI-Powered**: Integrated virtual consultant for expert recommendations

### 1.3 Target Users

- Civil Engineers (Water Resources)
- Hydrologists
- Government Agencies (PUPR, BBWS)
- Consulting Firms
- Academic Researchers

---

## 2. Technology Stack

### 2.1 Core Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Runtime** | Node.js | 16+ | JavaScript runtime |
| **Framework** | React | 18.3.1 | UI library |
| **Language** | TypeScript | 5.9.3 | Type safety |
| **Build Tool** | Vite | 7.3.1 | Fast bundler |
| **Styling** | Tailwind CSS | 3.4.19 | Utility-first CSS |
| **Icons** | Lucide React | 0.563.0 | Icon library |

### 2.2 Key Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| **@supabase/supabase-js** | 2.93.2 | Database & Auth |
| **@google/generative-ai** | 0.21.0 | AI Consultant (Gemini) |
| **leaflet** | 1.9.4 | Interactive maps |
| **recharts** | 2.10.3 | Data visualization |
| **zod** | 3.23.8 | Schema validation |
| **@headlessui/react** | 2.2.9 | Accessible UI components |
| **clsx** + **tailwind-merge** | - | Conditional styling |

### 2.3 Development Tools

- **ESLint**: Code linting
- **TypeScript Compiler**: Type checking
- **Knip**: Dead code detection
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixes

---

## 3. Application Architecture

### 3.1 Architectural Pattern: Feature-Based Modular Design

RekaSDA Pro follows a **feature-based architecture** where each domain module is self-contained with its own components, hooks, types, and business logic.

```
src/
├── features/              # Domain-specific modules
│   ├── channel-analysis/  # Manning's equation calculations
│   ├── flood-analysis/    # Rational & Nakayasu methods
│   ├── water-balance/     # Supply vs demand analysis
│   ├── history/           # Data management & mapping
│   └── ai-consultant/     # Gemini AI integration
├── components/            # Shared UI components
│   ├── ui/               # Reusable "dumb" components
│   └── common/           # Shared logic components
├── lib/                  # Core libraries
│   ├── engine/           # Calculation engines
│   ├── utils/            # Helper functions
│   ├── constants/        # App constants
│   └── ai/               # AI configuration
├── services/             # API & business logic
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── data/                 # Pilot/sample data
```

### 3.2 Component Hierarchy

```
App.tsx (Root)
├── Header (Navigation)
├── Tab Navigation (Bottom/Floating)
└── Feature Modules
    ├── ManningCalculator
    ├── FloodDischargeCalculator
    ├── WaterBalanceTab
    ├── AllDataTab (History)
    └── GeminiConsultant (AI)
```

### 3.3 State Management Strategy

- **Local State**: React `useState` for component-level state
- **Custom Hooks**: Encapsulate complex logic (e.g., `useHydraulicCalculations`)
- **Context**: Minimal usage (ErrorBoundary, Toast notifications)
- **Database State**: Supabase real-time subscriptions via `useDatabase` hook

---

## 4. Core Modules & SNI Compliance

### 4.1 Channel Analysis Module

**Location**: `src/features/channel-analysis/`

#### Method: Manning's Equation
```
Q = (1/n) × A × R^(2/3) × S^(1/2)
```

**Features**:
- Geometric calculations (Trapezoidal, Rectangular, Circular)
- Hydraulic radius & wetted perimeter
- Froude number (flow regime classification)
- Freeboard safety analysis
- Reynolds number (turbulence analysis)

**Compliance**: 
- SNI 2415:2016 (Flood Design)
- SNI 03-3424-1994 (Open Channel Hydraulics)

**Key Files**:
- `ManningCalculator.tsx` - Main UI
- `lib/utils/calculations/manning.ts` - Calculation engine
- `ChannelVisualizer.tsx` - Cross-section visualization

---

### 4.2 Flood Analysis Module

**Location**: `src/features/flood-analysis/`

#### 4.2.1 Rational Method
```
Q = 0.278 × C × I × A
```
- **Use Case**: Small watersheds (<5000 ha)
- **Inputs**: Runoff coefficient (C), Rainfall intensity (I), Area (A)
- **Output**: Peak discharge (m³/s)

#### 4.2.2 HSS Nakayasu Method
```
Qp = (C × A × R) / (3.6 × Tp)
```
- **Use Case**: Larger watersheds with hourly rainfall data
- **Features**: Unit hydrograph generation, time-to-peak calculation
- **Output**: Complete hydrograph curve

**Compliance**: 
- **SNI 2415:2016** (Tata Cara Perhitungan Debit Banjir Rencana)
- Mononobe rainfall intensity formula
- Kirpich time of concentration

**Key Files**:
- `FloodDischargeCalculator.tsx` - Main UI
- `lib/utils/calculations/rational.ts` - Rational method
- `lib/utils/calculations/nakayasu.ts` - Nakayasu HSS
- `FloodHydrographChart.tsx` - Visualization

---

### 4.3 Water Balance Module

**Location**: `src/features/water-balance/`

#### Method: Supply vs Demand Analysis
```
Balance = Supply - (Domestic + Agriculture + Environmental)
```

**Features**:
- Monthly water balance calculation
- Dependable flow (Q80) calculation
- Domestic water demand (SNI 03-7065-2005)
- Irrigation demand (L/s/Ha)
- Environmental flow (10% of supply)
- Surplus/deficit identification
- Critical month analysis

**Compliance**:
- **SNI 19-6728.1-2002** (Penyusunan Neraca Sumber Daya Air)
- **SNI 6738:2015** (Perhitungan Debit Andalan)
- **SNI 03-7065-2005** (Standar Kebutuhan Air Domestik)

**Key Files**:
- `WaterBalanceTab.tsx` - Main UI
- `services/waterBalanceEngine.ts` - Calculation engine
- `WaterBalanceChart.tsx` - Monthly visualization
- `DependableFlowCalc.tsx` - Q80 calculator

---

### 4.4 History & Mapping Module

**Location**: `src/features/history/`

**Features**:
- Spatial visualization of all calculations
- Leaflet-based interactive maps
- Color-coded markers by calculation type:
  - 🔵 Blue: Channel (Manning)
  - 🔴 Red: Flood (Rational/Nakayasu)
  - 🟢 Green: Water Balance
- Click-to-focus with smooth flyTo animation
- Popup details with project metadata
- List/Map view toggle

**Key Files**:
- `AllDataTab.tsx` - Data management
- `HistoryMap.tsx` - Leaflet integration
- `services/allCalculationsService.ts` - Data aggregation

---

### 4.5 AI Consultant Module

**Location**: `src/features/ai-consultant/`

**Technology**: Google Gemini API (generative-ai)

**Features**:
- Context-aware hydrological analysis
- SNI compliance verification
- Design recommendations
- Natural language Q&A
- Calculation interpretation

**Key Files**:
- `GeminiConsultant.tsx` - Chat interface
- `services/geminiService.ts` - API integration
- `lib/ai/config.ts` - Model configuration

---

## 5. Data Flow & Database Schema

### 5.1 Data Flow Architecture

```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Zod Validation  │ (Schema validation)
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Calculation      │ (Pure functions)
│ Engine           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Result Display   │ (React components)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Supabase Save    │ (Optional persistence)
└──────────────────┘
```

### 5.2 Database Schema (Supabase/PostgreSQL)

#### Table: `manning_calculations`
```sql
CREATE TABLE manning_calculations (
  id UUID PRIMARY KEY,
  project_name VARCHAR(255),
  inputs JSONB,           -- Channel parameters
  results JSONB,          -- Calculated outputs
  created_at TIMESTAMPTZ
);
```

#### Table: `flood_calculations`
```sql
CREATE TABLE flood_calculations (
  id UUID PRIMARY KEY,
  method VARCHAR(20),     -- 'rational' | 'nakayasu'
  project_name VARCHAR(255),
  inputs JSONB,           -- Watershed parameters
  results JSONB,          -- Discharge & hydrograph
  created_at TIMESTAMPTZ
);
```

#### Table: `water_balance_calculations`
```sql
CREATE TABLE water_balance_calculations (
  id UUID PRIMARY KEY,
  project_name VARCHAR(255),
  monthly_inputs JSONB,   -- Supply & demand data
  monthly_results JSONB,  -- Monthly balance
  summary JSONB,          -- Critical month, totals
  created_at TIMESTAMPTZ
);
```

### 5.3 Data Persistence Strategy

- **Primary Storage**: Supabase (cloud PostgreSQL)
- **Fallback**: LocalStorage (offline mode)
- **Real-time**: Supabase subscriptions for live updates
- **Validation**: Zod schemas before DB write

---

## 6. Build & Deployment

### 6.1 Build Configuration

**Tool**: Vite 7.3.1

**Build Command**:
```bash
npm run build  # TypeScript check + Vite build
```

**Output**:
- `dist/` folder with optimized assets
- Code splitting by feature module
- Vendor chunk separation
- Service Worker for PWA support

### 6.2 Environment Variables

Required variables in `.env.local`:

```env
# Supabase (Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini AI (Optional)
VITE_API_KEY=your-gemini-api-key
```

### 6.3 Deployment Targets

- **Vercel** (Recommended): Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3 + CloudFront**: Enterprise hosting
- **Self-hosted**: Nginx + Node.js

### 6.4 Performance Optimizations

- **Code Splitting**: Feature-based chunks
- **Lazy Loading**: Route-level code splitting
- **Tree Shaking**: Unused code elimination
- **Image Optimization**: WebP format, lazy loading
- **Service Worker**: Offline caching strategy

---

## 7. Code Organization Principles

### 7.1 File Naming Conventions

- **Components**: PascalCase (e.g., `ManningCalculator.tsx`)
- **Utilities**: camelCase (e.g., `formatNumber.ts`)
- **Types**: PascalCase with `.types.ts` suffix
- **Constants**: UPPER_SNAKE_CASE in `constants.ts`

### 7.2 Import Aliases

```typescript
import { Button } from '@/components/ui/forms/Button';
import { useDatabase } from '@/hooks/useDatabase';
import { calculateManning } from '@/lib/utils/calculations/manning';
import { ManningInputs } from '@/types/hydrology';
```

### 7.3 Type Safety

- **Strict Mode**: Enabled in `tsconfig.json`
- **No Implicit Any**: All functions typed
- **Zod Schemas**: Runtime validation
- **Type Guards**: Safe type narrowing

---

## 8. Testing Strategy

### 8.1 Current Status

- **Manual Testing**: Comprehensive field testing
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint rules

### 8.2 Future Roadmap

- **Unit Tests**: Vitest for calculation engines
- **Integration Tests**: React Testing Library
- **E2E Tests**: Playwright for critical flows
- **Visual Regression**: Chromatic for UI

---

## 9. Security Considerations

### 9.1 Data Protection

- **Row Level Security (RLS)**: Enabled on Supabase tables
- **Environment Variables**: Sensitive keys in `.env.local`
- **Input Validation**: Zod schemas prevent injection
- **HTTPS Only**: Enforced in production

### 9.2 Authentication (Future)

- Supabase Auth integration planned
- Role-based access control (RBAC)
- Project ownership & sharing

---

## 10. Accessibility (WCAG 2.1)

- **Keyboard Navigation**: Full support
- **Screen Reader**: ARIA labels on interactive elements
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states
- **Mobile Touch Targets**: Minimum 44x44px

---

## 11. Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| Mobile Safari | iOS 13+ |
| Chrome Mobile | Android 8+ |

---

## 12. Performance Metrics

### 12.1 Target Metrics

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

### 12.2 Bundle Size

- **Initial Bundle**: ~200KB (gzipped)
- **Vendor Chunk**: ~150KB (React, Leaflet)
- **Feature Chunks**: 20-50KB each

---

## 13. Maintenance & Support

### 13.1 Documentation

- **User Guides**: `docs/guides/`
- **Technical Docs**: `docs/technical/`
- **API Reference**: `docs/api/`
- **Standards**: `docs/standards/`

### 13.2 Version Control

- **Git**: GitHub repository
- **Branching**: Feature branches + main
- **Commits**: Conventional commits format

### 13.3 Changelog

See `docs/CHANGELOG.md` for version history.

---

## 14. Future Enhancements

### 14.1 Planned Features

- [ ] Multi-user collaboration
- [ ] PDF report generation
- [ ] Offline-first PWA
- [ ] Mobile native apps (React Native)
- [ ] Advanced GIS integration
- [ ] Real-time sensor data integration

### 14.2 Technical Debt

- [ ] Comprehensive test coverage
- [ ] Performance monitoring (Sentry)
- [ ] Analytics integration
- [ ] Internationalization (i18n)

---

## 15. References

### 15.1 Indonesian National Standards (SNI)

- **SNI 2415:2016**: Tata Cara Perhitungan Debit Banjir Rencana
- **SNI 6738:2015**: Perhitungan Debit Andalan Sungai
- **SNI 19-6728.1-2002**: Penyusunan Neraca Sumber Daya Air
- **SNI 03-7065-2005**: Tata Cara Perencanaan Sistem Penyediaan Air Minum
- **SNI 03-3424-1994**: Tata Cara Perencanaan Drainase Permukaan Jalan

### 15.2 External Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Document Maintained By**: Development Team  
**Last Review**: 2024  
**Next Review**: Quarterly
