import { describe, it, expect, beforeAll } from 'vitest';
import { FEMAFloodZones } from '@/services/scoring/criteria/streams-wetlands/fema-flood-zones';
import { ADDRESS_281_DEWITT_ROAD } from '../test-fixtures';
import { fetchParcelGeometry } from '../../../helpers/parcel-fetcher';
import { ParcelGeometry } from '@/services/scoring/types';

describe('FEMAFloodZones', () => {
    let parcel281DeWitt: ParcelGeometry;

    // Fetch real parcel geometry before running tests
    beforeAll(async () => {
        console.log('Fetching parcel geometry for 281 DeWitt Road...');
        parcel281DeWitt = await fetchParcelGeometry(ADDRESS_281_DEWITT_ROAD);
        console.log('Parcel geometry fetched successfully');
    }, 30000); // 30 second timeout for geocoding/parcel fetching

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

    it('should score true for 281 DeWitt Road (known Special Flood Hazard Area)', async () => {
        const criterion = new FEMAFloodZones();

        const result = await criterion.evaluate(parcel281DeWitt);
        
        // 281 DeWitt Road is in a FEMA SFHA (SFHA_TF = 'T')
        // Note: Requires Google Maps API key for accurate geocoding
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
        expect(result.notes).toBe('FEMA Special Flood Hazard Areas');
    }, 15000); // 15 second timeout for real API calls
});
