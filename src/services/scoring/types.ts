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

export interface ParcelScores {
    parcelId: string;

    // Habitats
    ia?: number;
    communities?: number;
    resiliency?: number;
    species?: number;
    cores?: number;
    pools?: number;
    wetland300?: number;
    habitat1?: number;
    habitat2?: number;

    // Agricultural
    agSoils?: number;
    agDistrict?: number;
    farmsAdjacent?: number;
    protected?: number;
    centuryFarms?: number;

    // Drinking Water
    epaAquifers?: number;
    bedrockAquifers?: number;
    ashokanWatershed?: number;
    classAStreams?: number;

    // Forest
    matrixForest?: number;
    coreForest?: number;
    highQualityForest?: number;
    roadlessBlocks?: number;
    iaPlants?: number;
    protectedAdjacent?: number;
}
