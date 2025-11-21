import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class Wetland300ftBuffer extends BaseCriterion {
    constructor() {
        super({
            id: 'wetland-300ft-buffer',
            name: 'Wetland with 300\' buffer',
            category: 'Wildlife Habitat',
            maxScore: 1,
            serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/erm/informational_freshwater_wetlands/MapServer/0',
            implemented: true,
            notes: 'State regulated freshwater wetlands with 300ft buffer'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry, {
            buffer: 300 // 300 feet buffer
        });
    }
}
