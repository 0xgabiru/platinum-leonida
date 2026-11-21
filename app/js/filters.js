export function spoilerLabel(trophy) {
  if (trophy.id === 2) return 'Story trophy · Opening — Hidden by the spoiler shield until earned';
  if (trophy.id === 3) return 'Story trophy · Chapter 1 — Hidden by the spoiler shield until earned';
  if (trophy.id === 4) return 'Story trophy · Chapter 2 — Hidden by the spoiler shield until earned';
  if (trophy.id === 5) return 'Story trophy · Chapter 3 — Hidden by the spoiler shield until earned';
  if (trophy.id === 6) return 'Story trophy · Chapter 4 — Hidden by the spoiler shield until earned';
  if (trophy.id === 7) return 'Story trophy · Final mission — Hidden by the spoiler shield until earned';
  return 'Story trophy · Named mission — Hidden by the spoiler shield until earned';
}

export function isSpoilerHidden(trophy, store) {
  return store.spoiler && trophy.kind.includes('story') && !store.isEarned(trophy.id);
}

export function applyFilters(trophies, filter, store) {
  return trophies.filter((t) => {
    if (filter.kind !== 'all') {
      if (filter.kind === 'missable') { if (!(t.missable === 'possibly' || t.missable === 'watch')) return false; }
      else if (!t.kind.includes(filter.kind)) return false;
    }
    if (filter.grade !== 'all' && t.grade !== filter.grade) return false;
    if (filter.hiddenOnly && !t.hidden) return false;
    if (filter.disputedOnly && !t.dispute) return false;
    if (filter.notEarnedOnly && store.isEarned(t.id)) return false;
    if (filter.q) {
      const q = filter.q.toLowerCase();
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export const KIND_OPTIONS = [
  ['all', 'All kinds'], ['story', 'Story'], ['missable', 'Missable / watch'],
  ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['crime', 'Crime'],
  ['completion', 'Completion'], ['money', 'Money'], ['side', 'Side'], ['misc', 'Misc'],
];
