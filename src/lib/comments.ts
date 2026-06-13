export function canDeleteComment(args: {
  viewerId: string | undefined | null;
  commentAuthorId: string;
  spotAuthorId: string;
}): boolean {
  const { viewerId, commentAuthorId, spotAuthorId } = args;
  if (!viewerId) return false;
  return viewerId === commentAuthorId || viewerId === spotAuthorId;
}
