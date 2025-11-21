import { BaseCriterion } from '../../base-criterion';
import { CriterionMetadata, ParcelGeometry, ScoringResult } from '../../types';

export class AdjacentProtectedLands extends BaseCriterion {
    constructor(category: string = 'Recreation and Trails', score: number = 1.5) {
        super({
            id: `adjacent-protected-lands-${category.toLowerCase().replace(/\s+/g, '-')}`,
            name: 'Adjacent to protected land',
            category: category,
            maxScore: score,
            serviceUrl: 'https://services1.arcgis.com/ERdCHt0GP5kZ89ro/arcgis/rest/services/PAD_US3_0Combined/FeatureServer/0',
            implemented: true,
            notes: 'Adjacent to protected land (PAD-US)'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        // Buffer 0 means touching/adjacent
        return this.defaultEvaluation(geometry, {
            buffer: 0
        });
    }
}
