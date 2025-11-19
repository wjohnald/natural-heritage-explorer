import { iNaturalistObservation } from '@/types';

/**
 * Format observation date as YYYY-MM-DD
 */
export function formatObservationDate(obs: iNaturalistObservation): string {
    // Try to parse observed_on_string which might be in various formats
    const dateStr = obs.observed_on_string;
    if (!dateStr) return '';

    try {
        // Try parsing the date
        const date = new Date(dateStr);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return '';
        }

        // Format as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch {
        return '';
    }
}

