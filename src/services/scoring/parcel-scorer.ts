import { CompositeScoreResult, CategoryScore, PriorityLevel } from './types';
import { CsvLoader } from './csv-loader';

export class ParcelScorer {
    constructor() { }

    /**
     * Maps a category's raw score total to a priority level and score value
     * based on Table 2.2 from the Marbletown CPP
     */
    private mapToPriority(category: string, rawTotal: number): { level: PriorityLevel; score: number } {
        if (rawTotal === 0) {
            return { level: 'None', score: 0 };
        }

        switch (category) {
            case 'Drinking Water':
                if (rawTotal >= 3) return { level: 'High', score: 3 };
                if (rawTotal === 2) return { level: 'Medium', score: 2 };
                return { level: 'Low', score: 1 };

            case 'Wildlife Habitat':
                if (rawTotal >= 6) return { level: 'High', score: rawTotal }; // 6-9 range
                if (rawTotal >= 4) return { level: 'Medium', score: rawTotal }; // 4-5 range
                return { level: 'Low', score: rawTotal }; // 1-3 range

            case 'Forests and Woodlands':
                if (rawTotal >= 4) return { level: 'High', score: rawTotal }; // 4-6 range
                if (rawTotal === 3) return { level: 'Medium', score: 3 };
                return { level: 'Low', score: rawTotal }; // 1-2 range

            case 'Agricultural':
                if (rawTotal >= 4) return { level: 'High', score: rawTotal }; // 4-6 range
                if (rawTotal === 3) return { level: 'Medium', score: 3 };
                return { level: 'Low', score: rawTotal }; // 1-2 range

            default:
                return { level: 'None', score: 0 };
        }
    }

    async scoreParcel(parcelId: string): Promise<CompositeScoreResult> {
        const csvLoader = CsvLoader.getInstance();
        const scores = csvLoader.getScores(parcelId);

        if (!scores) {
            console.warn(`No scores found for parcel ${parcelId}`);
            return {
                parcelId,
                compositeScore: 0,
                categories: [],
                breakdown: []
            };
        }

        // Define category criteria and their raw scores
        const categoryData = {
            'Drinking Water': [
                { name: 'EPA Principal Aquifers', score: scores.epaAquifers || 0 },
                { name: 'Bedrock Aquifers (Vly School Rondout)', score: scores.bedrockAquifers || 0 },
                { name: 'Ashokan Watershed', score: scores.ashokanWatershed || 0 },
                { name: 'DEC Class A Streams', score: scores.classAStreams || 0 }
            ],
            'Wildlife Habitat': [
                { name: 'Wetland w/300\' buffer', score: scores.wetland300 || 0 },
                { name: 'NYNHP Important Areas for Rare Animals', score: scores.ia || 0 },
                { name: 'NYNHP Significant Communities', score: scores.communities || 0 },
                { name: 'TNC Resilient Sites', score: scores.resiliency || 0 },
                { name: 'Ulster County Habitat Cores', score: scores.cores || 0 },
                { name: 'Vernal Pool with 750\' buffer', score: scores.pools || 0 },
                { name: 'Hudsonia Mapped Crest/ledge/talus w/600\' buffer', score: scores.habitat1 || 0 },
                { name: 'Additional Significant Habitat', score: scores.habitat2 || 0 }
            ],
            'Forests and Woodlands': [
                { name: 'TNC Matrix Forest Blocks or Linkage Zones', score: scores.matrixForest || 0 },
                { name: 'NYNHP Core Forests', score: scores.coreForest || 0 },
                { name: 'NYNHP High Ranking Forests (60+ percentile)', score: scores.highQualityForest || 0 },
                { name: 'NYNHP Roadless Blocks (100+ acres)', score: scores.roadlessBlocks || 0 },
                { name: 'NYNHP Important Areas for Rare Plants', score: scores.iaPlants || 0 },
                { name: 'Adjacent to Protected Lands', score: scores.protectedAdjacent || 0 }
            ],
            'Agricultural': [
                { name: 'Prime Soils if Drained', score: scores.agSoils || 0 }
            ]
        };

        // Calculate category scores
        const categories: CategoryScore[] = [];
        const breakdown: any[] = [];
        let compositeScore = 0;

        for (const [categoryName, criteria] of Object.entries(categoryData)) {
            // Sum raw scores for this category
            const rawScore = criteria.reduce((sum, c) => sum + c.score, 0);

            // Map to priority level
            const { level, score: priorityScore } = this.mapToPriority(categoryName, rawScore);

            // Add to composite score
            compositeScore += priorityScore;

            // Store category score
            categories.push({
                category: categoryName,
                rawScore,
                priorityLevel: level,
                priorityScore,
                criteria: criteria
                    .filter(c => c.score > 0)
                    .map(c => ({ name: c.name, earnedScore: c.score }))
            });

            // Add to detailed breakdown
            for (const criterion of criteria) {
                breakdown.push({
                    category: categoryName,
                    name: criterion.name,
                    maxScore: Math.max(criterion.score, 1),
                    earnedScore: criterion.score,
                    matched: criterion.score > 0,
                    implemented: true
                });
            }
        }

        return {
            parcelId,
            compositeScore,
            categories,
            breakdown
        };
    }
}
