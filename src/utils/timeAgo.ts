export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);

  if (diff < 60)   return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;

  const hours = Math.floor(diff / 3600);
  if (hours < 24)  return `${hours} ч. назад`;

  const days = Math.floor(diff / 86400);
  if (days === 1)  return 'вчера';
  if (days < 7)   return `${days} дн. назад`;

  return date.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}
