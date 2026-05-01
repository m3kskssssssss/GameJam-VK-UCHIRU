// Re-export NextAuth helpers so consumers import from a stable path.
export { auth, signIn, signOut, handlers } from './config'
export {
  requireParent,
  requireChild,
  requireRelative,
  requireParentOrRelative,
  assertOwnsChild,
} from './guards'
export type {
  ParentSession,
  ChildSession,
  RelativeSession,
  FeedViewer,
  ViewerKind,
} from './guards'
