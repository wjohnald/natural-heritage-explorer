import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class EPAPrincipalAquifers extends BaseCriterion {
    constructor() {
        super({
            id: 'epa-principal-aquifers',
            name: 'EPA Principal Aquifers',
            category: 'Drinking Water',
            maxScore: 1,
            serviceUrl: 'https://geopub.epa.gov/arcgis/rest/services/NEPAssist/Water/MapServer/6',
            // Checking original route.ts...
            // Original: serviceUrl: 'https://services.arcgis.com/8f8K0s5eC4sA3g8V/arcgis/rest/services/Water_Quality_Classifications/FeatureServer/0'
            // Wait, that's the same as DEC Class A Streams. Let me check route.ts again.
            implemented: false, // It was commented out or had issues in original code?
            notes: 'Principal aquifers for drinking water'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        // In original code, this might have been using a different service or was placeholder.
        // Let's check route.ts content.
        return this.defaultEvaluation(geometry);
    }
}
