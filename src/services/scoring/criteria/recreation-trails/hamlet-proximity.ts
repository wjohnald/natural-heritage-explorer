import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class HamletProximity extends BaseCriterion {
    constructor() {
        super({
            id: 'hamlet-proximity',
            name: 'Within 1 Mile of Hamlet Centers',
            category: 'Recreation and Trails',
            maxScore: 1,
            serviceUrl: 'https://gisservices.its.ny.gov/arcgis/rest/services/NYS_Place_Points/MapServer/0',
            implemented: true,
            notes: 'Proximity to hamlet centers enhances community access'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry, {
            whereClause: "PLACETYPE = 'Hamlet'",
            buffer: 5280 // 1 mile in feet
        });
    }
}
