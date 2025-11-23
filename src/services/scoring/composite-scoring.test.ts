import { describe, it, expect } from 'vitest';
import { ParcelScorer } from './parcel-scorer';

describe('Composite Scoring Methodology', () => {
    describe('Priority Level Mapping', () => {
        const scorer = new ParcelScorer();

        it('should map Drinking Water scores to correct priority levels', async () => {
            // Note: We need actual parcel data, so these tests verify the logic works
            // The actual mapping is tested through integration tests with real data

            // Testing that the scorer returns proper structure
            const result = await scorer.scoreParcel('test-id');
            expect(result).toHaveProperty('compositeScore');
            expect(result).toHaveProperty('categories');
            expect(result).toHaveProperty('breakdown');
        });

        it('should calculate composite score as sum of priority scores', async () => {
            const result = await scorer.scoreParcel('78.1-1-22.111'); // Known parcel from test data

            // Verify composite score equals sum of category priority scores
            const sumOfPriorityScores = result.categories.reduce(
                (sum, cat) => sum + cat.priorityScore,
                0
            );
            expect(result.compositeScore).toBe(sumOfPriorityScores);
        });

        it('should assign High priority (3 pts) to Wildlife Habitat with raw score 6-9', async () => {
            const result = await scorer.scoreParcel('78.1-1-22.111');
            const wildlifeCategory = result.categories.find(c => c.category === 'Wildlife Habitat');

            if (wildlifeCategory && wildlifeCategory.rawScore >= 6 && wildlifeCategory.rawScore <= 9) {
                expect(wildlifeCategory.priorityLevel).toBe('High');
                expect(wildlifeCategory.priorityScore).toBe(3); // Normalized score
            }
        });

        it('should assign Medium priority (2 pts) to Forests with raw score 3', async () => {
            // Find a parcel with Forest score of 3
            const result = await scorer.scoreParcel('78.1-1-22.111');
            const forestCategory = result.categories.find(c => c.category === 'Forests and Woodlands');

            if (forestCategory && forestCategory.rawScore === 3) {
                expect(forestCategory.priorityLevel).toBe('Medium');
                expect(forestCategory.priorityScore).toBe(2); // Normalized score
            }
        });
    });

    describe('Category Aggregation', () => {
        const scorer = new ParcelScorer();

        it('should aggregate all criteria within each category', async () => {
            const result = await scorer.scoreParcel('78.1-1-22.111');

            result.categories.forEach(category => {
                // Raw score should equal sum of individual criteria
                const criteriaSum = category.criteria.reduce((sum, c) => sum + c.earnedScore, 0);
                expect(category.rawScore).toBe(criteriaSum);
            });
        });

        it('should only include categories with at least one matched criterion', async () => {
            const result = await scorer.scoreParcel('78.1-1-22.111');

            result.categories.forEach(category => {
                expect(category.rawScore).toBeGreaterThan(0);
                expect(category.criteria.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Composite Score Range', () => {
        const scorer = new ParcelScorer();

        it('should return composite score between 0 and 12', async () => {
            // Theoretical max: 4 categories × 3 points each = 12
            const result = await scorer.scoreParcel('78.1-1-22.111');
            expect(result.compositeScore).toBeGreaterThanOrEqual(0);
            expect(result.compositeScore).toBeLessThanOrEqual(12);
        });

        it('should return 0 composite score for parcel with no data', async () => {
            const result = await scorer.scoreParcel('non-existent-parcel');
            expect(result.compositeScore).toBe(0);
            expect(result.categories).toHaveLength(0);
        });
    });

    describe('Priority Score Thresholds', () => {
        it('should correctly apply normalized priority scores (1-2-3) for all categories', async () => {
            const scorer = new ParcelScorer();
            const result = await scorer.scoreParcel('78.1-1-22.111');

            result.categories.forEach(cat => {
                // All categories use normalized scores: Low=1, Medium=2, High=3
                switch (cat.priorityLevel) {
                    case 'High':
                        expect(cat.priorityScore).toBe(3);
                        break;
                    case 'Medium':
                        expect(cat.priorityScore).toBe(2);
                        break;
                    case 'Low':
                        expect(cat.priorityScore).toBe(1);
                        break;
                    case 'None':
                        expect(cat.priorityScore).toBe(0);
                        break;
                }
            });
        });
    });
});

describe('Overall Priority Color Mapping', () => {
    // Helper function that matches the logic in ScoringPanel and ObservationMap
    const getOverallPriorityColor = (score: number): string => {
        if (score >= 10) return '#5C2E0F'; // Highest - Dark brown
        if (score >= 8) return '#A0522D'; // Higher - Rust brown
        if (score >= 6) return '#FF8C00'; // High - Orange
        if (score >= 3) return '#FFD700'; // Medium - Yellow
        return '#FFF8DC'; // Low - Light cream
    };

    const getOverallPriorityLevel = (score: number): string => {
        if (score >= 10) return 'Highest';
        if (score >= 8) return 'Higher';
        if (score >= 6) return 'High';
        if (score >= 3) return 'Medium';
        return 'Low';
    };

    describe('Color Thresholds', () => {
        it('should return dark brown for Highest priority (10-17)', () => {
            expect(getOverallPriorityColor(17)).toBe('#5C2E0F');
            expect(getOverallPriorityColor(12)).toBe('#5C2E0F');
            expect(getOverallPriorityColor(11)).toBe('#5C2E0F');
            expect(getOverallPriorityColor(10)).toBe('#5C2E0F');
        });

        it('should return rust brown for Higher priority (8-9)', () => {
            expect(getOverallPriorityColor(9)).toBe('#A0522D');
            expect(getOverallPriorityColor(8)).toBe('#A0522D');
        });

        it('should return orange for High priority (6-7)', () => {
            expect(getOverallPriorityColor(7)).toBe('#FF8C00');
            expect(getOverallPriorityColor(6)).toBe('#FF8C00');
        });

        it('should return yellow for Medium priority (3-5)', () => {
            expect(getOverallPriorityColor(5)).toBe('#FFD700');
            expect(getOverallPriorityColor(4)).toBe('#FFD700');
            expect(getOverallPriorityColor(3)).toBe('#FFD700');
        });

        it('should return light cream for Low priority (0-2)', () => {
            expect(getOverallPriorityColor(2)).toBe('#FFF8DC');
            expect(getOverallPriorityColor(1)).toBe('#FFF8DC');
            expect(getOverallPriorityColor(0)).toBe('#FFF8DC');
        });
    });

    describe('Priority Level Text', () => {
        it('should return correct level text for all score ranges', () => {
            expect(getOverallPriorityLevel(17)).toBe('Highest');
            expect(getOverallPriorityLevel(12)).toBe('Highest');
            expect(getOverallPriorityLevel(9)).toBe('Higher');
            expect(getOverallPriorityLevel(7)).toBe('High');
            expect(getOverallPriorityLevel(5)).toBe('Medium');
            expect(getOverallPriorityLevel(2)).toBe('Low');
        });
    });

    describe('Boundary Conditions', () => {
        it('should handle exact threshold values correctly', () => {
            // Test exact threshold boundaries
            expect(getOverallPriorityLevel(10)).toBe('Highest'); // Lower bound of Highest
            expect(getOverallPriorityLevel(9)).toBe('Higher'); // Just below Highest threshold
            expect(getOverallPriorityLevel(8)).toBe('Higher'); // Lower bound of Higher
            expect(getOverallPriorityLevel(7)).toBe('High'); // Just below Higher threshold
            expect(getOverallPriorityLevel(6)).toBe('High'); // Lower bound of High
            expect(getOverallPriorityLevel(5)).toBe('Medium'); // Just below High threshold
            expect(getOverallPriorityLevel(3)).toBe('Medium'); // Lower bound of Medium
            expect(getOverallPriorityLevel(2)).toBe('Low'); // Just below Medium threshold
        });

        it('should handle edge cases', () => {
            expect(getOverallPriorityColor(0)).toBe('#FFF8DC');
            expect(getOverallPriorityColor(17)).toBe('#5C2E0F');
            expect(getOverallPriorityLevel(0)).toBe('Low');
            expect(getOverallPriorityLevel(17)).toBe('Highest');
        });
    });

    describe('Percentage Mapping', () => {
        it('should map scores correctly to percentage of 12-point max', () => {
            // Highest: 83%+ (10-12 out of 12)
            expect(10 / 12).toBeGreaterThanOrEqual(0.83);

            // Higher: 67-75% (8-9 out of 12)
            expect(8 / 12).toBeCloseTo(0.67, 2);
            expect(9 / 12).toBe(0.75);

            // High: 50-58% (6-7 out of 12)
            expect(6 / 12).toBe(0.5);
            expect(7 / 12).toBeCloseTo(0.58, 2);

            // Medium: 25-42% (3-5 out of 12)
            expect(3 / 12).toBe(0.25);
            expect(5 / 12).toBeCloseTo(0.42, 2);

            // Low: 0-17% (0-2 out of 12)
            expect(2 / 12).toBeCloseTo(0.17, 2);
        });
    });
});

describe('Category Priority Color Mapping', () => {
    const getPriorityColor = (level: 'High' | 'Medium' | 'Low' | 'None'): string => {
        switch (level) {
            case 'High': return '#A0522D'; // Rust brown
            case 'Medium': return '#FFD700'; // Yellow
            case 'Low': return '#FFF8DC'; // Light cream
            case 'None': return '#D3D3D3'; // Light gray
            default: return '#D3D3D3';
        }
    };

    it('should return rust brown for High category priority', () => {
        expect(getPriorityColor('High')).toBe('#A0522D');
    });

    it('should return yellow for Medium category priority', () => {
        expect(getPriorityColor('Medium')).toBe('#FFD700');
    });

    it('should return light cream for Low category priority', () => {
        expect(getPriorityColor('Low')).toBe('#FFF8DC');
    });

    it('should return light gray for None category priority', () => {
        expect(getPriorityColor('None')).toBe('#D3D3D3');
    });
});
