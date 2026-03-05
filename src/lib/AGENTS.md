# Core Library Knowledge Base

## OVERVIEW
Stateless engineering logic, constants, and utilities that form the mathematical backbone of the platform.

## STRUCTURE
```
src/lib/
├── constants/     # SNI constants & threshold limits (SSOT)
├── engine/        # Pure mathematical functions (Rational, Manning, etc.)
├── utils/         # Date formatting, unit conversion, array math
└── supabase/      # Database client configuration
```

## CONVENTIONS
- **Pure Functions**: Functions in `engine/` must be deterministic and side-effect free.
- **SNI Reference**: Every constant in `sni.ts` should include a comment referencing the specific SNI clause.

## ANTI-PATTERNS
- **Floating Numbers**: Never use magic numbers; if a value is physical/empirical, it belongs in `constants/`.
