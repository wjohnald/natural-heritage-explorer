import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class NYNHPFishAreas extends BaseCriterion {
    constructor() {
        super({
            id: 'nynhp-fish-areas',
            name: 'NYNHP Important Areas for Fish',
            category: 'Streams and Wetlands',
            maxScore: 1,
            serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer/6',
            implemented: true,
            notes: 'Important areas for migratory fish'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry);
    }
}
