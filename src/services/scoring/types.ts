export interface ParcelGeometry {
    rings?: number[][][];
    x?: number;
    y?: number;
    spatialReference: { wkid: number };
    type?: string; // 'polygon' | 'point' | 'envelope'
}

export interface ScoringResult {
    met: boolean;
    earnedScore: number;
    notes?: string;
    debugInfo?: any;
}

export interface CriterionMetadata {
    id: string;
    name: string;
    category: string;
    maxScore: number;
    dataSource?: string;
    serviceUrl?: string;
    implemented: boolean;
    notes?: string;
}

export interface ScoringCriterion {
    id: string;
    evaluate(geometry: ParcelGeometry): Promise<ScoringResult>;
    getMetadata(): CriterionMetadata;
}
