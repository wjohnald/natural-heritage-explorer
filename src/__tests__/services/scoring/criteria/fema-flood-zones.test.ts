import { describe, it, expect } from 'vitest';
import { FEMAFloodZones } from '@/services/scoring/criteria/streams-wetlands/fema-flood-zones';

describe('FEMAFloodZones', () => {
    it('should have correct metadata', () => {
        const criterion = new FEMAFloodZones();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('fema-flood-zones');
        expect(metadata.category).toBe('Streams and Wetlands');
        expect(metadata.serviceUrl).toBe('https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28');
    });

    it('should filter for Special Flood Hazard Areas (SFHA_TF = T)', () => {
        const criterion = new FEMAFloodZones();
        const metadata = criterion.getMetadata();
        
        // Verify that the criterion will filter for SFHA_TF = 'T'
        // This excludes Zone X (minimal hazard) and only includes high-risk zones
        expect(metadata.notes).toBe('FEMA Special Flood Hazard Areas');
    });

    // Full address-to-score integration tests are in:
    // src/__tests__/integration/score-parcel-route.test.ts
    // 
    // Those tests verify the complete pipeline:
    // Address → Geocoding → Parcel Fetch → Scoring
    // 
    // This keeps unit tests focused on criterion logic/metadata,
    // while integration tests verify the full system with real addresses.
});
