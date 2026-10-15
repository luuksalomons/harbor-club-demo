// Up to two initials for avatars: "Jane Doe" -> "JD", "jane@x.com" -> "J".
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? words[0][0] : `${words[0][0]}${words[words.length - 1][0]}`;
  return letters.toUpperCase();
}
