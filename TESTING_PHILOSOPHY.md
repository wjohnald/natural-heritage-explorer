# Testing Philosophy

**Core Principle**: We don't run a GIS system - we use data from public APIs.

## Test Strategy

### Unit Tests (Criterion Tests)
**Location**: `src/__tests__/services/scoring/criteria/`  
**Purpose**: Test criterion metadata and configuration  
**What they test**:
- Correct IDs, names, categories
- Service URLs are configured
- Max scores are set correctly
- No geometry or API calls needed

**Example**:
```typescript
it('should have correct metadata', () => {
    const criterion = new FEMAFloodZones();
    const metadata = criterion.getMetadata();
    expect(metadata.id).toBe('fema-flood-zones');
    expect(metadata.serviceUrl).toBe('https://...');
});
```

### Integration Tests (Address-Based Scoring)
**Location**: `src/__tests__/integration/address-scoring.test.ts`  
**Purpose**: Test the complete real-world pipeline  
**What they test**:
- Address → Geocoding (Google Maps or OpenStreetMap)
- Geocoded coords → Parcel geometry fetch (NYS Tax Parcels API)
- Parcel geometry → Scoring (all public GIS APIs)

**No mocks - uses real addresses and real API calls!**

**Example**:
```typescript
it('should score 789 Lapla Road - FEMA should be FALSE', async () => {
    const geometry = await getParcelGeometry(ADDRESS_789_LAPLA_ROAD);
    const scorer = new ParcelScorer();
    const result = await scorer.scoreParcel(geometry);
    
    const femaCriterion = result.breakdown.find(c => 
        c.name === 'FEMA Flood Hazard Areas'
    );
    
    expect(femaCriterion.matched).toBe(false);
});
```

## Test Addresses

We use real, verified addresses for testing:

| Address | Purpose |
|---------|---------|
| 789 Lapla Road, Marbletown, NY | General testing, has Class C stream (not A), Zone X FEMA (not SFHA) |
| 281 DeWitt Road, Olivebridge, NY | In FEMA Special Flood Hazard Area, has Class A stream |
| 15 Ronsen Road, Olive, NY | Has Class A stream within 500ft |

## Why This Approach?

1. **Mirrors Production**: Tests work exactly like the real application
2. **No Mocked Data**: We test against real public APIs, just like users will use
3. **Integration First**: Catches real-world issues (geocoding accuracy, API changes, etc.)
4. **Fast Unit Tests**: Criterion tests are quick metadata checks
5. **Comprehensive Integration**: Address tests verify the entire system

## Running Tests

```bash
# Quick metadata tests (fast)
npx vitest run src/__tests__/services/scoring/criteria/

# Full integration tests (slower, real API calls)
npx vitest run src/__tests__/integration/address-scoring.test.ts

# All tests
npx vitest run
```

## Adding New Test Addresses

When adding a new test address:

1. Verify it with the live application first
2. Add to `test-fixtures.ts` with documentation
3. Add integration test in `address-scoring.test.ts`
4. Document what criteria it tests (true/false)

## Notes

- Some APIs may have CORS issues in test environment (happy-dom)
- Tests handle API errors gracefully
- Google Maps API key required for accurate geocoding
- Tests run with 60-second timeout for full scoring pipeline

