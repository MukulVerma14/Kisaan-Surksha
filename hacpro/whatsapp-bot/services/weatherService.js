import axios from "axios";

/**
 * Fetch agro-relevant weather data using Visual Crossing Timeline API.
 * @param {number|string} lat
 * @param {number|string} lon
 * @returns {Promise<{
 *   temp: number | undefined,
 *   rain_chance: number | undefined,
 *   description: string | undefined,
 *   soil_moisture: number | undefined,
 *   soil_temp: number | undefined
 * } | null>}
 */
export async function getAgroData(lat, lon) {
  try {
    if (!process.env.VISUAL_CROSSING_KEY) {
      throw new Error("VISUAL_CROSSING_KEY is not set");
    }

    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}?unitGroup=metric&key=${process.env.VISUAL_CROSSING_KEY}&include=current&elements=temp,humidity,precip,soilmoisture,soiltemp,conditions`;

    const { data } = await axios.get(url);
    const current = data?.currentConditions || {};

    return {
      temp: current.temp,
      rain_chance: current.precip,
      description: current.conditions,
      soil_moisture: current.soilmoisture,
      soil_temp: current.soiltemp,
    };
  } catch (error) {
    console.error("Visual Crossing agro data error:", error?.message || error);
    return null;
  }
}