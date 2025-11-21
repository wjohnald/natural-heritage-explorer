# Geocoding & FEMA Flood Zone Fix

## Issues Fixed

### 1. FEMA Flood Zones - Incorrect Zone X Classification
**Problem**: 789 Lapla Road was incorrectly showing as in a FEMA flood zone.

**Root Cause**: The property is in **Zone X** ("Area of Minimal Flood Hazard"), which is NOT a Special Flood Hazard Area (SFHA). The query was returning ALL flood zones without filtering.

**Fix**: Added WHERE clause to filter for SFHA only:
```typescript
whereClause: "SFHA_TF = 'T'"
```

This now correctly:
- ✅ **Includes**: High-risk zones (A, AE, AH, AO, VE, etc.) where `SFHA_TF = 'T'`
- ✅ **Excludes**: Zone X (minimal hazard), Zone B/C (moderate hazard) where `SFHA_TF = 'F'`

**Result**: 789 Lapla Road now correctly returns **FALSE** for FEMA flood zones.

---

### 2. Google Maps API Key Not Loading in Tests
**Problem**: Tests were not loading `.env.local`, causing geocoding to fall back to OpenStreetMap, which returned inaccurate locations (city centers instead of specific addresses).

**Impact**: 281 DeWitt Road was geocoding to Olivebridge city center instead of the actual property location.

**Fix**:
1. Installed `dotenv` package
2. Updated `src/__tests__/setup.ts` to load environment variables:
```typescript
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });
```

**Result**: Tests now use Google Maps API for accurate geocoding.

---

## Geocoding Comparison

### 281 DeWitt Road Example

**OpenStreetMap** (inaccurate):
- Coords: `41.9278705, -74.2154239`
- Location: Olivebridge city center
- Result: ❌ Not a valid test address

**Google Maps** (accurate):
- Coords: `41.8758741, -74.2869555`
- Location: Actual property at 281 Dewitt Rd
- Result: ✅ Correctly identifies FEMA SFHA

---

## Test Results

### ✅ FEMA Flood Zones
- **281 DeWitt Road**: Returns TRUE (in SFHA) ✓
- **789 Lapla Road**: Returns FALSE (Zone X, not SFHA) ✓
- All 3 tests passing

### ✅ DEC Class A Streams
- **789 Lapla Road**: Returns FALSE (has Class C stream) ✓
- **15 Ronsen Road**: Returns TRUE (has Class A stream within 500ft) ✓
- All 3 tests passing

---

## Key Learnings

1. **FEMA Zone X** is NOT a flood hazard - it means 0.2% or less annual flood chance
2. **SFHA_TF field** is the authoritative filter: `'T'` = true SFHA, `'F'` = not SFHA
3. **Google Maps API** provides significantly more accurate geocoding than OpenStreetMap for rural addresses
4. **dotenv** is required to load `.env.local` in vitest tests (Next.js does this automatically)

---

## Files Modified

- `src/services/scoring/criteria/streams-wetlands/fema-flood-zones.ts` - Added SFHA filter
- `src/__tests__/setup.ts` - Load environment variables from .env.local
- `src/__tests__/services/scoring/criteria/fema-flood-zones.test.ts` - Updated tests
- `src/__tests__/services/scoring/test-fixtures.ts` - Added documentation
- `vitest.config.ts` - Fixed configuration issue
- `package.json` - Added dotenv dependency

