# RekaSDA Pro - Gemini Design Context

## Design Context

### Users
Indonesian Water Resources Engineers (BBWS, PUPR, Consultants). They use this in a professional workstation environment to perform rigorous hydrological audits and design calculations.

### Brand Personality
**Authoritative, Precise, Expert-Grade.** The interface evokes confidence in mathematical results, feeling like an international engineering workstation (e.g., ArcGIS, SAP2000) localized for the Indonesian context.

### Aesthetic Direction
**GovTech Professional with Flattened Design.** High contrast, sharp borders, and a clear hierarchy. Completely shadow-less and devoid of glassmorphism effects for a highly serious, high-end technical feel. Uses the PUPR official palette (#0c3a66 for primary navy, #f2c114 for accents).

### Design Principles
1. **PUPR Identity First**: Core identity driven by PUPR official colors (Navy/Yellow) to establish authority and government trust.
2. **Local First (Bahasa Indonesia)**: Interface and documentation use professional Bahasa Indonesia suitable for Indonesian engineering standards.
3. **Technical Transparency**: Never show a result without its engineering metadata (SNI clause, bias factor, etc.).
4. **Auditability First**: Mandatory use of `tabular-nums` for all numeric data to ensure Excel-like vertical alignment and auditability.
5. **Expert Workflow**: The UI must follow the logical sequence of a hydrological study (Inputs -> QC -> Engine -> Output).

## Implementation Checklist
- [ ] Use `tabular-nums tracking-tight` for all numeric displays.
- [ ] Use `lucide-react` for all iconography.
- [ ] Enforce "Flattened" aesthetics (no shadow, no backdrop-blur, completely flat borders).
- [ ] Ensure all text is in professional Bahasa Indonesia.
- [ ] Use PUPR Navy (#0c3a66) and PUPR Yellow (#f2c114).
