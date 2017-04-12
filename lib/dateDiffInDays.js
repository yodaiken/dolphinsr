// @flow

export default function dateDiffInDays(a: Date, b: Date): number {
  // adapted from http://stackoverflow.com/a/15289883/251162
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  // Disstate the time and time-zone information.
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return (utc2 - utc1) / MS_PER_DAY;
}
