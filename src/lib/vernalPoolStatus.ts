import fs from 'fs';
import path from 'path';

export interface VernalPoolData {
    vernalPoolStatus: 'Obligate' | 'Facultative' | null;
    taxonomicGroup: string | null;
    notes: string | null;
}

// Map of Scientific Name -> Vernal Pool Data
let vernalPoolStatusMap: Map<string, VernalPoolData> | null = null;

export async function getVernalPoolStatus(scientificName: string): Promise<VernalPoolData | null> {
    if (!vernalPoolStatusMap) {
        await loadVernalPoolStatuses();
    }
    return vernalPoolStatusMap?.get(scientificName) || null;
}

async function loadVernalPoolStatuses() {
    const filePath = path.join(process.cwd(), 'src', 'static', 'ny-vernal-pool-species.csv');
    console.log('Loading vernal pool statuses from:', filePath);

    try {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        console.log('Read', lines.length, 'lines from vernal pool CSV');

        vernalPoolStatusMap = new Map();

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
            // 0: Scientific Name
            // 1: Common Name
            // 2: Vernal Pool Status (Obligate/Facultative)
            // 3: Taxonomic Group
            // 4: Notes
            // 5: Source

            if (fields.length >= 4) {
                const scientificName = fields[0];
                const vernalPoolStatus = fields[2] as 'Obligate' | 'Facultative';
                const taxonomicGroup = fields[3];
                const notes = fields[4] || null;

                if (scientificName && (vernalPoolStatus === 'Obligate' || vernalPoolStatus === 'Facultative')) {
                    vernalPoolStatusMap.set(scientificName, {
                        vernalPoolStatus,
                        taxonomicGroup,
                        notes,
                    });
                }
            }
        }
        console.log(`Loaded ${vernalPoolStatusMap.size} vernal pool species.`);
    } catch (error) {
        console.error('Error loading vernal pool statuses:', error);
        // Initialize empty map to prevent retrying on every call if file is missing
        vernalPoolStatusMap = new Map();
    }
}

