import { describe, it, expect, vi } from 'vitest';
import { NYNHPFishAreas } from '@/services/scoring/criteria/streams-wetlands/nynhp-fish-areas';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('NYNHPFishAreas', () => {
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

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
