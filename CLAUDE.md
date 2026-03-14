# RekaSDA Pro - Developer Guide

## Technical Standards
- **Standard**: SNI 2415:2016 (Flood), SNI 03-3424-1994 (Channel)
- **Framework**: React 18.3, TypeScript 5.9
- **Style**: Tailwind CSS 3.4
- **State**: Zustand (Hydrology Store)
- **Database**: Supabase (Master Data)

## Design Context

### Users
Indonesian Water Resources Engineers (BBWS, PUPR, Consultants). They use this in a professional workstation environment to perform rigorous hydrological audits and design calculations.

### Brand Personality
**Authoritative, Precise, Expert-Grade.** The interface evokes confidence in mathematical results, feeling like an international engineering workstation (e.g., ArcGIS, SAP2000) localized for the Indonesian context.

### Aesthetic Direction
**GovTech Professional with Soft Glassmorphism.** High contrast, sharp borders, and a clear hierarchy, enhanced by subtle glassmorphism effects for a modern, high-end feel. Uses the PUPR official palette (#0c3a66 for primary navy, #f2c114 for accents).

### Design Principles
1. **PUPR Identity First**: Core identity driven by PUPR official colors (Navy/Yellow) to establish authority and government trust.
2. **Local First (Bahasa Indonesia)**: Interface and documentation use professional Bahasa Indonesia suitable for Indonesian engineering standards.
3. **Technical Transparency**: Never show a result without its engineering metadata (SNI clause, bias factor, etc.).
4. **Auditability First**: Mandatory use of `tabular-nums` for all numeric data to ensure Excel-like vertical alignment and auditability.
5. **Expert Workflow**: The UI must follow the logical sequence of a hydrological study (Inputs -> QC -> Engine -> Output).

## Interface Audit (March 2026)

### Verdict: PASS (Engineering Grade) / FAIL (AI Slop Tells)
The system is technically brilliant but suffers from **"The Card Trap"** and **AI Slop Tells** (Hero metrics, low-contrast labels).

### Critical Priorities
1. **Accessibility**: Fix tooltips to be keyboard accessible.
2. **Contrast**: Increase label contrast (slate-400 is too light).
3. **Theming**: Consolidate hard-coded colors into `pupr` design tokens.
4. **Hierarchy**: Flatten nested cards to reduce visual clutter.
