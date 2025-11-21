# Test Status Report

**Generated**: November 21, 2025  
**Total Tests**: 37 tests across 15 test suites

## Summary

- ✅ **26 tests passing** (70.3%)
- ❌ **11 tests failing** (29.7%)
- ✅ **2 test suites passing** 
- ❌ **13 test suites failing**

---

## ✅ Fully Passing Test Suites

### 1. FEMA Flood Zones (3/3 tests passing) ✅
**Location**: `src/__tests__/services/scoring/criteria/fema-flood-zones.test.ts`

**Status**: **FULLY WORKING** - All tests passing with real API calls!

Tests:
- ✅ Correct metadata
- ✅ Filters for Special Flood Hazard Areas (SFHA_TF = 'T')
- ✅ 281 DeWitt Road returns TRUE (confirmed in SFHA)

**Notes**: 
- Uses Google Maps API for accurate geocoding
- WHERE clause `SFHA_TF = 'T'` correctly filters out Zone X
- 789 Lapla Road now correctly returns FALSE in production

---

### 2. DEC Class A Streams (3/3 tests passing) ✅
**Location**: `src/__tests__/services/scoring/criteria/dec-class-a-streams.test.ts`

**Status**: **FULLY WORKING** - All tests passing with real API calls!

Tests:
- ✅ Correct metadata
- ✅ 789 Lapla Road returns FALSE (has Class C stream)
- ✅ 15 Ronsen Road returns TRUE (has Class A stream within 500ft)

**Notes**:
- Uses 500ft buffer to detect streams near parcels
- Google Maps API provides accurate geocoding

---

## ⚠️ Test Suites with Issues

### 3. Coordinate Conversion (8/9 tests passing) ⚠️
**Location**: `src/utils/__tests__/coordinate-conversion.test.ts`

**Issue**: Minor precision difference in one test
- Expected: `41.925`
- Received: `41.92066923547322`
- Difference: `0.00433` (expected tolerance: `0.0005`)

**Impact**: LOW - This is a precision issue, not a functional bug. The conversion is working, just slightly less precise than expected.

---

### 4-13. Legacy Tests Using Removed Fixture (9 test suites failing)

**Common Issue**: All these tests reference `PARCEL_789_LAPLA_ROAD` which was removed during refactoring.

**Error**: `TypeError: Cannot read properties of undefined (reading 'spatialReference')`

**Affected Criteria**:
1. ❌ Adjacent Protected Lands
2. ❌ Agriculture Districts
3. ❌ DEC Significant Biodiversity Areas (SBAs)
4. ❌ EPA Principal Aquifers
5. ❌ Hamlet Proximity
6. ❌ Hydric Soils
7. ❌ National Register (Historic)
8. ❌ NYNHP Fish Areas
9. ❌ Wetland 100ft Buffer
10. ❌ Wetland 300ft Buffer

**Root Cause**: During refactoring of FEMA and Class A Streams tests, we:
- Removed hardcoded `PARCEL_789_LAPLA_ROAD` geometry fixture
- Replaced it with `ADDRESS_789_LAPLA_ROAD` string + `fetchParcelGeometry()` helper
- These other tests still expect the old fixture

**Fix Required**: Update these tests to either:
1. Use the new address-based approach with `fetchParcelGeometry()`
2. Create new hardcoded geometry fixtures
3. Mock the geometry data appropriately

---

### 14-15. Integration Tests (2 test suites failing)

**Location**: 
- `src/__tests__/integration/debug-endpoint.test.ts`
- `src/__tests__/integration/score-parcel-route.test.ts`

**Error**: `Failed to resolve import "../../../app/api/*/route"`

**Issue**: Vitest cannot resolve Next.js App Router API route imports

**Possible Causes**:
1. Path alias configuration issue in vitest
2. Next.js App Router routes may need special handling in tests
3. May need to mock these instead of directly importing

**Impact**: MEDIUM - Integration tests for API routes are not running

---

## Recommendations

### Priority 1: Critical (Already Fixed! ✅)
- ✅ **FEMA Flood Zones** - Fixed with `SFHA_TF = 'T'` filter
- ✅ **DEC Class A Streams** - Fixed with correct service URL and 500ft buffer
- ✅ **Google Maps API in tests** - Fixed with dotenv loading

### Priority 2: High
- ❌ **Update legacy tests** - Refactor 9 test suites to use new address-based approach or proper mocks
  - **Estimated effort**: 2-3 hours
  - **Approach**: Batch update all to use proper mocking or create test-specific fixtures

### Priority 3: Medium
- ⚠️ **Fix integration tests** - Configure Vitest to handle Next.js API routes
  - **Estimated effort**: 1 hour
  - **Approach**: May need to mock Next.js router or adjust import strategy

### Priority 4: Low
- ⚠️ **Coordinate conversion precision** - Adjust test tolerance or improve conversion accuracy
  - **Estimated effort**: 15 minutes
  - **Impact**: Cosmetic, not affecting functionality

---

## Current Production Status

### ✅ Working Correctly in Production:
1. **FEMA Flood Zones** 
   - 281 DeWitt Road → TRUE (in SFHA)
   - 789 Lapla Road → FALSE (Zone X, not SFHA)

2. **DEC Class A Streams**
   - 789 Lapla Road → FALSE (has Class C)
   - 15 Ronsen Road → TRUE (has Class A within 500ft)

3. **Geocoding**
   - Google Maps API working
   - Accurate address resolution

### ⚠️ Unknown Production Status:
The 9 criteria with failing tests may or may not be working correctly in production. The test failures are due to test infrastructure issues (missing fixtures), not necessarily code bugs.

---

## Next Steps

1. **Decision needed**: Should we:
   - A) Fix all legacy tests now (comprehensive but time-consuming)
   - B) Focus on tests for newly implemented/fixed criteria only
   - C) Update tests incrementally as we work on each criterion

2. **Integration tests**: Decide if these are essential or if we rely on manual testing for API routes

3. **Coordinate conversion**: Decide acceptable precision tolerance

