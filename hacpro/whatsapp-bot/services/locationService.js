import axios from "axios";

/**
 * Convert city and state to latitude and longitude coordinates.
 * Uses OpenStreetMap Nominatim API (free, no API key required).
 * 
 * @param {string} city - City or village name
 * @param {string} state - State name
 * @returns {Promise<{lat: number, lon: number} | null>}
 */
export async function getCoordinates(city, state) {
  try {
    if (!city || !state) {
      console.warn("⚠️ City or state missing for geocoding");
      return null;
    }

    // Construct search query
    const query = `${city}, ${state}, India`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    
    console.log(`📍 Geocoding: ${query}`);
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'KisaanSuraksha-Bot/1.0' // Required by Nominatim
      },
      timeout: 5000
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      console.log(`✅ Found coordinates: ${lat}, ${lon} for ${query}`);
      return { lat, lon };
    }

    console.warn(`⚠️ No coordinates found for: ${query}`);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error?.message || error);
    return null;
  }
}

/**
 * Get default coordinates for a state (fallback if city lookup fails)
 * Common Indian agricultural regions
 */
export function getDefaultStateCoordinates(state) {
  const stateCoords = {
    "Andhra Pradesh": { lat: 15.9129, lon: 79.7400 },
    "Telangana": { lat: 18.1124, lon: 79.0193 },
    "Tamil Nadu": { lat: 11.1271, lon: 78.6569 },
    "Karnataka": { lat: 15.3173, lon: 75.7139 },
    "Maharashtra": { lat: 19.7515, lon: 75.7139 },
    "Gujarat": { lat: 23.0225, lon: 72.5714 },
    "Rajasthan": { lat: 27.0238, lon: 74.2179 },
    "Punjab": { lat: 31.1471, lon: 75.3412 },
    "Haryana": { lat: 29.0588, lon: 76.0856 },
    "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
    "Bihar": { lat: 25.0961, lon: 85.3131 },
    "West Bengal": { lat: 22.9868, lon: 87.8550 },
    "Odisha": { lat: 20.9517, lon: 85.0985 },
    "Madhya Pradesh": { lat: 22.9734, lon: 78.6569 },
    "Assam": { lat: 26.2006, lon: 92.9376 },
    "Kerala": { lat: 10.8505, lon: 76.2711 },
  };

  // Try to match state name (case-insensitive, partial match)
  const stateLower = (state || "").toLowerCase();
  for (const [stateName, coords] of Object.entries(stateCoords)) {
    if (stateName.toLowerCase().includes(stateLower) || stateLower.includes(stateName.toLowerCase())) {
      console.log(`📍 Using default coordinates for state: ${stateName}`);
      return coords;
    }
  }

  // Default to central India if no match
  console.warn(`⚠️ No default coordinates for state: ${state}, using central India`);
  return { lat: 20.5937, lon: 78.9629 }; // Central India
}