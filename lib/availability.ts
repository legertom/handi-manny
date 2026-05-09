import { addDays, addMinutes, format, isBefore, parseISO, startOfDay } from "date-fns";
import { listBookings, type Booking } from "./store";

const HOURS: Record<number, { open: number; close: number }> = {
  0: { open: 10, close: 17 },
  1: { open: 8, close: 19 },
  2: { open: 8, close: 19 },
  3: { open: 8, close: 19 },
  4: { open: 8, close: 19 },
  5: { open: 8, close: 19 },
  6: { open: 8, close: 19 },
};

export type Slot = {
  start: string;
  end: string;
  label: string;
};

export type DayAvailability = {
  date: string;
  weekday: string;
  day: string;
  slots: Slot[];
};

export function getDayAvailability(
  dateISO: string,
  durationMinutes: number,
  bookings: Booking[],
  now: Date = new Date(),
): DayAvailability {
  const date = parseISO(dateISO);
  const dayStart = startOfDay(date);
  const dow = dayStart.getDay();
  const hours = HOURS[dow];
  const slots: Slot[] = [];

  if (!hours) {
    return formatDayAvailability(dateISO, dayStart, []);
  }

  const open = addMinutes(dayStart, hours.open * 60);
  const close = addMinutes(dayStart, hours.close * 60);
  const dayBookings = bookings.filter(
    (b) =>
      b.scheduledStart.startsWith(dateISO) &&
      (b.status === "pending" || b.status === "confirmed"),
  );

  for (
    let t = open;
    isBefore(addMinutes(t, durationMinutes), addMinutes(close, 1));
    t = addMinutes(t, 30)
  ) {
    if (isBefore(t, addMinutes(now, 120))) continue;

    const slotEnd = addMinutes(t, durationMinutes);
    const conflicts = dayBookings.some((b) => {
      const bStart = parseISO(b.scheduledStart);
      const bEnd = parseISO(b.scheduledEnd);
      return t < bEnd && slotEnd > bStart;
    });
    if (conflicts) continue;

    slots.push({
      start: t.toISOString(),
      end: slotEnd.toISOString(),
      label: format(t, "h:mm a"),
    });
  }

  return formatDayAvailability(dateISO, dayStart, slots);
}

function formatDayAvailability(dateISO: string, dayStart: Date, slots: Slot[]): DayAvailability {
  return {
    date: dateISO,
    weekday: format(dayStart, "EEE"),
    day: format(dayStart, "d"),
    slots,
  };
}

export async function getUpcomingAvailability(
  durationMinutes: number,
  days: number = 14,
  now: Date = new Date(),
): Promise<DayAvailability[]> {
  const allBookings = await listBookings();
  const out: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(startOfDay(now), i);
    const iso = format(d, "yyyy-MM-dd");
    out.push(getDayAvailability(iso, durationMinutes, allBookings, now));
  }
  return out;
}
