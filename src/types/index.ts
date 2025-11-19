export interface Coordinates {
  lat: number;
  lon: number;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  displayName: string;
}

export interface iNaturalistObservation {
  id: number;
  species_guess: string;
  taxon?: {
    id: number;
    name: string;
    preferred_common_name?: string;
    rank: string;
    iconic_taxon_name?: string;
  };
  observed_on_string: string;
  place_guess?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  user?: {
    id: number;
    login: string;
    name?: string;
  };
  photos?: Array<{
    id: number;
    url: string;
    attribution?: string;
  }>;
  quality_grade?: string;
  uri?: string;
}

export interface iNaturalistResponse {
  total_results: number;
  page: number;
  per_page: number;
  results: iNaturalistObservation[];
}
