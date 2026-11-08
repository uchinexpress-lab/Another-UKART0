// Hourly shuffle for the "More to Explore" grid.
// The order is derived from the current hour, so everyone sees the same
// arrangement and it only changes when a new hour starts.

export function currentHourSeed() {
  return Math.floor(Date.now() / 3600000);
}

export function hourlyShuffle(list, seed = currentHourSeed()) {
  const arr = [...(list || [])];
  let state = (seed % 2147483647) || 1;
  const next = () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}