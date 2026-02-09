# 🏗️ TECHNICAL ARCHITECTURE & DEPENDENCIES

**Visual system design untuk memahami bagaimana fitur-fitur terintegrasi**

---

## 🔗 FEATURE DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────┐
│                    CORE APPLICATION                          │
│  (React 18.3 + TypeScript + Tailwind + Supabase)            │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼──────────────┐
                │             │              │
         INPUTS/FORMS    CALCULATIONS   UTILITIES
                │             │              │
     ┌──────────┴─────┐  ┌────┴────┐  ┌─────┴─────┐
     │ Manning Input  │  │ Manning │  │ Validation│
     │ Rational Input │  │ Rational│  │Formatting │
     │ Manual Entry   │  │ Helpers │  │ Numbers   │
     └────────────────┘  └─────────┘  └───────────┘
             │                │              │
             └────────────────┼──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PHASE 1 FEATURES  │
                    └───────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      DATA LAYER    PRESENTATION   BUSINESS LOGIC
          │              │              │
    ┌─────┴──────┐  ┌────┴────┐  ┌─────┴──────┐
    │ Database   │  │Analytics │  │Validation  │
    │ (Supabase) │  │Dashboard │  │Engine      │
    │ Local      │  │Reports   │  │Comparison  │
    │ Storage    │  │Charts    │  │Logic       │
    └────────────┘  └──────────┘  └────────────┘
         │              │              │
      PHASE 1B       PHASE 2        PHASE 1A
      (Database)     (Advanced)    (Analysis)
         │              │              │
         └──────────────┼──────────────┘
                        │
        ┌───────────────┴───────────────┐
        │      INTEGRATION LAYER        │
        │  (APIs, Real-time, Offline)   │
        └───────────────┬───────────────┘
                        │
         ┌──────────────┬──────────────┐
         │              │              │
      PHASE 2        PHASE 3     EXTENDED
      (Teams)       (Visual)     (Mobile App)
         │              │              │
    ┌────┴─────┐   ┌────┴────┐   ┌─────┴────┐
    │Project    │   │3D Viz   │   │Native App│
    │Collab     │   │ML/AI    │   │SDK/APIs  │
    │Search     │   │Templates│   │Webhooks  │
    └──────────┘    └─────────┘   └──────────┘
```

---

## 🎯 FEATURE IMPLEMENTATION LAYERS

### Layer 1: FOUNDATION (Current App)
```
✅ Manning Calculator
✅ Rational Calculator
✅ Location Management
✅ Database Integration (Supabase)
✅ AI Consultant (Gemini)
✅ Map Visualization (Leaflet)
✅ Basic UI Components
```

### Layer 2: PHASE 1 QUICK WINS (Weeks 1-4)
```
Feature #1: Analytics Dashboard
├─ Components:
│  ├─ StatisticsCard.tsx
│  ├─ TrendChart.tsx
│  └─ AnalyticsDashboard.tsx
├─ Dependencies:
│  ├─ recharts
│  └─ date-fns
└─ Database: READ-ONLY (no schema changes)

Feature #2: Batch Calculator
├─ Components:
│  ├─ BatchCalculator.tsx
│  ├─ FileUploadZone.tsx
│  ├─ PreviewTable.tsx
│  └─ ProgressBar.tsx
├─ Services:
│  └─ batchCalculationService.ts (new)
├─ Dependencies:
│  └─ papaparse
└─ Database: READ-WRITE (same schema)

Feature #3: Enhanced Validation
├─ Utils:
│  ├─ engineeringValidators.ts (new)
│  └─ materialValidators.ts (new)
├─ Components:
│  └─ ValidationPanel.tsx
├─ Dependencies: NONE (pure TS)
└─ Database: READ-ONLY

Feature #5: Mobile Responsive
├─ Update: All existing components
├─ Hook: useResponsive.ts
├─ Tailwind: Breakpoint optimization
├─ Dependencies: NONE
└─ Database: No changes
```

### Layer 3: PHASE 2 ENTERPRISE (Weeks 5-12)
```
Feature #4: Comparison Tool
├─ Components:
│  ├─ ComparisonTool.tsx
│  └─ SensitivityAnalysis.tsx
├─ Utils:
│  └─ analysisHelpers.ts
└─ Database: READ-ONLY

