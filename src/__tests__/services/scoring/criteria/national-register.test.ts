import { describe, it, expect, vi } from 'vitest';
import { NationalRegister } from '@/services/scoring/criteria/historic-cultural/national-register';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('NationalRegister', () => {
    it('should have correct metadata', () => {
        const criterion = new NationalRegister();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('national-register');
        expect(metadata.category).toBe('Historic and Cultural');
    });

    it('should score correctly when site found', async () => {
        const criterion = new NationalRegister();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
