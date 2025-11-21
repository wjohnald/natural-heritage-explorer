import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class NationalRegister extends BaseCriterion {
    constructor() {
        super({
            id: 'national-register',
            name: 'National Register Historic Sites and Districts',
            category: 'Historic and Cultural',
            maxScore: 1,
            serviceUrl: 'https://services.arcgis.com/g1fFjdXvjB9W7H12/arcgis/rest/services/National_Register_Building_Listings/FeatureServer/0',
            implemented: true,
            notes: 'Listed on State/National Register of Historic Places or National Historic Landmarks'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        return this.defaultEvaluation(geometry);
    }
}
