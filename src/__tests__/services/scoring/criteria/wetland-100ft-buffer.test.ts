import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Wetland100ftBuffer } from '@/services/scoring/criteria/streams-wetlands/wetland-100ft-buffer';
import { ADDRESS_789_LAPLA_ROAD } from '../test-fixtures';
import { fetchParcelGeometry } from '../../../helpers/parcel-fetcher';
import { ParcelGeometry } from '@/services/scoring/types';

// Mock the global fetch
global.fetch = vi.fn();

describe('Wetland100ftBuffer', () => {
    let parcel789Lapla: ParcelGeometry;

    beforeAll(async () => {
        console.log('Fetching REAL parcel geometry from NYS Tax Parcels API...');
        const parcel = await fetchParcelGeometry(ADDRESS_789_LAPLA_ROAD);
        if (!parcel || !parcel.geometry) {
            throw new Error(`Failed to fetch parcel geometry for ${ADDRESS_789_LAPLA_ROAD}`);
        }
        parcel789Lapla = parcel.geometry;
        console.log('Real parcel geometry fetched successfully');
    }, 30000);
    it('should have correct metadata', () => {
        const criterion = new Wetland100ftBuffer();
        const metadata = criterion.getMetadata();

        expect(metadata.id).toBe('wetland-100ft-buffer');
        expect(metadata.name).toBe('Wetland with 100\' buffer');
        expect(metadata.category).toBe('Streams and Wetlands');
        expect(metadata.maxScore).toBe(1);
        expect(metadata.serviceUrl).toContain('informational_freshwater_wetlands');
    });

    it('should score 789 Lapla Road correctly (mocked response)', async () => {
        const criterion = new Wetland100ftBuffer();

        // Mock the buffer response (ArcGIS Geometry Service)
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    geometries: [{ rings: [[0, 0], [1, 1], [1, 0], [0, 0]] }] // Mock buffered geometry
                })
            })
            // Mock the intersection query response (Wetland Service)
            .mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ count: 1 }) // Found 1 wetland
            });

        const result = await criterion.evaluate(parcel789Lapla);

        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });

    it('should handle no wetlands found', async () => {
        const criterion = new Wetland100ftBuffer();

        // Mock the buffer response
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    geometries: [{ rings: [[0, 0], [1, 1], [1, 0], [0, 0]] }]
                })
            })
            // Mock the intersection query response
            .mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ count: 0 }) // Found 0 wetlands
            });

        const result = await criterion.evaluate(parcel789Lapla);

        expect(result.met).toBe(false);
        expect(result.earnedScore).toBe(0);
    });
});
