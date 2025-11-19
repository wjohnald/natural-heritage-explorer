
const INATURALIST_API_BASE = 'https://api.inaturalist.org/v1';

async function fetchSampleObservation() {
    const params = new URLSearchParams({
        per_page: '1',
        order: 'desc',
        order_by: 'observed_on',
        lat: '40.7128', // Example: New York
        lng: '-74.0060',
        radius: '1'
    });

    const url = `${INATURALIST_API_BASE}/observations?${params.toString()}`;
    console.log(`Fetching from: ${url}`);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const obs = data.results[0];
            console.log('Observation keys:', Object.keys(obs));
            console.log('Location:', obs.location);
            console.log('Latitude:', obs.latitude);
            console.log('Longitude:', obs.longitude);
            console.log('GeoJSON:', JSON.stringify(obs.geojson, null, 2));
        } else {
            console.log('No observations found.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchSampleObservation();
