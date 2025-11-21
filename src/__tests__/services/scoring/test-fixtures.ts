/**
 * Test addresses for integration testing
 * These addresses will be used to fetch real parcel geometry from NYS Tax Parcels service
 */

// 789 Lapla Road, Accord, NY
// Note: Has Class C stream (not Class A), should return false for DEC Class A Streams criterion
export const ADDRESS_789_LAPLA_ROAD = '789 Lapla Road, Marbletown, NY';

// 281 DeWitt Road, Olivebridge, NY  
// Note: In a FEMA Special Flood Hazard Area (SFHA)
// Requires Google Maps API key for accurate geocoding (OpenStreetMap returns city center)
export const ADDRESS_281_DEWITT_ROAD = '281 DeWitt Road, Olivebridge, NY';

// 15 Ronsen Rd / Rt 28 B, Olive, NY (Tax records: 4115-4125 Rt 28)
// Note: Has Class A streams (segment 862-555), should return true for DEC Class A Streams criterion
export const ADDRESS_15_RONSEN_ROAD = '15 Ronsen Road, Olive, NY';
