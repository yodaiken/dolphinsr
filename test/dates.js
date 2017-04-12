// @flow

export function addToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + Math.ceil(days));
  return result;
}

export const today = new Date(1970, 1, 1);

export const todayAt3AM = new Date(1970, 1, 1);
todayAt3AM.setHours(3, 0, 0);

export const laterToday = new Date(1970, 1, 1);
laterToday.setHours(10);

export const laterTmrw = addToDate(laterToday, 1);

export const laterInTwoDays = addToDate(laterToday, 2);

export const laterInFourDays = addToDate(laterToday, 4);
