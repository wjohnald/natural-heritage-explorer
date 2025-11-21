import { describe, it, expect, vi } from 'vitest';
import { FEMAFloodZones } from '@/services/scoring/criteria/streams-wetlands/fema-flood-zones';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('FEMAFloodZones', () => {
    it('should have correct metadata', () => {
        const criterion = new FEMAFloodZones();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('fema-flood-zones');
        expect(metadata.category).toBe('Streams and Wetlands');
    });

    it('should score correctly when flood zone found', async () => {
        const criterion = new FEMAFloodZones();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
