export function todayISO(): string {
  return formatISO(new Date());
}

export function formatISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function isFutureISODate(value: string): boolean {
  return value > todayISO();
}

export function formatDisplayDate(value: string): string {
  if (!isValidISODate(value)) {
    return value;
  }
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export function addDaysISO(value: string, days: number): string {
  if (!isValidISODate(value)) {
    return value;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatISO(date);
}

export function monthStartISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export function weekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const date = new Date(now);
  date.setDate(date.getDate() - diff);
  return formatISO(date);
}

export function quarterStartISO(): string {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const month = quarter * 3;
  return `${now.getFullYear()}-${String(month + 1).padStart(2, '0')}-01`;
}

export function yearStartISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
}
