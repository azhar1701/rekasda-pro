<div align="center">

# 💧 RekaSDA Pro

**Professional Water Resources Engineering Platform**

*Modern web application for hydrological analysis compliant with Indonesian National Standards (SNI).*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-DB_&_Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI_Powered-8E75B2?logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Core Features](#-core-features)
- [🏛️ SNI Compliance](#️-sni-compliance)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [🚀 Getting Started](#-getting-started)
- [💻 Development & Scripts](#-development--scripts)
- [🗺️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [📄 License & Support](#-license--support)

---

## 🎯 Overview

**RekaSDA Pro** eliminates manual calculation errors and accelerates hydrological workflows for Indonesian civil engineers. Built with a modern, reactive tech stack and integrated with AI capabilities, it offers production-grade accuracy, real-time spatial mapping, and fully SNI-compliant methodologies.

**Key Benefits:**
- **Zero Magic Numbers:** Strict adherence to parameters defined in `src/lib/constants/sni.ts`.
- **High Performance:** Heavy mathematical calculations run asynchronously via Web Workers to keep the UI smooth.
- **Enterprise UI/UX:** High-density, professional GovTech standard interfaces for complex data matrices.
- **Single Source of Truth (SSOT):** Robust state management funneling from Supabase down to the calculation engines.

---

## ✨ Core Features

### 🌊 Flood Analysis
Calculate design flood discharge using multiple established methodologies:
- **Rational Method** (optimized for watersheds $\le$ 300 ha)
- **HSS Nakayasu** (Unit hydrograph with standard $\alpha = 2.0$)
- **Frequency Analysis** (Log Pearson III, Gumbel, Normal, Log-Normal)
- **Return Periods:** Q2, Q5, Q10, Q25, Q50, Q100

### 📏 Channel Analysis (Hydraulics)
Calculate hydraulic capacity and ensure safety parameters for open channels:
- **Manning's Equation** integration
- **Geometric Analysis:** Trapezoidal, rectangular, circular
- **Safety Measures:** Flow regime classification and freeboard safety checks

### ⚖️ Water Balance (Neraca Air)
Comprehensive supply vs. demand analysis for regional planning:
- 12-month monthly balance tracking
- Dependable flow determination (Q80)
- Domestic and irrigation demand calculation
- Environmental flow baseline (10% rule)

### 🤖 AI Engineering Consultant
Integrated Google Gemini assistant designed for Civil Engineering:
- Context-aware design recommendations
- SNI compliance verification
- Natural language querying of project parameters

### 🗺️ Interactive Spatial Mapping
Built-in GIS capabilities:
- **Leaflet + OpenStreetMap** integration
- Visual categorization (Blue: Channel, Red: Flood, Green: Water Balance)
- Spatial data tracking via PostGIS in Supabase

---

## 🏛️ SNI Compliance

RekaSDA Pro strictly adheres to the following Indonesian National Standards:

| Standard | Scope of Application |
|----------|-------------|
| **SNI 2415:2016** | Flood discharge calculation procedures |
| **SNI 6738:2015** | Dependable flow analysis methodology |
| **SNI 19-6728.1-2002** | Water balance calculation methodology |
| **SNI 03-7065-2005** | Domestic water demand projection |
| **SNI 03-3424-1994** | Open channel hydraulic planning |

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework:** React 18.3 + TypeScript 5.9
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS 3.4, `clsx`, `tailwind-merge`
- **State Management:** Zustand, TanStack React Query
- **Routing:** React Router v6

### Data & Visualization
- **Charts:** Recharts 2.10
- **Mapping:** Leaflet 1.9, React-Leaflet, Turf.js
- **Math/Formulas:** KaTeX, React-KaTeX

### Backend & Infrastructure
- **BaaS:** Supabase (PostgreSQL, PostGIS, Auth, Storage)
- **Edge Functions:** Deno-based Supabase Functions
- **AI Integration:** `@google/generative-ai`

---

## 🏗️ System Architecture

```text
rekasda-pro/
├── src/
│   ├── components/      # Reusable GovTech UI components
│   ├── features/        # Domain-driven modules (flood, channel, etc.)
│   ├── lib/
│   │   ├── constants/   # SNI Constants (sni.ts - The SSOT)
│   │   └── utils/       # Hydrology math engines & formulas
│   ├── services/        # Supabase, Gemini AI, and external APIs
│   ├── stores/          # Zustand global stores
│   ├── types/           # Strict TypeScript interfaces
│   └── workers/         # Web Workers for heavy mathematical logic
├── scripts/
│   └── automation/      # Maintenance, parsing, and DB utility scripts
├── docs/                # Technical documentation and workflow visuals
├── supabase/
│   ├── functions/       # Serverless Edge Functions
│   └── migrations/      # SQL schema and PostGIS setup
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher
- Git
- Docker (optional, for local Supabase deployment)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/rekasda-pro.git
cd rekasda-pro
npm install
```

### 2. Environment Configuration
Duplicate the example environment file:
```bash
cp .env.example .env.local
```
Update `.env.local` with your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_KEY=your-gemini-api-key  # Optional: For AI Consultant
```

### 3. Database Setup
Apply migrations to your Supabase instance:
```bash
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Start Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:3000`.

---

## 💻 Development & Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Compiles TypeScript and builds for production. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Runs ESLint to catch formatting and logic issues. |
| `npm run typecheck`| Runs TypeScript compiler without emitting files. |
| `npm run test` | Runs the Vitest test suite (hydrology engines). |
| `npm run test:ui` | Runs Vitest with the visual UI dashboard. |

*Note: Heavy algorithms should always be verified by running `npm run test` to ensure SNI calculation accuracy.*

---

## 🗺️ Roadmap

**v1.1.0 (Current Focus)**
- Enhanced interactive mapping with PostGIS
- Supabase Edge Function integration for rainfall extraction
- PDF report generation (`jspdf`, `exceljs`)

**v1.2.0**
- Real-time IoT sensor integration
- Multi-user collaborative workspaces
- Offline PWA support with advanced caching

**v2.0.0**
- Government SSO integration
- Advanced machine learning predictions

---

## 🤝 Contributing

We welcome contributions to improve RekaSDA Pro. Please adhere to the following workflow:

1. **Fork & Branch:** Create a feature branch (`git checkout -b feature/your-feature`).
2. **Commit Standard:** Write meaningful commit messages.
3. **No Magic Numbers:** All hydrological constants MUST reference `src/lib/constants/sni.ts`.
4. **Test:** Ensure all hydrology tests pass (`npm run test`).
5. **Push & PR:** Push to your fork and submit a Pull Request.

---

## 📄 License & Support

**License:** This project is licensed under the [MIT License](LICENSE).

**Support & Resources:**
- 📖 [Technical Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-org/rekasda-pro/issues)
- 📧 For commercial support, contact: support@rekasda.pro

---
<div align="center">
  <b>Built with ❤️ for Indonesian Water Resources Engineers</b>
</div>