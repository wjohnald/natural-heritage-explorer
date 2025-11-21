import { describe, it, expect, vi } from 'vitest';
import { HamletProximity } from '@/services/scoring/criteria/recreation-trails/hamlet-proximity';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('HamletProximity', () => {
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

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
