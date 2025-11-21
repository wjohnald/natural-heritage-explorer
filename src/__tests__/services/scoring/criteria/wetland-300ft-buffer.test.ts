import { describe, it, expect, vi } from 'vitest';
import { Wetland300ftBuffer } from '@/services/scoring/criteria/wildlife-habitat/wetland-300ft-buffer';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('Wetland300ftBuffer', () => {
    it('should have correct metadata', () => {
        const criterion = new Wetland300ftBuffer();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('wetland-300ft-buffer');
        expect(metadata.category).toBe('Wildlife Habitat');
    });

    it('should use buffer and score correctly when wetland found', async () => {
        const criterion = new Wetland300ftBuffer();

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
