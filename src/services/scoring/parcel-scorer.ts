import { ScoringCriterion, ParcelGeometry, ScoringResult } from './types';
import {
    DECClassAStreams,
    EPAPrincipalAquifers,
    Wetland300ftBuffer,
    DECSBAS,
    Wetland100ftBuffer,
    NYNHPFishAreas,
    FEMAFloodZones,
    HydricSoils,
    HamletProximity,
    AdjacentProtectedLands,
    NationalRegister,
    AgDistricts
} from './criteria';

export class ParcelScorer {
    private criteria: ScoringCriterion[];

    constructor() {
        this.criteria = [
            // Drinking Water
            new DECClassAStreams(),
            new EPAPrincipalAquifers(),

            // Wildlife Habitat
            new Wetland300ftBuffer(),
            new DECSBAS(),
            // TODO: Add NYNHP Important Areas for Rare Animals (requires multi-layer logic)
            // TODO: Add Audubon IBAs
            // TODO: Add NYNHP Significant Communities

            // Streams and Wetlands
            new Wetland100ftBuffer(),
            new NYNHPFishAreas(),
            new FEMAFloodZones(),
            new HydricSoils(),

            // Recreation and Trails
            new HamletProximity(),
            new AdjacentProtectedLands('Recreation and Trails', 1.5),

            // Historic and Cultural
            new NationalRegister(),

            // Agricultural
            new AgDistricts(),
            new AdjacentProtectedLands('Agricultural', 1),

            // Forests and Woodlands
            new AdjacentProtectedLands('Forests and Woodlands', 1),
            // TODO: Add NYNHP Important Areas for Rare Plants
        ];
    }

    async scoreParcel(geometry: ParcelGeometry): Promise<any> {
        const results: any[] = [];
        let totalScore = 0;

        // Run all evaluations in parallel
        const evaluations = await Promise.all(
            this.criteria.map(async (criterion) => {
                try {
                    const result = await criterion.evaluate(geometry);
                    return {
                        criterion,
                        result
                    };
                } catch (error) {
                    console.error(`Error evaluating criterion ${criterion.id}:`, error);
                    return {
                        criterion,
                        result: {
                            met: false,
                            earnedScore: 0,
                            notes: 'Error evaluating criterion'
                        } as ScoringResult
                    };
                }
            })
        );

        // Process results
        for (const { criterion, result } of evaluations) {
            const metadata = criterion.getMetadata();

            if (result.met) {
                totalScore += result.earnedScore;
            }

            results.push({
                category: metadata.category,
                name: metadata.name,
                maxScore: metadata.maxScore,
                earnedScore: result.earnedScore,
                matched: result.met,
                implemented: true,
                notes: result.notes || metadata.notes
            });
        }

        return {
            totalScore,
            breakdown: results
        };
    }
}
