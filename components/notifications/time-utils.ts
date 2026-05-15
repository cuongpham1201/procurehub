/** Returns a Vietnamese relative-time string, e.g. "2 phút trước", "Hôm qua" */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return "Vừa xong";
  if (mins < 60)  return `${mins} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  if (days === 1) return "Hôm qua";
  if (days < 7)   return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Group ISO date strings into "Hôm nay" / "Hôm qua" / date label */
export function dateGroupLabel(iso: string): string {
  const d     = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime())     return "Hôm nay";
  if (d.getTime() === yesterday.getTime()) return "Hôm qua";
  return new Date(iso).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" });
}
