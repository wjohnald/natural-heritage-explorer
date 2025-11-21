import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class FEMAFloodZones extends BaseCriterion {
    constructor() {
        super({
            id: 'fema-flood-zones',
            name: 'FEMA Flood Hazard Areas',
            category: 'Streams and Wetlands',
            maxScore: 1,
            serviceUrl: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28',
            implemented: true,
            notes: 'FEMA Special Flood Hazard Areas'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry);
    }
}
