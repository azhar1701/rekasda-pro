# DATABASE SCHEMA KNOWLEDGE BASE

## OVERVIEW
Supabase/PostgreSQL schema definitions, RLS policies, and data migrations for RekaSDA.

## STRUCTURE
```
supabase/migrations/
├── *_master_hidrologi.sql    # Core rainfall/station tables
├── *_flood_calculations.sql   # Persistent simulation results
└── *_seed_*.sql              # Pilot data for Citanduy basin
```

## WHERE TO LOOK
| Table | Role | Conflict Key |
|-------|------|--------------|
| `master_stasiun` | Rainfall station metadata | `nama_stasiun` |
| `master_data_hujan` | Daily rainfall records | `stasiun_id, tanggal` |
| `flood_calculations` | Simulation audit trail | `id` |

## CONVENTIONS
- **RLS Enabled**: Every new table MUST have Row Level Security enabled.
- **Public Read, Admin Write**: Use standard project policies for anonymous read access and authenticated write.
- **Upsert-Safe**: Always define unique constraints for conflict resolution in ETL pipelines.

## ANTI-PATTERNS
- **Hard-coded IDs**: Never reference UUIDs directly in migrations; use lookups or variables.
- **Direct Schema Mutation**: All changes MUST go through migration files, never via Dashboard UI.
