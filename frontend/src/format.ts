export function formatCurrency(amount: number, currency = "USD"): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "MXN" ? "$" : "$";
  return `${sign}${symbol}${formatted}`;
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } catch {
    return "";
  }
}

export function formatDateLong(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}
