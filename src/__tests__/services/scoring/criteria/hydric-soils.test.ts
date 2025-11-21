import { describe, it, expect, vi } from 'vitest';
import { HydricSoils } from '@/services/scoring/criteria/streams-wetlands/hydric-soils';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('HydricSoils', () => {
    it('should have correct metadata', () => {
        const criterion = new HydricSoils();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('hydric-soils');
        expect(metadata.category).toBe('Streams and Wetlands');
    });

    it('should score correctly when hydric soil found', async () => {
        const criterion = new HydricSoils();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
