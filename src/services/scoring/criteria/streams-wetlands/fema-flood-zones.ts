import { BaseCriterion } from '../../base-criterion';
import { ParcelGeometry, ScoringResult } from '../../types';

export class FEMAFloodZones extends BaseCriterion {
    constructor() {
        super({
            id: 'fema-flood-zones',
            name: 'FEMA Flood Hazard Areas',
            category: 'Streams and Wetlands',
            maxScore: 1,
            serviceUrl: 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28',
            implemented: true,
            notes: 'FEMA Special Flood Hazard Areas'
        });
    }

    async evaluate(geometry: ParcelGeometry): Promise<ScoringResult> {
        // FEMA service supports Web Mercator (EPSG:3857) with on-the-fly reprojection
        // No manual conversion needed - use geometry as-is
        console.log('[FEMA DEBUG] Geometry spatial reference:', geometry.spatialReference);
        console.log('[FEMA DEBUG] First ring has', geometry.rings?.[0]?.length, 'points');
        console.log('[FEMA DEBUG] Service URL:', this.metadata.serviceUrl);
        
        // Filter for Special Flood Hazard Areas (SFHA) only
        // SFHA_TF = 'T' means it's a true Special Flood Hazard Area (high-risk zones like A, AE, VE)
        // Excludes Zone X (minimal hazard), Zone B/C (moderate hazard), etc.
        return this.defaultEvaluation(geometry, {
            whereClause: "SFHA_TF = 'T'"
        });
    }
}
