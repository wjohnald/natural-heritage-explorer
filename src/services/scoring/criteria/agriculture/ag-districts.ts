import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class AgDistricts extends BaseCriterion {
    constructor() {
        super({
            id: 'ag-districts',
            name: 'Agricultural District',
            category: 'Agricultural',
            maxScore: 1,
            serviceUrl: 'https://gisservices.its.ny.gov/arcgis/rest/services/AgDistricts_2017/MapServer/0',
            implemented: true,
            notes: 'NYS Certified Agricultural Districts'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry);
    }
}
