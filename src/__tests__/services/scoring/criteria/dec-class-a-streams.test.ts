import { describe, it, expect, vi } from 'vitest';
import { DECClassAStreams } from '@/services/scoring/criteria/drinking-water/dec-class-a-streams';
import { PARCEL_789_LAPLA_ROAD, PARCEL_15_RONSEN_ROAD } from '../test-fixtures';

global.fetch = vi.fn();

describe('DECClassAStreams', () => {
    it('should have correct metadata', () => {
        const criterion = new DECClassAStreams();
        const metadata = criterion.getMetadata();
        expect(metadata.id).toBe('dec-class-a-streams');
        expect(metadata.category).toBe('Drinking Water');
        expect(metadata.serviceUrl).toBe('https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_streams_and_watersheds/MapServer/9');
        expect(metadata.notes).toBe('Streams classified for drinking water usage');
    });

    it('should score correctly for 789 Lapla Road (has Class C stream, not Class A)', async () => {
        const criterion = new DECClassAStreams();

        // Mock the buffer service (called first)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ geometries: [PARCEL_789_LAPLA_ROAD] })
        });

        // Mock the actual query (called second) - returns 0 because stream is Class C, not A
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 0 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(false);
        expect(result.earnedScore).toBe(0);
        expect(result.notes).toBe('Streams classified for drinking water usage');
    });

    it('should score correctly for 15 Ronsen Rd (known Class A stream)', async () => {
        const criterion = new DECClassAStreams();

        // Mock the buffer service (called first)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ geometries: [PARCEL_15_RONSEN_ROAD] })
        });

        // Mock the actual query (called second) - returns 1 for Class A stream
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 1 })
        });

        const result = await criterion.evaluate(PARCEL_15_RONSEN_ROAD);
        expect(result.met).toBe(true);
        expect(result.earnedScore).toBe(1);
        expect(result.notes).toBe('Streams classified for drinking water usage');
    });

    it('should score correctly when stream found', async () => {
        const criterion = new DECClassAStreams();

        // Mock the buffer service (called first)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ geometries: [PARCEL_789_LAPLA_ROAD] })
        });

        // Mock the actual query (called second)
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

        // Mock the buffer service (called first)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ geometries: [PARCEL_789_LAPLA_ROAD] })
        });

        // Mock the actual query (called second)
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            text: async () => JSON.stringify({ count: 0 })
        });

        const result = await criterion.evaluate(PARCEL_789_LAPLA_ROAD);
        expect(result.met).toBe(false);
        expect(result.earnedScore).toBe(0);
    });
});
