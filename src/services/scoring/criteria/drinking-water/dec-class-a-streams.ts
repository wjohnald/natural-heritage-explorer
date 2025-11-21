import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class DECClassAStreams extends BaseCriterion {
    constructor() {
        super({
            id: 'dec-class-a-streams',
            name: 'DEC Class A Streams',
            category: 'Drinking Water',
            maxScore: 1,
            serviceUrl: 'https://services.arcgis.com/8f8K0s5eC4sA3g8V/arcgis/rest/services/Water_Quality_Classifications/FeatureServer/0',
            implemented: true,
            notes: 'Streams classified for drinking water usage'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry, {
            whereClause: "CLASS = 'A' OR CLASS LIKE 'A%'"
        });
    }
}
