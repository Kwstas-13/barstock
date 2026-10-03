export function formatShift(shift) {
  if (!shift) return "—";

  const date = new Date(shift.started_at).toLocaleString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `#${shift.id} · ${date} · ${shift.status}`;
}

export function formatEuro(value) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(2)} €`;
}

export function toNumberOrNull(value) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

export function costPerMl(cost, sizeMl) {
  const c = toNumberOrNull(cost);
  const s = Number(sizeMl);
  if (c === null || !(s > 0)) return null;
  return c / s;
}

export function formatCostPerMl(cost, sizeMl) {
  const value = costPerMl(cost, sizeMl);
  return value === null ? "—" : `${value.toFixed(4)} €`;
}