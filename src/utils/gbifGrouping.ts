import { GBIFObservation, GBIFGroupedObservation, Coordinates } from '@/types';
import { calculateDistance } from './distance';

export function groupGBIFObservations(
    observations: GBIFObservation[],
    searchCoordinates?: Coordinates
): GBIFGroupedObservation[] {
    const groups = new Map<string, GBIFGroupedObservation>();

    for (const obs of observations) {
        const scientificName = obs.scientificName || 'Unknown Species';
        const commonName = obs.vernacularName || scientificName;

        if (!groups.has(scientificName)) {
            groups.set(scientificName, {
                scientificName,
                commonName,
                observations: [],
                totalCount: 0,
                closestDistance: Infinity,
                mostRecentDate: '',
            });
        }

        const group = groups.get(scientificName)!;
        group.observations.push(obs);
        group.totalCount += 1;

        // Calculate distance if search coordinates available
        if (searchCoordinates && obs.decimalLatitude && obs.decimalLongitude) {
            const distance = calculateDistance(
                searchCoordinates.lat,
                searchCoordinates.lon,
                obs.decimalLatitude,
                obs.decimalLongitude
            );
            if (distance < group.closestDistance) {
                group.closestDistance = distance;
            }
        }

        // Track most recent date
        if (obs.eventDate) {
            const obsDate = obs.eventDate;
            if (!group.mostRecentDate || obsDate > group.mostRecentDate) {
                group.mostRecentDate = obsDate;
            }
        } else if (obs.year) {
            const yearStr = `${obs.year}-${String(obs.month || 1).padStart(2, '0')}-${String(obs.day || 1).padStart(2, '0')}`;
            if (!group.mostRecentDate || yearStr > group.mostRecentDate) {
                group.mostRecentDate = yearStr;
            }
        }
    }

    return Array.from(groups.values());
}

