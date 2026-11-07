/**
 * Contribution calendar + streak computation.
 *
 * The vendored cards do not expose the raw contribution calendar, so this module
 * asks GitHub's GraphQL API for it directly and derives the two values the streak
 * panel needs. The streak rules mirror github-readme-streak-stats:
 *   - "today" with zero contributions does not break a streak (yesterday counts),
 *   - consecutive days with contributionCount > 0 are a streak.
 */

const GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

const CALENDAR_QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
      }
    }
  }
`;

function token() {
  return (
    process.env.PAT_1 ||
    process.env.GITHUB_TOKEN ||
    process.env.TOKEN ||
    ""
  );
}

async function graphql(query, variables) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token()}`,
      "Content-Type": "application/json",
      "User-Agent": "Dynesshely-status-renderer",
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) {
    const message = body?.errors?.[0]?.message ?? `HTTP ${res.status}`;
    throw new Error(`GitHub GraphQL failed: ${message}`);
  }
  return body.data;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Worst case we need 53 weeks to cover a full year plus the current partial week. */
export function lastYearWindow(now = new Date()) {
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const from = new Date(to.getTime() - 371 * DAY_MS);
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * @returns {Promise<{total:number, days:{date:string,count:number}[], weeks:string[][]}>}
 */
export async function fetchContributionCalendar(username, now = new Date()) {
  const { from, to } = lastYearWindow(now);
  const data = await graphql(CALENDAR_QUERY, { login: username, from, to });
  const calendar = data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) throw new Error(`no contribution calendar for ${username}`);

  const days = [];
  const weeks = [];
  const counts = new Map();
  for (const week of calendar.weeks) {
    const weekDates = [];
    for (const day of week.contributionDays) {
      days.push({ date: day.date, count: day.contributionCount });
      counts.set(day.date, day.contributionCount);
      weekDates.push(day.date);
    }
    weeks.push(weekDates);
  }
  days.sort((a, b) => (a.date < b.date ? -1 : 1));
  return { total: calendar.totalContributions, days, weeks, counts };
}

const USER_CREATED_QUERY = `
  query ($login: String!) {
    user(login: $login) {
      createdAt
    }
  }
`;

/**
 * Full-history contributions.
 *
 * `contributionsCollection` only accepts a range of at most one year, so the
 * account lifetime is walked one year at a time and the daily counts are merged.
 * The streak numbers the old PHP card showed (1,121 days) are lifetime values, so
 * a one-year window is not enough.
 */
export async function fetchFullHistory(username, now = new Date()) {
  const created = await graphql(USER_CREATED_QUERY, { login: username });
  const createdAt = new Date(created.user.createdAt);
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

  const counts = new Map();
  let cursor = createdAt;
  while (cursor < end) {
    const to = new Date(Math.min(cursor.getTime() + 365 * DAY_MS, end.getTime()));
    const data = await graphql(CALENDAR_QUERY, {
      login: username,
      from: cursor.toISOString(),
      to: to.toISOString(),
    });
    const calendar = data?.user?.contributionsCollection?.contributionCalendar;
    for (const week of calendar?.weeks ?? []) {
      for (const day of week.contributionDays) {
        counts.set(day.date, Math.max(counts.get(day.date) ?? 0, day.contributionCount));
      }
    }
    cursor = new Date(to.getTime() + DAY_MS);
  }

  const days = [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return {
    days,
    total: days.reduce((sum, day) => sum + day.count, 0),
    since: createdAt.toISOString().slice(0, 10),
  };
}

/** Longest and current streak, computed the same way as github-readme-streak-stats. */
export function computeStreak(days, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const byDate = new Map(days.map((d) => [d.date, d.count]));

  let longest = { length: 0, start: null, end: null };
  let runStart = null;
  let runLength = 0;
  for (const { date, count } of days) {
    if (count > 0) {
      if (runStart === null) runStart = date;
      runLength += 1;
      if (runLength > longest.length) {
        longest = { length: runLength, start: runStart, end: date };
      }
    } else {
      runStart = null;
      runLength = 0;
    }
  }

  // Walk backwards from today (or yesterday when today has no activity yet).
  const toDay = (d) => d.toISOString().slice(0, 10);
  let cursor = new Date(`${today}T00:00:00Z`);
  if ((byDate.get(toDay(cursor)) ?? 0) === 0) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  let current = { length: 0, start: null, end: null };
  while ((byDate.get(toDay(cursor)) ?? 0) > 0) {
    if (current.end === null) current.end = toDay(cursor);
    current.length += 1;
    current.start = toDay(cursor);
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return { current, longest, total: days.reduce((sum, d) => sum + d.count, 0) };
}

export function formatDate(date) {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  return `${m}/${d}/${y.slice(2)}`;
}
