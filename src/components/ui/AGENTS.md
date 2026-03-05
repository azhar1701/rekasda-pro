# UI COMPONENTS KNOWLEDGE BASE

## OVERVIEW
Standardized GovTech UI components following high-density design principles for engineering applications. Built with Tailwind CSS and Radix UI primitives.

## STRUCTURE
- `data-display/`: Complex data visualization components (charts, dashboards).
- `feedback/`: User notification and status indicators.
- `forms/`: Input elements and validation wrappers.
- `govtech/`: Specialized components following GovTech design patterns.
- `layout/`: Structural components for page organization.
- `modals/`: Overlay and dialog management.
- `navigation/`: Menus, tabs, and routing elements.

## WHERE TO LOOK
| Component Type | Location | Key Files |
|----------------|----------|-----------|
| Charts | `src/components/ui` | `HyetographChart.tsx`, `IDFChart.tsx` |
| Data Tables | `src/components/ui` | `DataTable.tsx`, `InputTable.tsx` |
| Specialized Inputs | `src/components/ui` | `SmartOverrideInput.tsx`, `ColorCodedInput.tsx` |
| GovTech Variants | `src/components/ui/govtech` | `ButtonGovTech.tsx`, `CardGovTech.tsx` |

## CONVENTIONS
- **PUPR Brand**: Use `bg-pupr-blue`, `text-pupr-text`, and `bg-pupr-yellow` for brand consistency.
- **Data Density**: Use `tabular-nums` for all numeric outputs.

- **Composition**: Prefer component composition over large prop objects.
- **Lucide Icons**: Use `lucide-react` for all iconography.
- **Conditional Classes**: Use the `cn` utility for all Tailwind class merging.
- **Hydrology Specifics**: Components like `WhiteBoxFormula` must render LaTeX or mathematical notation clearly.

## ANTI-PATTERNS
- **Direct Style Overrides**: Avoid using `style={{}}` props; use Tailwind classes or `className` merging.
- **Business Logic**: UI components should remain presentational. Keep hydrology calculations in `src/lib/engine`.
- **Hardcoded Colors**: Never use hex codes in components. Use Tailwind theme tokens (e.g., `text-primary`, `bg-destructive`).
- **Duplicate Primitives**: Check `src/components/ui` before creating new basic elements like buttons or inputs.
