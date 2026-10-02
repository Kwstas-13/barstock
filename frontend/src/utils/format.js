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