import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class DECClassAStreams extends BaseCriterion {
    constructor() {
        super({
            id: 'dec-class-a-streams',
            name: 'DEC Class A Streams',
            category: 'Drinking Water',
            maxScore: 1,
            serviceUrl: 'https://gisservices.dec.ny.gov/arcgis/rest/services/hvnrm/hvnrm_streams_and_watersheds/MapServer/9',
            implemented: true,
            notes: 'Streams classified for drinking water usage'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        // Layer 9: DEC Stream Classification and Trout Status
        // Field: CLASSIFICA contains values like 'A', 'A-S', 'AA', 'AA-S'
        // A = Class A, AA = Class AA (highest quality), -S = Special designation
        // Note: Streams are line geometries, buffer catches streams on or near property
        return this.defaultEvaluation(geometry, {
            whereClause: "CLASSIFICA IN ('A', 'A-S', 'AA', 'AA-S') OR CLASSIFICA LIKE 'AA%' OR CLASSIFICA LIKE 'A-%'",
            buffer: 500 // 500 feet buffer - wider riparian buffer for drinking water protection zones
        });
    }
}
