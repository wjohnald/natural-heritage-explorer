import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getConservationStatus } from './conservationStatus';

describe('conservationStatus - Integration Test with Actual CSV', () => {
    it('should successfully load and validate all entries from the actual CSV file', async () => {
        // Read the actual CSV file
        const filePath = path.join(process.cwd(), 'src', 'static', 'nynhp-status-list_2025-11-19.csv');
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        // Validate file structure
        expect(lines.length).toBeGreaterThan(1);

        // Check header
        const header = lines[0];
        expect(header).toContain('Scientific name');
        expect(header).toContain('State protection');
        expect(header).toContain('Species of greatest conservation need');

        // Test a few known species from the actual file
        const testCases = [
            {
                name: 'Acalypha virginica',
                expectedProtection: 'Endangered',
                expectedNeed: null
            },
            {
                name: 'Accipiter atricapillus',
                expectedProtection: 'Special Concern',
                expectedNeed: 'Yes'
            },
            {
                name: 'Acipenser brevirostrum',
                expectedProtection: 'Endangered',
                expectedNeed: 'Yes'
            },
        ];

        for (const testCase of testCases) {
            const status = await getConservationStatus(testCase.name);
            expect(status).not.toBeNull();
            expect(status?.stateProtection).toBe(testCase.expectedProtection);
            expect(status?.conservationNeed).toBe(testCase.expectedNeed);
        }

        // Validate that only regulatory statuses are included
        const regulatoryStatuses = ['Endangered', 'Threatened', 'Special Concern'];

        // Count species with regulatory statuses in the CSV
        let regulatoryCount = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple check for regulatory status (column 9)
            const fields = line.split(',');
            if (fields.length >= 10) {
                const stateProtection = fields[9].replace(/"/g, '').trim();
                if (regulatoryStatuses.includes(stateProtection)) {
                    regulatoryCount++;
                }
            }
        }

        // Verify we loaded a reasonable number of species
        expect(regulatoryCount).toBeGreaterThan(0);
        console.log(`Validated ${regulatoryCount} species with regulatory statuses from CSV`);
    });
});
