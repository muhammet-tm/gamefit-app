// "1 day", "2 days", "0 days". A count next to a noun reads wrong the moment
// the count is 1, and streaks, sessions and minutes all start at 1, so the
// first thing a new player sees is exactly the case a fixed "days" gets wrong.
// English only; Arabic, when it lands, needs Intl.PluralRules and its six forms.
export function pluralize(n, one, many = `${one}s`) {
  const value = Number(n) || 0;
  return `${value.toLocaleString()} ${value === 1 ? one : many}`;
}
