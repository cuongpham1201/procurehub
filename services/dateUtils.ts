type DateInput = string | null | undefined;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

function toDateParts(value: DateInput): { year: number; month: number; day: number } | null {
  const raw = value?.trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const year = Number(ymd[1]);
    const month = Number(ymd[2]);
    const day = Number(ymd[3]);
    return isValidDateParts(year, month, day) ? { year, month, day } : null;
  }

  const dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    return isValidDateParts(year, month, day) ? { year, month, day } : null;
  }

  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;
  return {
    year: parsed.getFullYear(),
    month: parsed.getMonth() + 1,
    day: parsed.getDate(),
  };
}

export function toDateInputValue(value: DateInput): string {
  const parts = toDateParts(value);
  if (!parts) return "";
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function normalizeDateInput(value: DateInput): string {
  return toDateInputValue(value);
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function isDateBeforeToday(value: DateInput): boolean {
  const normalized = normalizeDateInput(value);
  return normalized ? normalized < getTodayDateString() : false;
}

export function isDateTodayOrFuture(value: DateInput): boolean {
  const normalized = normalizeDateInput(value);
  return normalized ? normalized >= getTodayDateString() : false;
}

export function toDateTimeInputValue(value: DateInput): string {
  const raw = value?.trim();
  if (!raw) return "";

  const local = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (local) {
    const year = Number(local[1]);
    const month = Number(local[2]);
    const day = Number(local[3]);
    const hour = Number(local[4]);
    const minute = Number(local[5]);
    if (isValidDateParts(year, month, day) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}`;
    }
    return "";
  }

  if (/^(\d{4})-(\d{2})-(\d{2})$/.test(raw) || /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(raw)) {
    const date = toDateInputValue(raw);
    return date ? `${date}T00:00` : "";
  }

  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return [
      `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`,
      `T${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`,
    ].join("");
  }
  return "";
}

export function formatDisplayDate(value: DateInput): string {
  const raw = value?.trim();
  if (!raw) return "—";
  const parts = toDateParts(raw);
  if (!parts) return raw;
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}
