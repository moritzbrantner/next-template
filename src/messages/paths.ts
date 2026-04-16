export function buildDirectMessagesPath(tag: string) {
  return `/messages?with=${encodeURIComponent(`@${tag}`)}`;
}
