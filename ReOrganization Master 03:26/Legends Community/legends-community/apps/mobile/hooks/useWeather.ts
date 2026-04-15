import { useQuery } from '@tanstack/react-query';

const WINTER_SPRINGS_LAT = 28.6986;
const WINTER_SPRINGS_LON = -81.3084;

export interface WeatherData {
  current: {
    temp: number;
    condition: string;
    icon: string;
    high: number;
    low: number;
  };
  forecast: {
    day: string;
    icon: string;
    high: number;
    low: number;
  }[];
  location: string;
}

const CONDITION_ICONS: Record<string, string> = {
  Clear: '☀️',
  Clouds: '⛅',
  Rain: '🌧️',
  Drizzle: '🌧️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌤️',
};

function getWeatherIcon(condition: string): string {
  return CONDITION_ICONS[condition] || '🌤️';
}

function getDayName(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

async function fetchWeather(): Promise<WeatherData> {
  const apiKey = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    return getMockWeather();
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${WINTER_SPRINGS_LAT}&lon=${WINTER_SPRINGS_LON}&units=imperial&appid=${apiKey}`,
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${WINTER_SPRINGS_LAT}&lon=${WINTER_SPRINGS_LON}&units=imperial&appid=${apiKey}`,
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return getMockWeather();
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    const dailyForecasts = forecast.list
      .filter((_: unknown, i: number) => i % 8 === 0)
      .slice(0, 3)
      .map((item: { main: { temp_max: number; temp_min: number }; weather: { main: string }[] }, idx: number) => ({
        day: getDayName(idx + 1),
        icon: getWeatherIcon(item.weather[0]?.main ?? 'Clear'),
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
      }));

    return {
      current: {
        temp: Math.round(current.main.temp),
        condition: current.weather[0]?.main ?? 'Clear',
        icon: getWeatherIcon(current.weather[0]?.main ?? 'Clear'),
        high: Math.round(current.main.temp_max),
        low: Math.round(current.main.temp_min),
      },
      forecast: dailyForecasts,
      location: 'Winter Springs, FL',
    };
  } catch {
    return getMockWeather();
  }
}

function getMockWeather(): WeatherData {
  return {
    current: {
      temp: 82,
      condition: 'Partly Cloudy',
      icon: '🌤️',
      high: 87,
      low: 72,
    },
    forecast: [
      { day: getDayName(1), icon: '☀️', high: 89, low: 73 },
      { day: getDayName(2), icon: '🌧️', high: 84, low: 71 },
      { day: getDayName(3), icon: '⛅', high: 86, low: 72 },
    ],
    location: 'Winter Springs, FL',
  };
}

export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: fetchWeather,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}
