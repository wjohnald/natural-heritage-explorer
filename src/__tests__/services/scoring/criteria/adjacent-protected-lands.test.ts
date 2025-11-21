import { describe, it, expect, vi } from 'vitest';
import { AdjacentProtectedLands } from '@/services/scoring/criteria/recreation-trails/adjacent-protected-lands';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('AdjacentProtectedLands', () => {
    it('should have correct metadata for default category', () => {
        const criterion = new AdjacentProtectedLands();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toContain('adjacent-protected-lands');
        expect(metadata.category).toBe('Recreation and Trails');
        expect(metadata.maxScore).toBe(1.5);
    });

    it('should have correct metadata for custom category', () => {
        const criterion = new AdjacentProtectedLands('Forests and Woodlands', 1);
        const metadata = criterion.getMetadata();
        expect(metadata.category).toBe('Forests and Woodlands');
        expect(metadata.maxScore).toBe(1);
    });

    it('should use 0 buffer (adjacency) and score correctly', async () => {
        const criterion = new AdjacentProtectedLands();

        // Mock buffer response (even though buffer is 0, logic might still call it or just use original geometry? 
        // Actually, buffer=0 usually means "touching", so it might not call buffer service if logic handles 0 specially, 
        // but our logic calls buffer service if buffer > 0. 
        // Let's check query-helpers.ts: if (buffer !== undefined && buffer > 0)
        // So for buffer=0, it WON'T call buffer service. It will just query with spatialRel: 'esriSpatialRelIntersects' (default) or 'esriSpatialRelTouches'?
        // The default is 'esriSpatialRelIntersects'. 
        // If we want adjacency, intersects is usually fine for polygons sharing a boundary.

        // Mock query response
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1.5);
    });
});
