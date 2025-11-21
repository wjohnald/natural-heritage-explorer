import { describe, it, expect, vi } from 'vitest';
import { AgDistricts } from '@/services/scoring/criteria/agriculture/ag-districts';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('AgDistricts', () => {
    it('should have correct metadata', () => {
        const criterion = new AgDistricts();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('ag-districts');
        expect(metadata.category).toBe('Agricultural');
    });

    it('should score correctly when ag district found', async () => {
        const criterion = new AgDistricts();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
