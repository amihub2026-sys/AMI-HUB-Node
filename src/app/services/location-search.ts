import { Injectable } from '@angular/core';

export interface AppLocationResult {
  placeId: string;
  displayName: string;
  lat: number;
  lon: number;
  name: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
}

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class LocationSearchService {
  private autocompleteService: any;
  private placesService: any;
  private geocoder: any;


private googleReadyPromise: Promise<void> | null = null;

private async ensureGoogleReady(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps requires a browser');
  }

  if (!this.googleReadyPromise) {
    this.googleReadyPromise = this.initializeGoogle().catch((error) => {
      this.googleReadyPromise = null;
      throw error;
    });
  }

  await this.googleReadyPromise;
}

private async initializeGoogle(): Promise<void> {
  // Wait up to 10 seconds for the Google Maps script.
  const deadline = Date.now() + 10000;

  while (!(window as any).google?.maps?.importLibrary) {
    if (Date.now() >= deadline) {
      throw new Error('Google Maps script failed to load');
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 100));
  }

  const maps = (window as any).google.maps;

  const [places, geocoding] = await Promise.all([
    maps.importLibrary('places'),
    maps.importLibrary('geocoding')
  ]);

  this.autocompleteService = new places.AutocompleteService();
  this.geocoder = new geocoding.Geocoder();

  this.placesService = new places.PlacesService(
    document.createElement('div')
  );
}

 async searchLocations(query: string): Promise<AppLocationResult[]> {
const input = query.trim().replace(
  /^([A-Z0-9]+\+[A-Z0-9]+)\s*,\s*\1\b/i,
  '$1'
);
  if (input.length < 3) return [];

  let timeout: ReturnType<typeof setTimeout> | undefined;

  const lookup = async (): Promise<AppLocationResult[]> => {
    await this.ensureGoogleReady();

    const predictions = await new Promise<any[]>((resolve, reject) => {
      this.autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: { country: 'in' }
        },
        (results: any[] | null, status: string) => {
          if (status === 'ZERO_RESULTS') {
            resolve([]);
          } else if (status === 'OK') {
            resolve(results ?? []);
          } else {
            reject(new Error(`Google autocomplete failed: ${status}`));
          }
        }
      );
    });

    const results = await Promise.allSettled(
      predictions.slice(0, 5).map(prediction =>
        this.getPlaceDetails(prediction.place_id, prediction.description)
      )
    );
const matches = results.flatMap(result =>
  result.status === 'fulfilled' && result.value ? [result.value] : []
);

return matches.length ? matches : this.geocodeAddress(input);
  };

  try {
    return await Promise.race([
      lookup(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error('Location search timed out'));
        }, 12000);
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

  private async getPlaceDetails(
    placeId: string,
    fallbackText: string
  ): Promise<AppLocationResult | null> {
 await this.ensureGoogleReady();

    return new Promise((resolve) => {
      this.placesService.getDetails(
        {
          placeId,
          fields: [
            'place_id',
            'formatted_address',
            'geometry',
            'address_components',
            'name'
          ]
        },
        (place: any, status: string) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place?.geometry?.location
          ) {
            resolve(null);
            return;
          }

          const parsed = this.parseAddressComponents(place.address_components || []);

          resolve({
            placeId: place.place_id || placeId,
            displayName: place.formatted_address || fallbackText,
            lat: place.geometry.location.lat(),
            lon: place.geometry.location.lng(),
            name: place.name || fallbackText,
            city: parsed.city,
            state: parsed.state,
            country: parsed.country,
            postalCode: parsed.postalCode
          });
        }
      );
    });
  }
  private async geocodeAddress(address: string): Promise<AppLocationResult[]> {
  const { results } = await this.geocoder.geocode({
    address,
    componentRestrictions: { country: 'IN' }
  }).catch((error: unknown) => {
    if (error === 'ZERO_RESULTS' || (error as { code?: string })?.code === 'ZERO_RESULTS') {
      return { results: [] };
    }
    throw error;
  });

  const match = results[0];
  const point = match?.geometry?.location;

  if (!point) return [];

  const displayName = match.formatted_address || address;
  const parsed = this.parseAddressComponents(match.address_components || []);

  return [{
    placeId: match.place_id || '',
    displayName,
    lat: point.lat(),
    lon: point.lng(),
    name: displayName,
    ...parsed
  }];
}

  async reverseGeocode(
    lat: number,
    lon: number
  ): Promise<AppLocationResult | null> {
 await this.ensureGoogleReady();

    return new Promise((resolve) => {
      this.geocoder.geocode(
        { location: { lat, lng: lon } },
        (results: any[] | null, status: string) => {
          if (status !== 'OK' || !results?.length) {
              console.error('Google reverse geocoding failed:', status);
            resolve(null);
            return;
          }

          const preferred =
            results.find((r) =>
              (r.types || []).some((t: string) =>
                ['premise', 'subpremise', 'establishment', 'point_of_interest'].includes(t)
              )
            ) ||
            results.find((r) =>
              (r.types || []).includes('street_address')
            ) ||
            results[0];

          const parsed = this.parseAddressComponents(preferred.address_components || []);

          resolve({
            placeId: preferred.place_id || '',
            displayName: preferred.formatted_address || `Lat ${lat}, Lon ${lon}`,
            lat,
            lon,
            name: preferred.formatted_address || 'Selected location',
            city: parsed.city,
            state: parsed.state,
            country: parsed.country,
            postalCode: parsed.postalCode
          });
        }
      );
    });
  }

  private parseAddressComponents(components: any[]) {
    let city = '';
    let state = '';
    let country = '';
    let postalCode = '';

    for (const c of components) {
      const types = c.types || [];

      if (types.includes('locality')) {
        city = c.long_name;
      }

      if (!city && types.includes('administrative_area_level_2')) {
        city = c.long_name;
      }

      if (types.includes('administrative_area_level_1')) {
        state = c.long_name;
      }

      if (types.includes('country')) {
        country = c.long_name;
      }

      if (types.includes('postal_code')) {
        postalCode = c.long_name;
      }
    }

    return { city, state, country, postalCode };
  }
}