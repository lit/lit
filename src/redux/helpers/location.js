// TODO: make this a selector

export function getLocationPathPart(state, i) {
  if (state && state.location && state.location.path) {
    return state.location.path.slice(1).split('/')[i] || null;
  }
  return null;
}
