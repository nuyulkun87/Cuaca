import axios from 'axios';

// Open-Meteo doesn't require an API key!
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface WeatherData {
  city: string;
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  feelsLike: number;
  dt: number;
}

export interface ForecastData {
  dt: number;
  temp: number;
  description: string;
  icon: string;
}

// Map WMO codes to descriptions and icons
const weatherCodes: Record<number, { desc: string; icon: string }> = {
  0: { desc: 'Langit Cerah', icon: '01d' },
  1: { desc: 'Utamanya Cerah', icon: '02d' },
  2: { desc: 'Berawan Sebagian', icon: '03d' },
  3: { desc: 'Mendung', icon: '04d' },
  45: { desc: 'Kabut', icon: '50d' },
  48: { desc: 'Kabut Rime', icon: '50d' },
  51: { desc: 'Gerimis Ringan', icon: '09d' },
  53: { desc: 'Gerimis Sedang', icon: '09d' },
  55: { desc: 'Gerimis Lebat', icon: '09d' },
  61: { desc: 'Hujan Ringan', icon: '10d' },
  63: { desc: 'Hujan Sedang', icon: '10d' },
  65: { desc: 'Hujan Lebat', icon: '10d' },
  71: { desc: 'Salju Ringan', icon: '13d' },
  73: { desc: 'Salju Sedang', icon: '13d' },
  75: { desc: 'Salju Lebat', icon: '13d' },
  80: { desc: 'Hujan Shower Ringan', icon: '09d' },
  81: { desc: 'Hujan Shower Sedang', icon: '09d' },
  82: { desc: 'Hujan Shower Kasar', icon: '09d' },
  95: { desc: 'Badai Petir', icon: '11d' },
};

const getWeatherInfo = (code: number) => {
  return weatherCodes[code] || { desc: 'Berawan', icon: '03d' };
};

export const fetchWeatherByCoords = async (lat: number, lon: number, cityName?: string) => {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
    },
  });

  const current = response.data.current;
  const info = getWeatherInfo(current.weather_code);

  return {
    city: cityName || `Lokasi Anda (${lat.toFixed(2)}, ${lon.toFixed(2)})`,
    temp: Math.round(current.temperature_2m),
    description: info.desc,
    icon: info.icon,
    humidity: current.relative_humidity_2m,
    windSpeed: Math.round(current.wind_speed_10m),
    pressure: Math.round(current.surface_pressure),
    feelsLike: Math.round(current.apparent_temperature),
    dt: Math.floor(Date.now() / 1000),
  } as WeatherData;
};

export const fetchForecastByCoords = async (lat: number, lon: number) => {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude: lat,
      longitude: lon,
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
    },
  });

  const daily = response.data.daily;
  const forecast: ForecastData[] = [];

  for (let i = 0; i < 5; i++) {
    const info = getWeatherInfo(daily.weather_code[i]);
    forecast.push({
      dt: Math.floor(new Date(daily.time[i]).getTime() / 1000),
      temp: Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2),
      description: info.desc,
      icon: info.icon,
    });
  }

  return forecast;
};

export const fetchWeatherByCity = async (city: string) => {
  // First, get coordinates for the city
  const geoResponse = await axios.get(GEO_URL, {
    params: {
      name: city,
      count: 1,
      language: 'id',
      format: 'json',
    },
  });

  const results = geoResponse.data.results;
  if (!results || results.length === 0) {
    throw new Error('Kota tidak ditemukan.');
  }

  const { latitude, longitude, name, country } = results[0];
  return fetchWeatherByCoords(latitude, longitude, `${name}, ${country}`);
};

export const fetchForecastByCity = async (city: string) => {
  const geoResponse = await axios.get(GEO_URL, {
    params: {
      name: city,
      count: 1,
      language: 'id',
      format: 'json',
    },
  });

  const results = geoResponse.data.results;
  if (!results || results.length === 0) {
    throw new Error('Kota tidak ditemukan.');
  }

  const { latitude, longitude } = results[0];
  return fetchForecastByCoords(latitude, longitude);
};
