export const TIME_SLOTS = Array.from({ length: 16 }, (_, index) => {
  const hour = index + 8;
  return `${String(hour).padStart(2, "0")}:00`;
});

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysIso(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function formatFriendlyDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function getRangeDates(range: "day" | "week" | "month", anchorDate = todayIsoDate()) {
  if (range === "day") return [anchorDate];

  const anchor = new Date(`${anchorDate}T00:00:00`);
  const start = new Date(anchor);

  if (range === "week") {
    const day = (anchor.getDay() + 6) % 7;
    start.setDate(anchor.getDate() - day);
    return Array.from({ length: 7 }, (_, index) => {
      const next = new Date(start);
      next.setDate(start.getDate() + index);
      return next.toISOString().slice(0, 10);
    });
  }

  start.setDate(1);
  const dates: string[] = [];
  const cursor = new Date(start);
  while (cursor.getMonth() === start.getMonth()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function areConsecutiveDates(left: string, right: string) {
  return addDaysIso(left, 1) === right;
}
