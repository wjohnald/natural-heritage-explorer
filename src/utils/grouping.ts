import { iNaturalistObservation, GroupedObservation, Coordinates } from '@/types';
import { calculateDistance } from '@/utils/distance';
import { getObservationName } from '@/services/inaturalist';
import { formatObservationDate } from '@/utils/dateFormat';

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

        // Update most recent date - format as YYYY-MM-DD
        const dateStr = formatObservationDate(obs);
        if (dateStr && (!group.mostRecentDate || dateStr > group.mostRecentDate)) {
            group.mostRecentDate = dateStr;
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
