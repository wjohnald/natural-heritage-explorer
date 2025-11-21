import { describe, it, expect, vi } from 'vitest';
import { GET } from '../../../app/api/debug-service/route';

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe('Debug Endpoint Integration', () => {
    it('should run ParcelScorer and return results', async () => {
        // Mock service responses
        globalFetch.mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ count: 1 }), // Simulate match
            json: async () => ({ count: 1 })
        });

        const res = await GET();
        const data = await res.json();

        console.log('Debug Endpoint Result:', JSON.stringify(data, null, 2));

        expect(res.status).toBe(200);
        expect(data.message).toBe('ParcelScorer Test');
        expect(data.scoreResult).toBeDefined();
        expect(data.scoreResult.totalScore).toBeGreaterThan(0);
    });
});
