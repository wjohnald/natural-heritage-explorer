import { ScoringResult } from './types';
import { CsvLoader } from './csv-loader';

export class ParcelScorer {
    constructor() { }

    async scoreParcel(parcelId: string): Promise<any> {
        const csvLoader = CsvLoader.getInstance();
        const scores = csvLoader.getScores(parcelId);

        const results: any[] = [];
        let totalScore = 0;

        if (!scores) {
            console.warn(`No scores found for parcel ${parcelId}`);
            return {
                totalScore: 0,
                breakdown: []
            };
        }

        // Helper to add result
        const addResult = (category: string, name: string, score: number, maxScore: number = 1, notes?: string) => {
            const earnedScore = score > 0 ? (score === 1 ? maxScore : score) : 0;
            const matched = score > 0;
            const finalScore = matched ? maxScore : 0;

            if (matched) {
                totalScore += finalScore;
            }

            results.push({
                category,
                name,
                maxScore,
                earnedScore: finalScore,
                matched,
                implemented: true,
                notes
            });
        };

        // Drinking Water
        addResult('Drinking Water', 'EPA Principal Aquifers', scores.epaAquifers || 0, 1);
        addResult('Drinking Water', 'Bedrock Aquifers (Vly School Rondout)', scores.bedrockAquifers || 0, 1);
        addResult('Drinking Water', 'Ashokan Watershed', scores.ashokanWatershed || 0, 1);
        addResult('Drinking Water', 'DEC Class A Streams', scores.classAStreams || 0, 1);

        // Wildlife Habitat
        addResult('Wildlife Habitat', 'Wetland w/300\' buffer', scores.wetland300 || 0, 1);
        addResult('Wildlife Habitat', 'NYNHP Important Areas for Rare Animals', scores.ia || 0, 1);
        addResult('Wildlife Habitat', 'NYNHP Significant Communities', scores.communities || 0, 1);
        addResult('Wildlife Habitat', 'TNC Resilient Sites', scores.resiliency || 0, 1, 'Only linkages present in town');
        addResult('Wildlife Habitat', 'Ulster County Habitat Cores', scores.cores || 0, 1);
        addResult('Wildlife Habitat', 'Vernal Pool with 750\' buffer', scores.pools || 0, 1, 'Includes Intermittent Woodland Pools with 750\' buffer per Hudsonia Report');
        addResult('Wildlife Habitat', 'Hudsonia Mapped Crest/ledge/talus w/600\' buffer', scores.habitat1 || 0, 1, '600\' buffer based on Hudsonia report');
        // Assuming Habitat_2 is another habitat or placeholder
        if (scores.habitat2) {
            addResult('Wildlife Habitat', 'Additional Significant Habitat', scores.habitat2, 1);
        }

        // Forests and Woodlands
        addResult('Forests and Woodlands', 'TNC Matrix Forest Blocks or Linkage Zones', scores.matrixForest || 0, 1);
        addResult('Forests and Woodlands', 'NYNHP Core Forests', scores.coreForest || 0, 1);
        addResult('Forests and Woodlands', 'NYNHP High Ranking Forests (60+ percentile)', scores.highQualityForest || 0, 1);
        addResult('Forests and Woodlands', 'NYNHP Roadless Blocks (100+ acres)', scores.roadlessBlocks || 0, 1);
        addResult('Forests and Woodlands', 'NYNHP Important Areas for Rare Plants', scores.iaPlants || 0, 1);
        addResult('Forests and Woodlands', 'Adjacent to Protected Lands', scores.protectedAdjacent || 0, 1);

        // Agricultural
        addResult('Agricultural', 'Prime Soils if Drained', scores.agSoils || 0, 1); // Note: CSV might have 2 for this? "Ag_Soils" in sample was 2.


        return {
            totalScore,
            breakdown: results
        };
    }
}
