import { describe, it, expect, vi } from 'vitest';
import { FEMAFloodZones } from '@/services/scoring/criteria/streams-wetlands/fema-flood-zones';
import { PARCEL_789_LAPLA_ROAD, PARCEL_281_DEWITT_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('FEMAFloodZones', () => {
    it('should have correct metadata', () => {
        const criterion = new FEMAFloodZones();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('fema-flood-zones');
        expect(metadata.category).toBe('Streams and Wetlands');
        expect(metadata.serviceUrl).toBe('https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28');
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

    it('should score correctly for 281 DeWitt Road (known flood zone)', async () => {
        const criterion = new FEMAFloodZones();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_281_DEWITT_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
        expect(result.notes).toBe('FEMA Special Flood Hazard Areas');
    });

    it('should score correctly when no flood zone found', async () => {
        const criterion = new FEMAFloodZones();

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 0 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(false);
        expect(result.earnedScore).toBe(0);
    });
});
