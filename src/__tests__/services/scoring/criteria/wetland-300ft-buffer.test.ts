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
import type { ParcelGeometry } from '../../../services/scoring/types';

/**
 * Fetch parcel geometry by PRINT_KEY (parcel ID)
 * This ensures we test the exact parcels from the CSV
 */
async function getParcelByPrintKey(printKey: string): Promise<ParcelGeometry> {
    const parcelServiceUrl = 'https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Tax_Parcels_Public/MapServer/1/query';

    const params = new URLSearchParams({
        f: 'json',
        where: `PRINT_KEY='${printKey}'`,
        returnGeometry: 'true',
        outFields: 'PRINT_KEY,PARCEL_ADDR',
        outSR: '3857',  // Request in Web Mercator
    });

    const response = await fetch(`${parcelServiceUrl}?${params}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch parcel ${printKey}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
        throw new Error(`No parcel found with PRINT_KEY: ${printKey}`);
    }

    const parcel = data.features[0];

    // Add spatial reference from response to geometry
    if (data.spatialReference && parcel.geometry) {
        parcel.geometry.spatialReference = data.spatialReference;
    }

    console.log(`Loaded parcel ${printKey}: ${parcel.attributes.PARCEL_ADDR}`);

    return parcel.geometry;
}



/**
 * Test cases extracted from HudsoniaParcelScores CSV
 * Using parcel IDs (PRINT_KEY) to ensure we test the exact parcels from the CSV
 */
const TEST_CASES = {
    // Score = 1 (Has wetland within 300ft buffer)
    hasWetland: [
        { parcelId: '78.1-1-22.111', address: '1000 Mohonk - Mtn Rest Rd, Marbletown, NY', expectedScore: 1 },
        { parcelId: '60.4-1-28', address: 'Ricci Rd, Marbletown, NY 12401', expectedScore: 1 },
        { parcelId: '70.3-6-23.110', address: '211 Mohonk Rd, Marbletown, NY', expectedScore: 1 },
        { parcelId: '70.3-5-20.111', address: '282 Mohonk Rd, Marbletown, NY', expectedScore: 1 },
        { parcelId: '55.4-11-23', address: '43 Heinle Rd, Marbletown, NY', expectedScore: 1 },
    ],

    // Score = 0 (No wetland within 300ft buffer)
    noWetland: [
        { parcelId: '69.4-2-12', address: '172 Stone Dock Rd, Marbletown, NY', expectedScore: 0 },
        { parcelId: '70.3-4-5', address: 'Berme Rd, Marbletown, NY 12401', expectedScore: 0 },
        { parcelId: '70.3-4-11', address: '785 Berme Rd, Marbletown, NY', expectedScore: 0 },
        { parcelId: '70.3-4-9.100', address: '811 Berme Rd, Marbletown, NY', expectedScore: 0 },
    ],
};

describe('Wetland300ftBuffer Criterion - CSV Validation', () => {
    const criterion = new Wetland300ftBuffer();

    describe('Parcels WITH wetlands (score = 1)', () => {
        TEST_CASES.hasWetland.forEach(({ parcelId, address, expectedScore }) => {
            it(`should return score ${expectedScore} for ${address}`, { timeout: 60000 }, async () => {
                console.log(`Testing parcel ${parcelId}: ${address}`);

                const geometry = await getParcelByPrintKey(parcelId);
                const result = await criterion.evaluate(geometry);

                expect(result.earnedScore).toBe(expectedScore);
                expect(result.met).toBe(true);
            });
        });
    });

    describe('Parcels WITHOUT wetlands (score = 0)', () => {
        TEST_CASES.noWetland.forEach(({ parcelId, address, expectedScore }) => {
            it(`should return score ${expectedScore} for ${address}`, { timeout: 60000 }, async () => {
                console.log(`Testing parcel ${parcelId}: ${address}`);

                const geometry = await getParcelByPrintKey(parcelId);
                const result = await criterion.evaluate(geometry);

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
