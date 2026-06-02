import type { TimeSlot } from "@/types";

export const DAYS_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_ORDER)[number];

export type HourGrid = boolean[][];

function isHourInSlots(day: string, hour: number, slots: TimeSlot[]): boolean {
  return slots.some(
    (s) => s.day_of_week === day && hour >= s.start_hour && hour < s.end_hour,
  );
}

/** Build a 7×24 grid from slot intervals (union per day). */
export function slotsToHourGrid(slots: TimeSlot[]): HourGrid {
  return DAYS_ORDER.map((day) =>
    Array.from({ length: 24 }, (_, hour) => isHourInSlots(day, hour, slots)),
  );
}

/** Convert a 7×24 grid into merged TimeSlot intervals. */
export function hourGridToSlots(grid: HourGrid): TimeSlot[] {
  const result: TimeSlot[] = [];

  DAYS_ORDER.forEach((day, dayIndex) => {
    const hours = grid[dayIndex] ?? [];
    let start: number | null = null;

    for (let hour = 0; hour < 24; hour++) {
      if (hours[hour]) {
        if (start === null) start = hour;
      } else if (start !== null) {
        result.push({ day_of_week: day, start_hour: start, end_hour: hour });
        start = null;
      }
    }

    if (start !== null) {
      result.push({ day_of_week: day, start_hour: start, end_hour: 24 });
    }
  });

  return result;
}

function dayIndex(day: string): number {
  const idx = DAYS_ORDER.indexOf(day as DayOfWeek);
  return idx >= 0 ? idx : 0;
}

/** Set one hour in the grid and return normalized slots. */
export function paintHour(
  slots: TimeSlot[],
  day: string,
  hour: number,
  available: boolean,
): TimeSlot[] {
  const grid = slotsToHourGrid(slots);
  const di = dayIndex(day);
  if (hour >= 0 && hour < 24) {
    grid[di][hour] = available;
  }
  return hourGridToSlots(grid);
}

/** Toggle one hour and return normalized slots. */
export function toggleHour(
  slots: TimeSlot[],
  day: string,
  hour: number,
): TimeSlot[] {
  const grid = slotsToHourGrid(slots);
  const di = dayIndex(day);
  if (hour >= 0 && hour < 24) {
    grid[di][hour] = !grid[di][hour];
  }
  return hourGridToSlots(grid);
}

export function isHourAvailable(
  day: string,
  hour: number,
  slots: TimeSlot[],
): boolean {
  return isHourInSlots(day, hour, slots);
}