Feature #6: PDF Reports
├─ Components:
│  └─ PDFReportGenerator.tsx
├─ Dependencies:
│  ├─ jspdf
│  └─ html2canvas
└─ Database: READ-ONLY

Feature #7: Project Management
├─ Components:
│  ├─ ProjectManager.tsx
│  ├─ ProjectBoard.tsx
│  ├─ TeamCollaboration.tsx
│  └─ StatusWorkflow.tsx
├─ Database: SCHEMA CHANGES
│  ├─ projects table (NEW)
│  ├─ project_calculations (NEW)
│  └─ project_members (NEW)
└─ Store: ProjectContext.tsx

Feature #9: Advanced Search
├─ Components:
│  ├─ AdvancedSearch.tsx
│  ├─ SavedFilters.tsx
│  └─ FullTextSearch.tsx
├─ Hook: useAdvancedSearch.ts
└─ Database: INDEXES (performance)
```

### Layer 4: PHASE 3 INNOVATION (Weeks 13+)
```
Feature #8: Offline Mode
├─ Hook: useOfflineSync.ts
├─ Dependencies:
│  ├─ dexie (IndexedDB)
│  ├─ workbox-window (Service Worker)
│  └─ idb-keyval
├─ Database: LOCAL (IndexedDB)
└─ Service Worker: file-based cache

Feature #10: Real-time Collaboration
├─ Dependencies:
│  ├─ supabase-realtime (built-in)
│  ├─ yjs
│  └─ y-websocket
├─ Components:
│  ├─ LiveCursors.tsx
│  ├─ Comments.tsx
│  └─ ActivityFeed.tsx
├─ Store: CollaborationContext.tsx
└─ Database: presence table (NEW)

Feature #11: 3D Visualization
├─ Dependencies:
│  ├─ babylon.js OR three.js
│  └─ plotly.js
├─ Components:
│  ├─ CrossSection3D.tsx
│  ├─ FlowAnimation.tsx
│  └─ GeometryBuilder.tsx
└─ Database: No schema changes

Feature #13: ML/AI Optimization
├─ Dependencies:
│  ├─ tensorflow.js
│  └─ ml5.js
├─ Services:
│  └─ mlOptimizationService.ts
└─ Database: models table (NEW)
```

---

## 📊 DATA FLOW ARCHITECTURE

### Basic Calculation Flow (Current)
```
User Input
    ↓
[ManningCalculator/RationalCalculator]
    ↓
calculateManning() / calculateRational()
    ↓
[Validation] → Errors? → [Error Display]
    ↓
[Result Display]
    ↓
[Save to Database] (via useDatabase hook)
    ↓
