import { GeocodingResult } from '@/types';

/**
 * Geocode an address using the server-side API route
 * @param address - The street address to geocode
 * @returns Promise with coordinates and display name
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!address || address.trim().length === 0) {
        throw new Error('Address cannot be empty');
    }

    const encodedAddress = encodeURIComponent(address.trim());
    const url = `/api/geocode?address=${encodedAddress}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Geocoding failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to geocode address. Please try again.');
    }
}
