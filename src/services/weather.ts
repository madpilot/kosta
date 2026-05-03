import { logger } from '../utils/logger';

type DayForecast = {
  date: string;
  description: string;
  minTemp: number;
  maxTemp: number;
  rainMm: number;
};

type ForecastItem = {
  dt_txt: string;
  main: { temp_min: number; temp_max: number };
  weather: { description: string }[];
  rain?: { '3h'?: number };
};

const groupByDay = (items: ForecastItem[]): Record<string, ForecastItem[]> => {
  const days: Record<string, ForecastItem[]> = {};
  for (const item of items) {
    const day = item.dt_txt.split(' ')[0];
    if (!days[day]) days[day] = [];
    days[day].push(item);
  }
  return days;
};

const summariseDay = (date: string, items: ForecastItem[]): DayForecast => {
  const temps = items.flatMap((i) => [i.main.temp_min, i.main.temp_max]);
  const rain = items.reduce((sum, i) => sum + (i.rain?.['3h'] ?? 0), 0);
  const description = items[Math.floor(items.length / 2)]?.weather[0]?.description ?? '';
  return {
    date,
    description,
    minTemp: Math.round(Math.min(...temps)),
    maxTemp: Math.round(Math.max(...temps)),
    rainMm: Math.round(rain * 10) / 10,
  };
};

export const getWeatherForecast = async (
  location: string,
  apiKey: string,
): Promise<string | null> => {
  if (!location || !apiKey) return null;

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric&cnt=40`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = (await res.json()) as { list: ForecastItem[] };
    const days = groupByDay(data.list);

    const forecasts = Object.entries(days)
      .slice(0, 7)
      .map(([date, items]) => summariseDay(date, items));

    return forecasts
      .map(
        (d) =>
          `${d.date}: ${d.description}, ${d.minTemp}–${d.maxTemp}°C${d.rainMm > 0 ? `, ${d.rainMm}mm rain` : ''}`,
      )
      .join('\n');
  } catch (error) {
    logger.warn('Weather forecast lookup failed', { location, error });
    return null;
  }
};
