import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';
import { queryWFSService } from '../../query-helpers';

export class AgDistricts extends BaseCriterion {
    constructor() {
        super({
            id: 'ag-districts',
            name: 'Agricultural District',
            category: 'Agricultural',
            maxScore: 1,
            // Using Cornell CUGIR WFS service as the NYS ITS MapServer is deprecated
            serviceUrl: 'https://cugir.library.cornell.edu/geoserver/cugir/wfs',
            implemented: true,
            notes: 'NYS Certified Agricultural Districts (Source: Cornell CUGIR)'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        const met = await queryWFSService(
            this.metadata.serviceUrl!,
            'cugir:cugir009010',
            geometry
        );

        return {
            met,
            earnedScore: met ? this.metadata.maxScore : 0,
            notes: this.metadata.notes
        };
    }
}
