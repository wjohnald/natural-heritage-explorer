import fs from 'fs';
import path from 'path';

// Map of Scientific Name -> State Protection Status
let conservationStatusMap: Map<string, string> | null = null;

export async function getConservationStatus(scientificName: string): Promise<string | null> {
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

            // CSV Columns based on inspection:
            // 0: Scientific name
            // 1: Common name
            // 2: Federal protection
            // 3: State protection
            // ...

            if (fields.length >= 4) {
                const name = fields[0]; // Scientific name
                const stateProtection = fields[9]; // State protection

                if (name && stateProtection) {
                    // Clean up quotes if they persist (though the parser logic above should handle the split, the content might still be quoted if the parser logic isn't perfect for stripping)
                    // Actually, my parser logic accumulates characters inside quotes but doesn't strip the surrounding quotes if I just toggle `inQuotes`.
                    // Wait, my parser logic:
                    // if char is ", toggle.
                    // else add char.
                    // So "foo" becomes foo (if I don't add the quote to currentField).
                    // Ah, I AM adding the quote to currentField?
                    // No, `if (char === '"')` block does NOT add to `currentField`.
                    // So it strips quotes! Good.

                    conservationStatusMap.set(name, stateProtection);
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
