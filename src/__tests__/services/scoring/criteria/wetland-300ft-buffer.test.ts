/**
 * Integration tests for Wetland300ftBuffer criterion
 * 
 * Data Source: HudsoniaParcelScores/appx.a.parcelscorehabitats.csv
 * This test validates that our wetland_300 criterion matches the expected scores
 * from the Hudsonia Parcel Score analysis.
 * 
 * Philosophy: We use real addresses from the CSV and real API calls to fetch
 * parcel geometry and evaluate the criterion, matching against known ground truth.
 * Uses the same parcel fetching logic as the production app.
 */

import { describe, it, expect } from 'vitest';
import { Wetland300ftBuffer } from '@/services/scoring/criteria/wildlife-habitat/wetland-300ft-buffer';
import { getParcelGeometry } from '@/services/parcel-geometry';


/**
 * Test cases extracted from HudsoniaParcelScores CSV
 * Format: { address, expectedScore, notes }
 */
const TEST_CASES = {
    // Score = 1 (Has wetland within 300ft buffer)
    hasWetland: [
        { address: '1000 Mohonk - Mtn Rest Rd, Marbletown, NY', expectedScore: 1, notes: 'High scoring parcel (Score_10=19, Wetland_300=1)' },
        { address: 'Ricci Rd, Marbletown, NY 12401', expectedScore: 1, notes: 'Parcel ID 60.4-1-28' },
        { address: '211 Mohonk Rd, Marbletown, NY', expectedScore: 1, notes: 'Parcel ID 70.3-6-23.110' },
        { address: '282 Mohonk Rd, Marbletown, NY', expectedScore: 1, notes: 'Parcel ID 70.3-5-20.111' },
        { address: '43 Heinle Rd, Marbletown, NY', expectedScore: 1, notes: 'Parcel ID 55.4-11-23' },
    ],

    // Score = 0 (No wetland within 300ft buffer)
    noWetland: [
        { address: '172 Stone Dock Rd, Marbletown, NY', expectedScore: 0, notes: 'Parcel ID 69.4-2-12, Wetland_300=0' },
        { address: 'Berme Rd, Marbletown, NY 12401', expectedScore: 0, notes: 'Parcel ID 70.3-4-5, Wetland_300=0' },
        { address: '785 Berme Rd, Marbletown, NY', expectedScore: 0, notes: 'Parcel ID 70.3-4-11, Wetland_300=0' },
        { address: '811 Berme Rd, Marbletown, NY', expectedScore: 0, notes: 'Parcel ID 70.3-4-9.100, Wetland_300=0' },
    ],
};

describe('Wetland300ftBuffer Criterion - CSV Validation', () => {
    const criterion = new Wetland300ftBuffer();

    describe('Parcels WITH wetlands (score = 1)', () => {
        TEST_CASES.hasWetland.forEach(({ address, expectedScore, notes }) => {
            it(`should return score ${expectedScore} for ${address}`, { timeout: 30000 }, async () => {
                console.log(`Testing: ${address} - ${notes}`);

                const parcel = await getParcelGeometry(address);
                const result = await criterion.evaluate(parcel.geometry);

                expect(result.earnedScore).toBe(expectedScore);
                expect(result.met).toBe(true);
            });
        });
    });

    describe('Parcels WITHOUT wetlands (score = 0)', () => {
        TEST_CASES.noWetland.forEach(({ address, expectedScore, notes }) => {
            it(`should return score ${expectedScore} for ${address}`, { timeout: 30000 }, async () => {
                console.log(`Testing: ${address} - ${notes}`);

                const parcel = await getParcelGeometry(address);
                const result = await criterion.evaluate(parcel.geometry);

                expect(result.earnedScore).toBe(expectedScore);
                expect(result.met).toBe(false);
            });
        });
    });

    it('should have correct metadata', () => {
        const metadata = criterion.getMetadata();

        expect(metadata.id).toBe('wetland-300ft-buffer');
        expect(metadata.name).toBe('Wetland with 300\' buffer');
        expect(metadata.category).toBe('Wildlife Habitat');
        expect(metadata.maxScore).toBe(1);
        expect(metadata.implemented).toBe(true);
    });
});
