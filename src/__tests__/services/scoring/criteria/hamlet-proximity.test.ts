import { describe, it, expect, vi, beforeAll } from 'vitest';
import { HamletProximity } from '@/services/scoring/criteria/recreation-trails/hamlet-proximity';
import { ADDRESS_789_LAPLA_ROAD } from '../test-fixtures';
import { fetchParcelGeometry } from '../../../helpers/parcel-fetcher';
import { ParcelGeometry } from '@/services/scoring/types';

global.fetch = vi.fn();

describe('HamletProximity', () => {
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
        const criterion = new HamletProximity();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('hamlet-proximity');
        expect(metadata.category).toBe('Recreation and Trails');
    });

    it('should use buffer and score correctly when hamlet found', async () => {
        const criterion = new HamletProximity();

        // Mock buffer response
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ geometries: [{ rings: [[0, 0]] }] })
            })
            // Mock query response
            .mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ count: 1 })
            });

        const result = await criterion.evaluate(parcel789Lapla);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