[Supabase calculations table]
```

### Enhanced Flow with New Features
```
USER INPUT SOURCES:
├─ Single calculation (existing)
├─ Batch upload (Feature #2)
├─ Manual entry (existing)
└─ API endpoint (Feature #14 future)
    ↓
[VALIDATION ENGINE] (Feature #3)
├─ Basic range checks
├─ Context validation (land-use, materials)
└─ Engineering standards
    ↓
[FILTERING]
├─ Accept valid ✅
├─ Warn on suspicious ⚠️
└─ Reject invalid ❌
    ↓
[CALCULATION]
├─ Manning Method
├─ Rational Method
└─ Batch Process (Feature #2)
    ↓
[RESULTS PROCESSING]
├─ Format numbers
├─ Calculate statistics
└─ Generate alternatives
    ↓
[STORAGE LAYER]
├─ Supabase (Online)
├─ IndexedDB (Offline - Feature #8)
└─ Local State
    ↓
[PRESENTATION LAYER]
├─ Display (Feature #4)
├─ Analytics (Feature #1)
├─ Reports (Feature #6)
├─ Comparison (Feature #4)
└─ 3D Viz (Feature #11)
    ↓
[EXPORT/SHARE]
├─ PDF (Feature #6)
├─ Excel/CSV (Feature #2)
├─ Project (Feature #7)
└─ API (Feature #14)
```

---

## 🗂️ DATABASE SCHEMA EVOLUTION

### Current Schema (Phase 0)
```sql
-- Existing
calculations
├─ id (UUID, PK)
├─ calculation_type (enum)
├─ input_data (JSONB)
├─ result_data (JSONB)
├─ location (POINT)
├─ created_at (TIMESTAMP)
└─ created_by (UUID, FK)
```

### Phase 1 Addition (Final - Weeks 1-4)
```sql
-- Same schema + Views/Indexes
-- ADD INDEX on calculation_type, created_at
-- ADD VIEW for analytics
-- NO new tables needed
```

### Phase 2 Addition (Weeks 5-12)
```sql
-- NEW TABLES:
projects
├─ id (UUID, PK)
├─ name (VARCHAR)
├─ description (TEXT)
├─ location (POINT)
├─ created_by (UUID, FK)
├─ status (enum)
└─ created_at (TIMESTAMP)

project_calculations
├─ id (UUID, PK)
├─ project_id (UUID, FK)
├─ calculation_id (UUID, FK)
├─ notes (TEXT)
└─ status (enum) ← approval workflow

team_members
├─ id (UUID, PK)
├─ project_id (UUID, FK)
├─ user_id (UUID, FK)
├─ role (enum) ← view/edit/admin
└─ joined_at (TIMESTAMP)

-- ADD: saved_searches table
-- ADD: comments table (for Feature #10)
-- ADD: indexes for performance
```

### Phase 3 Addition (Optional)
```sql
-- NEW TABLES:
presence (for real-time collaboration)
├─ user_id (UUID)
├─ project_id (UUID)
├─ last_active (TIMESTAMP)
└─ cursor_position (JSONB)

ml_models (for AI optimization)
├─ id (UUID, PK)
├─ name (VARCHAR)
├─ type (enum)
├─ model_data (BYTEA)
└─ accuracy (NUMERIC)

-- ADD: audit_log table
-- ADD: notifications table
-- ADD: user_preferences table
```

---

## 🔄 TECHNOLOGY STACK EVOLUTION

### Phase 0: Current
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.21.0",
    "@supabase/supabase-js": "^2.93.2",
    "react": "^18.3.1",
    "leaflet": "^1.9.4"
  }
}
```

### Phase 1: Quick Wins (Add)
```json
{
  "add": {
    "recharts": "^2.12.0",
    "date-fns": "^2.30.0",
    "papaparse": "^5.4.1"
  },
  "total_bundle_size": "+350KB"
}
```

### Phase 2: Enterprise (Add)
```json
{
  "add": {
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "lodash-es": "^4.17.21"
  },
  "total_bundle_size": "+150KB"
}
```

### Phase 3: Innovation (Optional)
```json
{
  "add": {
    "tensorflow.js": "^4.x",
    "babylon.js": "^6.0.0",
    "dexie": "^4.0.7",
    "yjs": "^13.x"
  },
  "total_bundle_size": "+2.5MB"
}
```

---

## 🚀 DEPLOYMENT STRATEGY

### Phase 1 Deployment (After Week 4)
```
Changes:
├─ 4 new component folders
├─ 3 new utilities
├─ 2 new dependencies
└─ 0 database changes

Risk Level: 🟢 LOW
Rollback Time: < 5 minutes (no DB issues)
Canary Deployment: 10% users first

Metrics to Monitor:
├─ Page load time (should stay <2s)
├─ Calculation speed (unchanged)
├─ Bundle size (increased ~350KB)
└─ Error rate (should be 0%)
```

### Phase 2 Deployment (After Week 12)
```
Changes:
├─ 2 new component folders
├─ 3 new database tables
├─ 4 new dependencies
└─ Database indexes

Risk Level: 🟡 MEDIUM
Rollback Time: 10-15 minutes (DB migration)
Deployment: Database migration first, then code

Steps:
1. Backup production database
2. Run migration scripts
3. Verify schema changes
4. Deploy new code version
5. Test on staging first
6. Gradual rollout (25% → 50% → 100%)

Metrics to Monitor:
├─ Database performance
├─ API response times
├─ Concurrent users
└─ Error rates
```

### Phase 3 Deployment (Optional)
```
Changes:
├─ Advanced features
├─ ML model training
├─ Service worker
└─ Real-time infrastructure

Risk Level: 🔴 HIGH
Rollback Time: 20-30 minutes
Deployment: Requires DevOps planning

Special Considerations:
├─ ML model training pipelines
├─ Service Worker caching strategy
├─ Real-time database connections
└─ Offline sync conflicts
```

---

## 📋 DEPENDENCY IMPACT MATRIX

```
Feature         │ UI Components │ Database │ Dependencies │ Service Worker │ Bundle Size
────────────────┼───────────────┼──────────┼──────────────┼────────────────┼────────────
#1 Analytics    │ ★★★ (High)    │ None     │ +350KB       │ No             │ +350KB
#2 Batch Calc   │ ★★☆ (Med)     │ None     │ +100KB       │ No             │ +100KB
#3 Validation   │ ★☆☆ (Low)     │ None     │ None         │ No             │ None
#4 Comparison   │ ★★☆ (Med)     │ None     │ +50KB        │ No             │ +50KB
#5 Mobile       │ ★★★ (High)    │ None     │ None         │ No             │ None
#6 PDF Reports  │ ★★☆ (Med)     │ None     │ +250KB       │ No             │ +250KB
#7 Projects     │ ★★★ (High)    │ ★★★     │ +100KB       │ No             │ +100KB
#8 Offline      │ ★☆☆ (Low)     │ ★★☆     │ +200KB       │ ★★★ YES        │ +200KB
#9 Search       │ ★★☆ (Med)     │ ★☆☆     │ None         │ No             │ None
#10 Real-time   │ ★☆☆ (Low)     │ ★★☆     │ +300KB       │ No             │ +300KB
#11 3D Viz      │ ★★★ (High)    │ None     │ +2MB         │ No             │ +2MB
#12 Templates   │ ★★☆ (Med)     │ ★☆☆     │ None         │ No             │ None
#13 ML/AI       │ ★★☆ (Med)     │ ★★☆     │ +1.5MB       │ No             │ +1.5MB
#14 API SDK     │ None          │ None     │ +50KB        │ No             │ +50KB
#15 Mobile App  │ N/A           │ Shared   │ RN stack     │ N/A            │ Separate app
```

---

## 🔐 DATA SECURITY ARCHITECTURE

### Current Security
```
✅ Supabase RLS (Row Level Security)
✅ JWT Authentication
✅ HTTPS only
✅ User Isolation (calculations)
❌ No encryption at rest
❌ No audit trail
```

### Phase 2 Additions (Recommended)
```
✅ Project-level permissions (RLS)
✅ Team member verification
✅ Audit log for compliance
✅ Encrypted sensitive fields
✅ API key management (Feature #14)

RLS Policies:
├─ calculations: Users can only see own + shared
├─ projects: Only team members can access
├─ comments: Team members only
└─ audit_log: Only project owner
```

---

## 🎯 MIGRATION CHECKLIST

### Before Each Phase

```
PRE-IMPLEMENTATION
□ Backup production database
□ Test on staging environment
□ Load tests for performance
□ Security audit
□ Accessibility audit

DEPLOYMENT
□ Database migrations (if needed)
□ Zero-downtime deployment tested
□ Rollback plan documented
□ Monitoring setup confirmed
□ Alert thresholds configured

POST-DEPLOYMENT
□ Smoke tests passed
□ User acceptance testing done
□ Performance metrics baseline
□ Feature flags activated gradually
□ Team training completed
```

---

## 📈 SCALABILITY ROADMAP

### Current Capacity
```
Users: 100-500 concurrent
Calculations/day: 5K-10K
Data: ~5GB
Response time: <1s
Uptime: 99.5% (current)
```

### After Phase 2 Optimization
```
Users: 1000-5000 concurrent
Calculations/day: 50K-100K
Data: ~50GB
Response time: <500ms
Uptime: 99.9%

Infrastructure improvements:
├─ Database indexing
├─ Caching strategies (Redis)
├─ CDN for static assets
└─ Load balancing
```

### After Phase 3 Scaling
```
Users: 10K-50K concurrent
Calculations/day: 500K+
Data: ~500GB
Response time: <200ms
Uptime: 99.99%

Advanced infrastructure:
├─ Database replication
├─ Microservices (ML training)
├─ Global CDN
├─ Multiple regions
└─ Auto-scaling
```

---

## 🏁 CONCLUSION

The upgrade path is **clear, modular, and low-risk** when implemented in phases:

```
Phase 1: Quick wins (Low risk, high ROI)
    ↓
Phase 2: Enterprise features (Medium risk, high value)
    ↓
Phase 3: Innovation (Higher risk, competitive advantage)
    ↓
Market Leader Position! 🚀
```

Each phase stands alone but compound for maximum impact.

---

**Next Step**: Review this architecture with your tech team and confirm Phase 1 dependencies.
