# MASTER DATA KNOWLEDGE BASE

## OVERVIEW
The Master Data module serves as the Single Source of Truth (SSOT) for all hydrological and spatial parameters. It manages rainfall station metadata, daily rainfall records, and spatial characteristics (DAS, Land Use, Thiessen Polygons).

## STRUCTURE
- `components/`: UI modules for data entry, visualization, and spatial analysis.
- `data/`: Mock data and static definitions for development.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Rainfall Management | `MasterHidrologiTab.tsx` | Main CRUD for stations and rainfall |
| Spatial Parameters | `ParameterSpasial.tsx` | Orchestrates DAS and Land Use analysis |
| Excel Integration | `src/utils/excelService.ts` | Template generation and parsing |
| Satellite Ingestion | `src/services/satelliteRainfallService.ts` | CHIRPS/GPM data fetching |
| Spatial Math | `src/lib/utils/spatialMath.ts` | IDW, Normal Ratio, and Thiessen logic |
| Quality Control | `DataQualityDashboard.tsx` | Outlier detection (>300mm) |
| Bulk Ingestion | `MasterHidrologiTab.tsx` | Multi-month matrix paste (Excel/PDF) |

## CONVENTIONS
- **Tabular Density**: Use `tabular-nums` and strict zebra stripes for all data matrices.
- **Coordinate SSOT**: Station coordinates must be in WGS84 (Decimal Degrees).
- **Data Quality**: Rainfall >300mm/day triggers a red warning; <0 is invalid.
- **Upsert Logic**: Rainfall data imports use `stasiun_id, tanggal` as conflict keys.
- **Reactive Analysis**: Spatial parameters (Area, CN, Thiessen) should update automatically when the DAS boundary changes in `WebGISPanel`.

## ANTI-PATTERNS
- **Manual Infill**: Don't guess missing data; use the "Isi Kosong" (IDW/Normal Ratio) tool.
- **Zero vs Null**: Use `0` for dry days and `null` only for broken sensors or missing records.
- **Magic Numbers**: Rainfall coefficients and SNI constants must come from `src/lib/constants/sni.ts`.
- **Direct State Mutation**: Always use `useHydrologyStore` actions for data updates.
- **Batch Size**: Avoid importing more than 1 year of daily data in a single UI transaction.
- **Bulk Input Format**: Supports 31-day x 12-month matrix pasting with auto-parsing for years and months.

## WORKFLOWS
1. **Rainfall Ingestion**: Excel Import -> QC Check -> Satellite Fill (optional) -> Infill Missing.
2. **Spatial Setup**: Delineate DAS -> Auto-calculate Morfometri -> Intersect Land Use -> Generate Thiessen.
3. **Bulk Ingestion**: Copy matrix from Excel/PDF -> Paste into Bulk Modal -> Preview -> Save to Supabase.

## OVERVIEW
Domain for rainfall data ingestion, station management, and data quality control.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Data Import | `src/utils/excelService.ts` | Excel template and parsing logic |
| Spatial Infill | `src/lib/utils/spatialMath.ts` | IDW and Normal Ratio methods |
| Quality Control | `DataQualityDashboard.tsx` | Outlier detection (>300mm) |

## CONVENTIONS
- **Upsert Logic**: Rainfall data imports use `stasiun_id, tanggal` as conflict keys.
- **Coordinate System**: Always use decimal degrees (WGS84) for station locations.
- **Data Sanitization**: Replace commas with dots and strip "mm" units before storage.

## ANTI-PATTERNS
- **Zero vs Null**: Use `0` for dry days and `null` only for broken sensors or missing records.
- **Batch Size**: Avoid importing more than 1 year of daily data in a single UI transaction.
