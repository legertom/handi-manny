import { addDays, addMinutes, format, isBefore, parseISO, startOfDay } from "date-fns";
import { listBookings } from "./store";

// Business hours: Mon-Sat 8am-7pm, Sun 10am-5pm. Lunch break 12:30-1pm.
const HOURS: Record<number, { open: number; close: number }> = {
  0: { open: 10, close: 17 }, // Sun
  1: { open: 8, close: 19 },
  2: { open: 8, close: 19 },
  3: { open: 8, close: 19 },
  4: { open: 8, close: 19 },
  5: { open: 8, close: 19 },
  6: { open: 8, close: 19 }, // Sat
};

export type Slot = {
  /** ISO start time */
  start: string;
  /** ISO end time */
  end: string;
  /** human-readable label like "9:00 AM" */
  label: string;
};

export type DayAvailability = {
  /** ISO date YYYY-MM-DD */
  date: string;
  /** weekday short name like "Sat" */
  weekday: string;
  /** day-of-month like "10" */
  day: string;
  slots: Slot[];
};

/**
 * Generate available start-time slots for a given date and service duration.
 * Slots are placed every 30 minutes; jobs that overlap existing confirmed bookings
 * (or pending bookings within the buffer) are filtered out.
 */
export function getDayAvailability(
  dateISO: string,
  durationMinutes: number,
  now: Date = new Date()
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
  const bookings = listBookings().filter((b) =>
    b.scheduledStart.startsWith(dateISO) && (b.status === "pending" || b.status === "confirmed")
  );

  // 30-minute granularity; require slot + duration to fit before close.
  for (
    let t = open;
    isBefore(addMinutes(t, durationMinutes), addMinutes(close, 1));
    t = addMinutes(t, 30)
  ) {
    // Don't offer past slots (with a 2-hour lead-time buffer).
    if (isBefore(t, addMinutes(now, 120))) continue;

    const slotEnd = addMinutes(t, durationMinutes);
    const conflicts = bookings.some((b) => {
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

/** Get the next N days of availability for the booking calendar. */
export function getUpcomingAvailability(
  durationMinutes: number,
  days: number = 14,
  now: Date = new Date()
): DayAvailability[] {
  const out: DayAvailability[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDays(startOfDay(now), i);
    const iso = format(d, "yyyy-MM-dd");
    out.push(getDayAvailability(iso, durationMinutes, now));
  }
  return out;
}
