import { describe, it, expect, vi } from 'vitest';
import { DECSBAS } from '@/services/scoring/criteria/wildlife-habitat/dec-sbas';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('DECSBAS', () => {
    it('should have correct metadata', () => {
        const criterion = new DECSBAS();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('dec-sbas');
        expect(metadata.category).toBe('Wildlife Habitat');
    });

    it('should score correctly when SBA found', async () => {
        const criterion = new DECSBAS();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
