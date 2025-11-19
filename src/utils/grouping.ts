import { iNaturalistObservation, GroupedObservation, Coordinates } from '@/types';
import { calculateDistance } from '@/utils/distance';
import { getObservationName } from '@/services/inaturalist';

export function groupObservations(
    observations: iNaturalistObservation[],
    searchCoordinates?: Coordinates
): GroupedObservation[] {
    const groups: { [key: string]: GroupedObservation } = {};

    observations.forEach((obs) => {
        const name = getObservationName(obs);
        // Use scientific name as key if available, otherwise fallback to display name
        const key = obs.taxon?.name || name;

        if (!groups[key]) {
            groups[key] = {
                scientificName: obs.taxon?.name || 'Unknown',
                commonName: obs.taxon?.preferred_common_name || name,
                observations: [],
                totalCount: 0,
                closestDistance: Infinity,
                mostRecentDate: '',
            };
        }

        const group = groups[key];
        group.observations.push(obs);
        group.totalCount++;

        // Update closest distance
        if (searchCoordinates) {
            let lat: number | undefined = obs.latitude;
            let lon: number | undefined = obs.longitude;

            if (!lat || !lon) {
                if (obs.geojson?.coordinates) {
                    lon = obs.geojson.coordinates[0];
                    lat = obs.geojson.coordinates[1];
                } else if (obs.location) {
                    const parts = obs.location.split(',');
                    if (parts.length === 2) {
                        lat = parseFloat(parts[0]);
                        lon = parseFloat(parts[1]);
                    }
                }
            }

            if (lat !== undefined && lon !== undefined) {
                const distance = calculateDistance(
                    searchCoordinates.lat,
                    searchCoordinates.lon,
                    lat,
                    lon
                );
                if (distance < group.closestDistance) {
                    group.closestDistance = distance;
                }
            }
        }

        // Update most recent date
        // Assuming observed_on_string is comparable or we use observed_on date object if available
        // For simplicity, let's rely on the API sorting (descending) or simple string comparison if ISO
        // But better to use the actual date object if we had it. 
        // The API returns `observed_on` (YYYY-MM-DD) which is string comparable.
        // Let's check if we have `observed_on` in the type. We don't explicitly have it in the interface but the API returns it.
        // Let's use `observed_on_string` for display, but we might want to sort by it.
        // Since we're iterating, we can just take the one that looks "latest".
        // Actually, the API usually returns sorted by date desc if we asked for it.
        // If we assume the list is sorted or random, we should probably parse the date.
        // Let's just keep the first one we see if we assume sorted, OR compare.
        // Let's compare.
        if (!group.mostRecentDate || (obs.observed_on_string && obs.observed_on_string > group.mostRecentDate)) {
            group.mostRecentDate = obs.observed_on_string;
        }
    });

    // Convert map to array and sort by closest distance (or count?)
    // Let's sort by closest distance ascending
    return Object.values(groups).sort((a, b) => {
        if (a.closestDistance !== b.closestDistance) {
            return a.closestDistance - b.closestDistance;
        }
        return b.totalCount - a.totalCount;
    });
}
