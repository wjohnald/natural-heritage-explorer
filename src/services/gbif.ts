import { Coordinates, GBIFObservation, GBIFObservationResponse } from '@/types';

/**
 * Fetch GBIF observations within a radius of given coordinates
 */
export async function fetchGBIFObservations(
    coordinates: Coordinates,
    radiusMiles: number,
    onProgress?: (current: number, total: number) => void
): Promise<GBIFObservation[]> {
    let currentPage = 1;
    let hasMore = true;
    let allObservations: GBIFObservation[] = [];

    while (hasMore) {
        const url = `/api/gbif-observations?lat=${coordinates.lat}&lon=${coordinates.lon}&radius=${radiusMiles}&page=${currentPage}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch GBIF observations');
        }

        const data: GBIFObservationResponse = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        const newObservations = data.observations;
        allObservations = [...allObservations, ...newObservations];

        if (onProgress) {
            onProgress(allObservations.length, data.total_results);
        }

        // Check if we should fetch more
        if (allObservations.length >= data.total_results || newObservations.length === 0) {
            hasMore = false;
        } else {
            currentPage++;
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return allObservations;
}

/**
 * Get the best photo URL for a GBIF observation
 */
export function getGBIFPhotoUrl(observation: GBIFObservation): string | null {
    if (!observation.media || observation.media.length === 0) {
        return null;
    }

    // Try to find any image media item
    const image = observation.media.find(m =>
        m.type === 'StillImage' ||
        m.type === 'Image' ||
        (m.format && m.format.startsWith('image/'))
    );

    if (image && image.identifier) {
        return image.identifier;
    }

    // Fallback: if no typed image found, try first media item with identifier
    const firstMediaWithIdentifier = observation.media.find(m => m.identifier);
    if (firstMediaWithIdentifier) {
        return firstMediaWithIdentifier.identifier;
    }

    return null;
}

/**
 * Get the display name for a GBIF observation
 */
export function getGBIFObservationName(observation: GBIFObservation): string {
    if (observation.vernacularName) {
        return observation.vernacularName;
    }
    if (observation.scientificName) {
        return observation.scientificName;
    }
    return 'Unknown Species';
}

/**
 * Check if a GBIF observation is from iNaturalist
 */
export function isFromINaturalist(observation: GBIFObservation): boolean {
    const INATURALIST_DATASET_KEY = '50c9509d-22c7-4a22-a47d-8c48425ef4a7';
    return (
        observation.datasetKey === INATURALIST_DATASET_KEY ||
        observation.institutionCode === 'iNaturalist' ||
        observation.references?.includes('inaturalist.org') ||
        false
    );
}

/**
 * Get the iNaturalist observation ID from a GBIF record
 */
export function getINaturalistId(observation: GBIFObservation): string | null {
    if (!isFromINaturalist(observation)) {
        return null;
    }

    if (observation.catalogNumber) {
        return observation.catalogNumber;
    }

    if (observation.references) {
        const match = observation.references.match(/observations\/(\d+)/);
        if (match) {
            return match[1];
        }
    }

    if (observation.occurrenceID) {
        const match = observation.occurrenceID.match(/observations\/(\d+)/);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Get the iNaturalist URL for a GBIF observation
 */
export function getINaturalistUrl(observation: GBIFObservation): string | null {
    if (observation.references?.includes('inaturalist.org')) {
        return observation.references;
    }

    const inatId = getINaturalistId(observation);
    if (inatId) {
        return `https://www.inaturalist.org/observations/${inatId}`;
    }

    return null;
}

/**
 * Format GBIF date for display (YYYY-MM-DD)
 */
export function formatGBIFDate(obs: GBIFObservation): string {
    if (obs.eventDate) {
        return obs.eventDate.split('T')[0]; // Remove time component if present
    }

    if (obs.year) {
        const parts = [obs.year.toString()];
        if (obs.month) {
            parts.push(String(obs.month).padStart(2, '0'));
            if (obs.day) {
                parts.push(String(obs.day).padStart(2, '0'));
            }
        }
        return parts.join('-');
    }

    return 'Unknown';
}
