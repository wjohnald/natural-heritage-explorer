import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class Wetland100ftBuffer extends BaseCriterion {
    constructor() {
        super({
            id: 'wetland-100ft-buffer',
            name: 'Wetland with 100\' buffer',
            category: 'Streams and Wetlands',
            maxScore: 1,
            serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer/0',
            implemented: true,
            notes: 'State regulated freshwater wetlands with 100ft buffer'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry, {
            buffer: 100 // 100 feet buffer
        });
    }
}
