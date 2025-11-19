import { Coordinates, iNaturalistObservation } from '@/types';

/**
 * Fetch iNaturalist observations within a radius of given coordinates
 * @param coordinates - Latitude and longitude
 * @param radiusMiles - Search radius in miles
 * @param onProgress - Optional callback for pagination progress
 * @returns Promise with array of all observations
 */
export async function fetchObservations(
    coordinates: Coordinates,
    radiusMiles: number,
    onProgress?: (current: number, total: number) => void
): Promise<iNaturalistObservation[]> {
    try {
        const url = `/api/observations?lat=${coordinates.lat}&lon=${coordinates.lon}&radius=${radiusMiles}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch observations');
        }

        const data = await response.json();

        if (onProgress) {
            onProgress(data.observations.length, data.total_results);
        }

        return data.observations;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to fetch iNaturalist observations');
    }
}

/**
 * Get the best photo URL for an observation
 */
export function getObservationPhotoUrl(observation: iNaturalistObservation): string | null {
    if (!observation.photos || observation.photos.length === 0) {
        return null;
    }

    // Get the first photo and convert to medium size
    const photoUrl = observation.photos[0].url;
    return photoUrl.replace('square', 'medium');
}

/**
 * Get the display name for an observation (common name or scientific name)
 */
export function getObservationName(observation: iNaturalistObservation): string {
    if (observation.taxon?.preferred_common_name) {
        return observation.taxon.preferred_common_name;
    }
    if (observation.taxon?.name) {
        return observation.taxon.name;
    }
    return observation.species_guess || 'Unknown Species';
}
