import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { ParcelScorer } from './parcel-scorer';
import { CsvLoader } from './csv-loader';

describe('ParcelScorer Integration Tests', () => {
    // Map of ParcelID -> Expected Scores from CSVs
    const expectedScores = new Map<string, any>();
    const scorer = new ParcelScorer();

    beforeAll(() => {
        const dataDir = path.join(process.cwd(), 'HudsoniaParcelScores');

        // Helper to load and merge CSV data into expectedScores map
        const loadAndMerge = (filename: string, mapper: (row: any, current: any) => void) => {
            const filePath = path.join(dataDir, filename);
            const content = fs.readFileSync(filePath, 'utf-8');
            const records = parse(content, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            for (const row of records) {
                const parcelId = row['Parcel ID'];
                if (!parcelId) continue;

                let current = expectedScores.get(parcelId);
                if (!current) {
                    current = {
                        parcelId,
                        breakdown: [] // We will accumulate expected breakdown items here
                    };
                    expectedScores.set(parcelId, current);
                }
                mapper(row, current);
            }
        };

        // Define expected breakdown items based on CSV columns
        // This needs to match exactly what ParcelScorer outputs

        // 1. Habitats
        loadAndMerge('appx.a.parcelscorehabitats.csv', (row, current) => {
            if (parseInt(row['Wetland_300'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'Wetland w/300\' buffer', earnedScore: 1 });
            if (parseInt(row['IA'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'NYNHP Important Areas for Rare Animals', earnedScore: 1 });
            if (parseInt(row['Communities'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'NYNHP Significant Communities', earnedScore: 1 });
            if (parseInt(row['Resiliency'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'TNC Resilient Sites', earnedScore: 1 });
            if (parseInt(row['Cores'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'Ulster County Habitat Cores', earnedScore: 1 });
            if (parseInt(row['Pools'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'Vernal Pool with 750\' buffer', earnedScore: 1 });
            if (parseInt(row['Habitat_1'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'Hudsonia Mapped Crest/ledge/talus w/600\' buffer', earnedScore: 1 });
            if (parseInt(row['Habitat_2'])) current.breakdown.push({ category: 'Wildlife Habitat', name: 'Additional Significant Habitat', earnedScore: 1 });
        });

        // 2. Agricultural
        loadAndMerge('appx.a.parcelscoresagricultural.csv', (row, current) => {
            // Note: ParcelScorer uses score > 0 check. Ag_Soils in CSV is '2', scorer maps it to maxScore 1.
            if (parseInt(row['Ag_Soils']) > 0) current.breakdown.push({ category: 'Agricultural', name: 'Prime Soils if Drained', earnedScore: 1 });
        });

        // 3. Drinking Water
        loadAndMerge('appx.a.parcelscoresdrinkingwater.csv', (row, current) => {
            if (parseInt(row['EPA_Aquifers'])) current.breakdown.push({ category: 'Drinking Water', name: 'EPA Principal Aquifers', earnedScore: 1 });
            if (parseInt(row['Bedrock_Aquifers'])) current.breakdown.push({ category: 'Drinking Water', name: 'Bedrock Aquifers (Vly School Rondout)', earnedScore: 1 });
            if (parseInt(row['Ashokan_Watershed'])) current.breakdown.push({ category: 'Drinking Water', name: 'Ashokan Watershed', earnedScore: 1 });
            if (parseInt(row['Class_A_Streams'])) current.breakdown.push({ category: 'Drinking Water', name: 'DEC Class A Streams', earnedScore: 1 });
        });

        // 4. Forest
        loadAndMerge('appx.a_.parcelscoresforest.csv', (row, current) => {
            if (parseInt(row['Matrix_Forest'])) current.breakdown.push({ category: 'Forests and Woodlands', name: 'TNC Matrix Forest Blocks or Linkage Zones', earnedScore: 1 });
            if (parseInt(row['Core_Forest'])) current.breakdown.push({ category: 'Forests and Woodlands', name: 'NYNHP Core Forests', earnedScore: 1 });
            if (parseInt(row['High_Quality_Forest'])) current.breakdown.push({ category: 'Forests and Woodlands', name: 'NYNHP High Ranking Forests (60+ percentile)', earnedScore: 1 });
            if (parseInt(row['Roadless_Blocks'])) current.breakdown.push({ category: 'Forests and Woodlands', name: 'NYNHP Roadless Blocks (100+ acres)', earnedScore: 1 });
            if (parseInt(row['IA_Plants'])) current.breakdown.push({ category: 'Forests and Woodlands', name: 'NYNHP Important Areas for Rare Plants', earnedScore: 1 });
            if (parseInt(row['Protected_Adjacent'])) current.breakdown.push({ category: 'Forests and Woodlands', name: 'Adjacent to Protected Lands', earnedScore: 1 });
        });

        // Ensure CsvLoader is initialized (it loads from the same files, but we want to test the Scorer logic)
        CsvLoader.getInstance();
    });

    it('should match CSV scores for all parcels', async () => {
        console.log(`Verifying scores for ${expectedScores.size} parcels...`);
        let checkedCount = 0;

        for (const [parcelId, expected] of expectedScores) {
            const result = await scorer.scoreParcel(parcelId);

            // Filter result breakdown to only include matched items (earnedScore > 0)
            // The scorer returns all items with matched: true/false.
            // We only constructed the "expected" list with positive items.
            const actualPositiveItems = result.breakdown.filter((i: any) => i.earnedScore > 0);

            // Calculate expected total score from our constructed breakdown
            const expectedTotal = expected.breakdown.reduce((sum: number, item: any) => sum + item.earnedScore, 0);

            try {
                expect(result.totalScore).toBe(expectedTotal);
                expect(actualPositiveItems.length).toBe(expected.breakdown.length);

                // Verify each expected item is present in actual results
                for (const expectedItem of expected.breakdown) {
                    const found = actualPositiveItems.find((actual: any) =>
                        actual.category === expectedItem.category &&
                        actual.name === expectedItem.name
                    );
                    expect(found).toBeDefined();
                    expect(found.earnedScore).toBe(expectedItem.earnedScore);
                }
            } catch (e) {
                console.error(`Mismatch for Parcel ID: ${parcelId}`);
                console.error('Expected:', JSON.stringify(expected.breakdown, null, 2));
                console.error('Actual:', JSON.stringify(actualPositiveItems, null, 2));
                throw e;
            }
            checkedCount++;
        }
        console.log(`Successfully verified ${checkedCount} parcels.`);
    });
});
