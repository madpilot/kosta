type Hemisphere = 'northern' | 'southern';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';

const northernSeasons: Season[] = [
  'winter', // Jan
  'winter', // Feb
  'spring', // Mar
  'spring', // Apr
  'spring', // May
  'summer', // Jun
  'summer', // Jul
  'summer', // Aug
  'autumn', // Sep
  'autumn', // Oct
  'autumn', // Nov
  'winter', // Dec
];

export const getCurrentSeason = (hemisphere: Hemisphere): Season => {
  const month = new Date().getMonth(); // 0-indexed
  const northern = northernSeasons[month];
  if (hemisphere === 'northern') return northern;

  const opposite: Record<Season, Season> = {
    spring: 'autumn',
    summer: 'winter',
    autumn: 'spring',
    winter: 'summer',
  };
  return opposite[northern];
};
