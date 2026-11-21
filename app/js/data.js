export async function loadData() {
  const [trophiesRes, sourcesRes] = await Promise.all([
    fetch('data/trophies.json'),
    fetch('data/sources.json'),
  ]);
  if (!trophiesRes.ok || !sourcesRes.ok) throw new Error('Could not load guide data.');
  const trophies = (await trophiesRes.json()).trophies;
  const sources = await sourcesRes.json();
  return { trophies, sources: sources.sources, disputes: sources.disputes, method: sources.method, readDate: sources.readDate };
}

export function gradeRank(grade) {
  return { platinum: 0, gold: 1, silver: 2, bronze: 3 }[grade] ?? 4;
}

export function medalLabel(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

export function countSteps(trophies) {
  let total = 0, cited = 0;
  for (const t of trophies) {
    for (const line of t.guide.split('\n')) {
      if (!line.trim()) continue;
      total += 1;
      if (/\[\d+\]/.test(line)) cited += 1;
    }
  }
  return { total, cited };
}
