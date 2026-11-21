const KEY = 'platinum-leonida-v1';

export const SEED_EARNED = [2, 3, 5, 8, 10, 20, 21, 33, 44, 46, 53];
export const SEED_COUNTS = { 15: 120, 17: 12, 18: 6, 28: 6, 31: 40, 32: 25, 35: 55, 40: 2, 52: 90000, 55: 4 };

function blank() {
  return { earned: {}, counts: {}, notes: {}, spoiler: true };
}

export function createStore() {
  let state = blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...blank(), ...JSON.parse(raw) };
  } catch { state = blank(); }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }

  return {
    get earned() { return state.earned; },
    get counts() { return state.counts; },
    get notes() { return state.notes; },
    get spoiler() { return state.spoiler; },
    isEarned(id) { return !!state.earned[id]; },
    toggleEarned(id) { state.earned[id] = !state.earned[id]; if (!state.earned[id]) delete state.earned[id]; save(); },
    getCount(id) { return state.counts[id] || 0; },
    setCount(id, n) { state.counts[id] = Math.max(0, n); save(); },
    bumpCount(id, d) { this.setCount(id, this.getCount(id) + d); },
    getNote(id) { return state.notes[id] || ''; },
    setNote(id, text) { if (text) state.notes[id] = text; else delete state.notes[id]; save(); },
    setSpoiler(v) { state.spoiler = !!v; save(); },
    applySeed(earnedIds, counts) {
      for (const id of earnedIds) state.earned[id] = true;
      for (const [id, n] of Object.entries(counts)) state.counts[id] = n;
      save();
    },
    exportJSON() { return JSON.stringify(state, null, 2); },
    importJSON(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') throw new Error('bad export');
      state = { ...blank(), ...parsed };
      save();
    },
    reset() { state = blank(); save(); },
  };
}
