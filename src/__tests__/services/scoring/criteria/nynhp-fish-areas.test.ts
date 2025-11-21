import { describe, it, expect, vi, beforeAll } from 'vitest';
import { NYNHPFishAreas } from '@/services/scoring/criteria/streams-wetlands/nynhp-fish-areas';
import { ADDRESS_789_LAPLA_ROAD } from '../test-fixtures';
import { fetchParcelGeometry } from '../../../helpers/parcel-fetcher';
import { ParcelGeometry } from '@/services/scoring/types';

global.fetch = vi.fn();

describe('NYNHPFishAreas', () => {
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
        const criterion = new NYNHPFishAreas();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('nynhp-fish-areas');
        expect(metadata.category).toBe('Streams and Wetlands');
    });

    it('should score correctly when fish area found', async () => {
        const criterion = new NYNHPFishAreas();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(parcel789Lapla);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
