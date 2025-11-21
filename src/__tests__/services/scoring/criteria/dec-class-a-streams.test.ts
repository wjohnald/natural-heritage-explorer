import { describe, it, expect, beforeAll } from 'vitest';
import { DECClassAStreams } from '@/services/scoring/criteria/drinking-water/dec-class-a-streams';
import { ADDRESS_789_LAPLA_ROAD, ADDRESS_15_RONSEN_ROAD } from '../test-fixtures';
import { fetchParcelGeometry } from '../../../helpers/parcel-fetcher';
import { ParcelGeometry } from '@/services/scoring/types';

describe('DECClassAStreams', () => {
    let parcel789Lapla: ParcelGeometry;
    let parcel15Ronsen: ParcelGeometry;

    // Fetch real parcel geometries before running tests
    beforeAll(async () => {
        console.log('Fetching parcel geometries for test addresses...');
        [parcel789Lapla, parcel15Ronsen] = await Promise.all([
            fetchParcelGeometry(ADDRESS_789_LAPLA_ROAD),
            fetchParcelGeometry(ADDRESS_15_RONSEN_ROAD)
        ]);
        console.log('Parcel geometries fetched successfully');
    }, 30000); // 30 second timeout for geocoding/parcel fetching

    it('should have correct metadata', () => {
        const criterion = new DECClassAStreams();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('dec-class-a-streams');
        expect(metadata.category).toBe('Drinking Water');
        expect(metadata.serviceUrl).toBe('https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_streams_and_watersheds/MapServer/9');
        expect(metadata.notes).toBe('Streams classified for drinking water usage');
    });

    it('should score false for 789 Lapla Road (has Class C stream, not Class A)', async () => {
        const criterion = new DECClassAStreams();
        
        const result = await criterion.evaluate(parcel789Lapla);
        
        expect(result.met).toBe(false);
        expect(result.earnedScore).toBe(0);
        expect(result.notes).toBe('Streams classified for drinking water usage');
    }, 15000); // 15 second timeout for real API calls

    it('should score true for 15 Ronsen Rd (known Class A stream)', async () => {
        const criterion = new DECClassAStreams();
        
        const result = await criterion.evaluate(parcel15Ronsen);
        
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
        expect(result.notes).toBe('Streams classified for drinking water usage');
    }, 15000); // 15 second timeout for real API calls
});
