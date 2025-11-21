import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class DECSBAS extends BaseCriterion {
    constructor() {
        super({
            id: 'dec-sbas',
            name: 'DEC Significant Biodiversity Areas (SBAs)',
            category: 'Wildlife Habitat',
            maxScore: 1,
            serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_biodiversity/MapServer/5',
            implemented: true,
            notes: 'Significant Biodiversity Areas in the Hudson River Estuary corridor'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry);
    }
}
