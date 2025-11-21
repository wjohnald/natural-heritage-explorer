import { describe, it, expect, vi } from 'vitest';
import { EPAPrincipalAquifers } from '@/services/scoring/criteria/drinking-water/epa-principal-aquifers';
import { PARCEL_789_LAPLA_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('EPAPrincipalAquifers', () => {
    it('should have correct metadata', () => {
        const criterion = new EPAPrincipalAquifers();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('epa-principal-aquifers');
        expect(metadata.category).toBe('Drinking Water');
        expect(metadata.serviceUrl).toContain('geopub.epa.gov');
    });

    it('should score correctly when aquifer found', async () => {
        const criterion = new EPAPrincipalAquifers();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
    });
});
