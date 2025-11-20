# Environment Variables Setup

## Google Maps API Key (Optional but Recommended)

For the best geocoding experience, configure a Google Maps API key. The app will work without it by falling back to OpenStreetMap, but some addresses may not be found.

### Getting a Google Maps API Key

1. **Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis/)**

2. **Create a new project or select an existing one**
   - Click the project dropdown at the top
   - Click "New Project" if needed

3. **Enable Billing** (REQUIRED - even for free tier)
   - Go to [Billing](https://console.cloud.google.com/billing)
   - Create a billing account (you get $200 free credit per month)
   - Link it to your project
   - Note: Geocoding is free for up to 40,000 requests/month

4. **Enable the Geocoding API**
   - Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
   - Search for "Geocoding API"
   - Click on it and click "Enable"
   - **This is the most commonly missed step!**

5. **Create an API Key**
   - Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
   - Click "Create Credentials" → "API Key"
   - Copy your API key

6. **(Optional but recommended) Restrict your API key**:
   - Click on your API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Select only "Geocoding API"
   - For development, leave "Application restrictions" as "None"
   - For production, you can restrict by HTTP referrer or IP address

### Troubleshooting REQUEST_DENIED Error

If you get a `REQUEST_DENIED` error:

1. ✅ **Verify Geocoding API is enabled**
   - Go to [APIs & Services > Enabled APIs](https://console.cloud.google.com/apis/dashboard)
   - "Geocoding API" should be listed
   - If not, go to the Library and enable it

2. ✅ **Verify Billing is set up**
   - Go to [Billing](https://console.cloud.google.com/billing)
   - Your project should have a billing account linked
   - Even though it's free tier, billing MUST be enabled

3. ✅ **Check API key restrictions**
   - Go to [Credentials](https://console.cloud.google.com/apis/credentials)
   - Click on your API key
   - Make sure "Application restrictions" is set to "None" for development
   - Make sure "API restrictions" either has no restrictions OR includes "Geocoding API"

4. ✅ **Wait a few minutes**
   - After enabling the API, it can take 1-5 minutes to propagate

5. ✅ **Restart your development server**
   - After adding the API key to `.env.local`, restart `npm run dev`

### Configuration

Create a `.env.local` file in the root directory:

```bash
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Without API Key

If you don't have a Google Maps API key:
- The app will automatically fall back to OpenStreetMap geocoding
- You can also enter coordinates directly in the format: `latitude, longitude` (e.g., `44.2176, -73.4301`)
- Get coordinates from Google Maps by right-clicking on a location and clicking the coordinates

## Deployment

When deploying to Vercel or other platforms, add the `GOOGLE_MAPS_API_KEY` environment variable in your deployment settings.

