import { CriterionMetadata, ParcelGeometry, ScoringCriterion, ScoringResult } from './types';
import { queryFeatureService } from './query-helpers';

export abstract class BaseCriterion implements ScoringCriterion {
    protected metadata: CriterionMetadata;

    constructor(metadata: CriterionMetadata) {
        this.metadata = metadata;
    }

    get id(): string {
        return this.metadata.id;
    }

    getMetadata(): CriterionMetadata {
        return this.metadata;
    }

    abstract evaluate(geometry: ParcelGeometry): Promise<ScoringResult>;

    /**
     * Helper method to check for intersection with a feature service
     */
    protected async checkIntersection(
        geometry: ParcelGeometry,
        options: {
            serviceUrl?: string;
            layerId?: number;
            whereClause?: string;
            buffer?: number;
        } = {}
    ): Promise<boolean> {
        const serviceUrl = options.serviceUrl || this.metadata.serviceUrl;

        if (!serviceUrl) {
            console.error(`No service URL provided for criterion ${this.metadata.id}`);
            return false;
        }

        return queryFeatureService(serviceUrl, geometry, {
            layerId: options.layerId,
            whereClause: options.whereClause,
            buffer: options.buffer
        });
    }

    /**
     * Default implementation for simple intersection criteria
     * Can be overridden by subclasses for more complex logic
     */
    protected async defaultEvaluation(
        geometry: ParcelGeometry,
        options: {
            whereClause?: string;
            buffer?: number;
        } = {}
    ): Promise<ScoringResult> {
        const met = await this.checkIntersection(geometry, options);

        return {
            met,
            earnedScore: met ? this.metadata.maxScore : 0,
            notes: this.metadata.notes
        };
    }
}
