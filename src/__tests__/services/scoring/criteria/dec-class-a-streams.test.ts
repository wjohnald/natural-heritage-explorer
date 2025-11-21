import { describe, it, expect, vi } from 'vitest';
import { DECClassAStreams } from '@/services/scoring/criteria/drinking-water/dec-class-a-streams';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('DECClassAStreams', () => {
    it('should have correct metadata', () => {
        const criterion = new DECClassAStreams();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('dec-class-a-streams');
        expect(metadata.category).toBe('Drinking Water');
    });

    it('should score correctly when stream found', async () => {
        const criterion = new DECClassAStreams();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });

    it('should score correctly when no stream found', async () => {
        const criterion = new DECClassAStreams();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 0 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(false);
        expect(result.earnedScore).toBe(0);
    });
});
