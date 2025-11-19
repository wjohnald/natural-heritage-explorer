import fs from 'fs';
import path from 'path';

export interface ConservationData {
    stateProtection: string | null;
    conservationNeed: string | null;
}

// Map of Scientific Name -> Conservation Data
let conservationStatusMap: Map<string, ConservationData> | null = null;

export async function getConservationStatus(scientificName: string): Promise<ConservationData | null> {
    if (!conservationStatusMap) {
        await loadConservationStatuses();
    }
    return conservationStatusMap?.get(scientificName) || null;
}

async function loadConservationStatuses() {
    const filePath = path.join(process.cwd(), 'src', 'static', 'nynhp-status-list_2025-11-19.csv');
    console.log('Loading conservation statuses from:', filePath);

    try {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        console.log('Read', lines.length, 'lines from CSV');

        conservationStatusMap = new Map();

        // Skip header row (index 0)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parser that handles quoted fields
            const fields: string[] = [];
            let currentField = '';
            let inQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            fields.push(currentField.trim());

            // CSV Columns:
            // 0: Scientific name
            // 1: Status url
            // 2: Primary common name
            // 3: Class
            // 4: Order
            // 5: Family
            // 6: Global conservation status rank
            // 7: State conservation status rank
            // 8: Federal protection
            // 9: State protection
            // 10: Species of greatest conservation need
            // 11: Track status code
            // 12: Animal / Plant

            if (fields.length >= 11) {
                const name = fields[0]; // Scientific name
                const stateProtectionRaw = fields[9]; // State protection
                const conservationNeed = fields[10]; // Species of greatest conservation need

                // Only include regulatory statuses for state protection
                const regulatoryStatuses = ['Endangered', 'Threatened', 'Special Concern'];
                const stateProtection = stateProtectionRaw && regulatoryStatuses.includes(stateProtectionRaw) 
                    ? stateProtectionRaw 
                    : null;

                if (name) {
                    conservationStatusMap.set(name, {
                        stateProtection: stateProtection,
                        conservationNeed: conservationNeed || null,
                    });
                }
            }
        }
        console.log(`Loaded ${conservationStatusMap.size} conservation statuses.`);
    } catch (error) {
        console.error('Error loading conservation statuses:', error);
        // Initialize empty map to prevent retrying on every call if file is missing
        conservationStatusMap = new Map();
    }
}
