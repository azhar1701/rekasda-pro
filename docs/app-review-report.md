# Technical App Review Report: RekaSDA Pro

## 1. Executive Summary
RekaSDA Pro is a professional-grade Water Resources Engineering platform designed for the Indonesian market. It provides high-precision hydrological and hydraulic analysis compliant with Indonesian National Standards (SNI). The application leverages a modern tech stack including React 18.3, TypeScript 5.9, and Supabase, with heavy computational tasks offloaded to Web Workers. While the core engineering logic is robust and well-validated, the platform faces technical debt in its frontend architecture, security risks regarding AI integration, and bottlenecks in its deployment pipeline.

## 2. Core Architecture & Framework
The application follows a modular frontend architecture built on Vite 7.3 and React 18.3. State management is handled by Zustand using a sliced pattern for project, rainfall, and analysis data.

*   **State Management**: Uses `localStorage` persistence and manual "dirty" flags (`isBanjirDirty`, `isNeracaDirty`) to track when analysis results need updating.
*   **UI Standards**: Implements a "GovTech" high-density UI style using Tailwind CSS and Lucide icons, tailored for professional engineering workflows.
*   **Technical Debt**: 
    *   **Monolithic Layout**: `src/App.tsx` has grown into a 27KB monolith (472 lines), tightly coupling navigation, global modal states, and AI consultant logic.
    *   **Legacy Code**: The `analysisSlice.ts` contains deprecated fields like `landCoverParams` that are still present in the production store.

## 3. SNI Math Engines & Performance
The platform's primary value proposition is its strict adherence to Indonesian standards, specifically SNI 2415:2016 for flood analysis and SNI 6738:2015 for dependable flow.

*   **Engine Implementation**: Logic is distributed across `src/lib/engine/`, with `sni.ts` acting as the single source of truth for coefficients and validation limits.
*   **Performance Strategy**: Heavy math operations (Convolution, ABM, Mononobe batching) are executed in Web Workers (`hydrology.worker.ts`, `floodWorker.ts`) to prevent main-thread blocking.
*   **Logic Duplication**: There is significant logic overlap between `flood.ts`, `rationalMethod.ts`, and `src/lib/engine/flood/sni2415.ts`. Some engines use hardcoded conversion factors (0.278) instead of the centralized constants in `sni.ts`.

## 4. AI Integration
RekaSDA Pro integrates Google Gemini AI to provide context-aware engineering insights and automated rainfall data extraction.

*   **Hybrid Implementation**: The system uses a mix of Supabase Edge Functions for rainfall extraction and direct client-side calls for the AI Consultant.
*   **Security Risk**: The use of `VITE_API_KEY` for direct Gemini API calls exposes sensitive credentials on the client side. This is a critical anti-pattern that should be resolved by proxying all AI requests through Supabase Edge Functions.

## 5. Infrastructure & CI/CD Workflow
The application is hosted on a VPS with a Supabase backend and managed via GitHub Actions.

*   **CI/CD Pipeline**: Automated workflows trigger on pushes to `main`, performing type checking and executing SSH-based deployment commands.
*   **Build Bottleneck**: The frontend build process (`npm run build`) currently runs directly on the VPS. This consumes significant CPU/RAM resources during deployment, which can lead to service instability on lower-tier servers.
*   **Nginx Configuration**: Configured as a reverse proxy with 120s timeouts to accommodate long-running hydrological calculations.

## 6. Plus / Minus (Pros & Cons)

### Pros
*   **Standard Compliance**: Excellent implementation of SNI-specific methodologies (Nakayasu, Weibull Q80, etc.).
*   **Computational Efficiency**: Proper use of Web Workers ensures a responsive UI even during complex simulations.
*   **Data Integrity**: Strong validation layer using Zod schemas at the engine boundaries.
*   **User Experience**: High-density, professional UI that matches the mental model of civil engineers.

### Cons
*   **Architectural Bloat**: `App.tsx` requires immediate refactoring to separate layout from business logic.
*   **Security Vulnerability**: Exposure of AI API keys in the frontend build.
*   **Maintenance Overhead**: Duplicate engine logic increases the risk of calculation inconsistencies.
*   **Deployment Risk**: Building on the VPS is a fragile practice compared to artifact-based deployment.

## 7. Upgrade & Update Plan
To move RekaSDA Pro toward a more stable and secure production state, the following steps are recommended:

1.  **Refactor Layout**: Decompose `App.tsx` into smaller, functional components (e.g., `Navigation`, `GlobalModals`, `AIProvider`).
2.  **Secure AI Logic**: Migrate all Gemini API interactions to Supabase Edge Functions to remove `VITE_API_KEY` from the client.
3.  **Consolidate Engines**: Standardize all hydrological calculations into a single `src/lib/engine/flood/` directory and enforce the use of `sni.ts` constants.
4.  **Optimize CI/CD**: Update GitHub Actions to build the frontend `dist/` folder in the cloud and sync only the static assets to the VPS.
5.  **Automate Reactivity**: Replace manual `isDirty` flags with derived state or automated dependency tracking in the Zustand store.
