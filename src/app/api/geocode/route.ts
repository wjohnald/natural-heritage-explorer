import { NextRequest, NextResponse } from 'next/server';

interface AddressComponents {
    street?: string;
    city?: string;
    state?: string;
    postalcode?: string;
}

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
}

interface GoogleMapsResult {
    results: Array<{
        formatted_address: string;
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    }>;
    status: string;
}

/**
 * Try geocoding with Google Maps Geocoding API
 */
async function tryGoogleMapsGeocode(address: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
        console.log('Google Maps API key not configured, skipping Google geocoding');
        return null;
    }

    try {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

        const response = await fetch(url);
        
        if (!response.ok) {
            console.error('Google Maps API request failed:', response.statusText);
            return null;
        }

        const data: GoogleMapsResult = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const result = data.results[0];
            return {
                lat: result.geometry.location.lat,
                lon: result.geometry.location.lng,
                displayName: result.formatted_address,
            };
        } else {
            // Log detailed error information
            console.error('Google Maps geocoding error - Status:', data.status);
            
            if (data.status === 'REQUEST_DENIED') {
                console.error('REQUEST_DENIED: This usually means:');
                console.error('1. The Geocoding API is not enabled in Google Cloud Console');
                console.error('2. Billing is not set up (required even for free tier)');
                console.error('3. API key has restrictions blocking this request');
                console.error('4. Invalid API key');
                console.error('Visit: https://console.cloud.google.com/google/maps-apis/');
            } else if (data.status === 'OVER_QUERY_LIMIT') {
                console.error('OVER_QUERY_LIMIT: Rate limit exceeded or billing issue');
            } else if (data.status === 'ZERO_RESULTS') {
                console.error('ZERO_RESULTS: Address not found by Google Maps');
            }
            
            return null;
        }
    } catch (error) {
        console.error('Google Maps geocoding error:', error);
        return null;
    }
}

/**
 * Parse address into structured components
 */
function parseAddress(address: string): AddressComponents | null {
    // Try to parse common address formats
    const parts = address.split(',').map(p => p.trim());
    
    if (parts.length >= 2) {
        const result: AddressComponents = {};
        
        // First part is usually street
        result.street = parts[0];
        
        // Look for state patterns (2-letter codes or full names)
        const statePattern = /\b([A-Z]{2})\b|\b(New York|NY)\b/i;
        const stateMatch = address.match(statePattern);
        if (stateMatch) {
            result.state = stateMatch[0];
        }
        
        // City is typically the middle part
        if (parts.length >= 2) {
            result.city = parts[1].replace(/\s*[A-Z]{2}\s*/, '').replace(/\s*\d{5}\s*/, '').trim();
        }
        
        // Look for zip code
        const zipMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
        if (zipMatch) {
            result.postalcode = zipMatch[0];
        }
        
        return result;
    }
    
    return null;
}

/**
 * Try geocoding with Nominatim using different strategies
 */
async function tryNominatimGeocode(address: string): Promise<NominatimResult | null> {
    const headers = {
        'User-Agent': 'Biodiversity Explorer App (github.com/your-repo)',
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Strategy 1: Structured search if we can parse the address
    const parsed = parseAddress(address);
    if (parsed && parsed.street && parsed.city) {
        const params = new URLSearchParams({
            format: 'json',
            addressdetails: '1',
            limit: '5',
            ...(parsed.street && { street: parsed.street }),
            ...(parsed.city && { city: parsed.city }),
            ...(parsed.state && { state: parsed.state }),
            ...(parsed.postalcode && { postalcode: parsed.postalcode }),
        });
        
        const url1 = `https://nominatim.openstreetmap.org/search?${params.toString()}`;

        try {
            const response1 = await fetch(url1, { headers });
            if (response1.ok) {
                const data1 = await response1.json();
                if (data1 && data1.length > 0) {
                    return data1[0];
                }
            }
        } catch (err) {
            console.error('Nominatim strategy 1 (structured) failed:', err);
        }
        
        await delay(1000); // Rate limiting
    }

    // Strategy 2: Standard search with increased limit and US focus
    const encodedAddress = encodeURIComponent(address);
    const url2 = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=10&countrycodes=us&addressdetails=1`;

    try {
        const response2 = await fetch(url2, { headers });
        if (response2.ok) {
            const data2 = await response2.json();
            if (data2 && data2.length > 0) {
                return data2[0];
            }
        }
    } catch (err) {
        console.error('Nominatim strategy 2 failed:', err);
    }

    await delay(1000); // Rate limiting

    // Strategy 3: Try without country restriction
    const url3 = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=10&addressdetails=1`;

    try {
        const response3 = await fetch(url3, { headers });
        if (response3.ok) {
            const data3 = await response3.json();
            if (data3 && data3.length > 0) {
                return data3[0];
            }
        }
    } catch (err) {
        console.error('Nominatim strategy 3 failed:', err);
    }

    await delay(1000); // Rate limiting

    // Strategy 4: Try with just city/town and state if street address fails
    if (parsed && parsed.city && parsed.state) {
        const simpleQuery = `${parsed.city}, ${parsed.state}`;
        const encodedSimple = encodeURIComponent(simpleQuery);
        const url4 = `https://nominatim.openstreetmap.org/search?q=${encodedSimple}&format=json&limit=5&addressdetails=1`;

        try {
            const response4 = await fetch(url4, { headers });
            if (response4.ok) {
                const data4 = await response4.json();
                if (data4 && data4.length > 0) {
                    console.log('Note: Using city center as exact address was not found');
                    return data4[0];
                }
            }
        } catch (err) {
            console.error('Nominatim strategy 4 (city fallback) failed:', err);
        }
    }

    return null;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json(
            { error: 'Address parameter is required' },
            { status: 400 }
        );
    }

    try {
        // Check if input is coordinates (lat, lon format)
        const coordPattern = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
        const coordMatch = address.match(coordPattern);
        
        if (coordMatch) {
            const lat = parseFloat(coordMatch[1]);
            const lon = parseFloat(coordMatch[2]);
            
            // Validate coordinate ranges
            if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                return NextResponse.json({
                    coordinates: { lat, lon },
                    displayName: `Coordinates: ${lat.toFixed(6)}, ${lon.toFixed(6)}`,
                });
            }
        }

        // Try Google Maps first (more accurate and comprehensive)
        const googleResult = await tryGoogleMapsGeocode(address);
        
        if (googleResult) {
            console.log('Successfully geocoded with Google Maps');
            return NextResponse.json({
                coordinates: {
                    lat: googleResult.lat,
                    lon: googleResult.lon,
                },
                displayName: googleResult.displayName,
                provider: 'google',
            });
        }

        // Fall back to OpenStreetMap/Nominatim
        console.log('Falling back to OpenStreetMap geocoding');
        const nominatimResult = await tryNominatimGeocode(address);

        if (!nominatimResult) {
            return NextResponse.json(
                { 
                    error: 'Address not found. Try:\n• Adding city, state (e.g., "123 Main St, Albany, NY")\n• Using coordinates (e.g., "44.2176, -73.4301")\n• Using a nearby town or landmark',
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            coordinates: {
                lat: parseFloat(nominatimResult.lat),
                lon: parseFloat(nominatimResult.lon),
            },
            displayName: nominatimResult.display_name,
            provider: 'openstreetmap',
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json(
            { error: 'Failed to geocode address. Please try again.' },
            { status: 500 }
        );
    }
}
