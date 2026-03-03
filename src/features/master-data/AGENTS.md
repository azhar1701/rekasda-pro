# MASTER DATA KNOWLEDGE BASE

## OVERVIEW
Domain for rainfall data ingestion, station management, and SIHKA Citanduy synchronization.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| SIHKA Scraper | `src/services/scraperSihka.ts` | Daily view iteration strategy |
| Station Mapping | `MasterHidrologiTab.tsx` | `stationIdMapping` for SIHKA IDs |
| Data Import | `src/utils/excelService.ts` | Excel template and parsing logic |
| Spatial Infill | `src/lib/utils/spatialMath.ts` | IDW and Normal Ratio methods |
| Quality Control | `DataQualityDashboard.tsx` | Outlier detection (>300mm) |

## CONVENTIONS
- **Manual Priority**: SIHKA sync prefers manual rainfall data over telemetry.
- **Upsert Logic**: Rainfall data imports use `stasiun_id, tanggal` as conflict keys.
- **Coordinate System**: Always use decimal degrees (WGS84) for station locations.
- **Data Sanitization**: Replace commas with dots and strip "mm" units before storage.

## ANTI-PATTERNS
- **Hardcoded SIHKA IDs**: Avoid adding new IDs directly in components; move to a central mapping or DB.
- **Direct Scraper Calls**: Use `syncSihkaStationData` instead of calling `fetchSihkaRainfallData` directly.
- **Zero vs Null**: Use `0` for dry days and `null` only for broken sensors or missing records.
- **Batch Size**: Avoid importing more than 1 year of daily data in a single UI transaction.
