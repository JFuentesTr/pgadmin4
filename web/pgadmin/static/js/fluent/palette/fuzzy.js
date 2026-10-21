/////////////////////////////////////////////////////////////
//
// pgAdmin 4 - Fluent fork
//
// Portions Copyright (C) 2013 - 2026, The pgAdmin Development Team
// This software is released under the PostgreSQL Licence
//
//////////////////////////////////////////////////////////////

/* Small fuzzy matcher for the command palette. Every whitespace separated
 * term must appear in order inside the text (as a subsequence). Contiguous
 * runs, word starts and prefixes score higher. Returns null when it does not
 * match, else {score, indices} where indices are the matched characters. */

function matchTerm(term, text, lower) {
  /* Prefer a contiguous match: much easier to read in the highlight. */
  const at = lower.indexOf(term);
  if(at >= 0) {
    const wordStart = at === 0 || /[\s_.\-/›(]/.test(text[at - 1]);
    const indices = [];
    for(let i = 0; i < term.length; i++) indices.push(at + i);
    return {score: 100 + term.length * 10 + (wordStart ? 40 : 0) + (at === 0 ? 30 : 0) - at, indices};
  }

  let score = 0;
  let ti = 0;
  let prev = -2;
  const indices = [];
  for(let i = 0; i < lower.length && ti < term.length; i++) {
    if(lower[i] === term[ti]) {
      const wordStart = i === 0 || /[\s_.\-/›(]/.test(text[i - 1]);
      score += (i === prev + 1 ? 8 : 1) + (wordStart ? 6 : 0);
      indices.push(i);
      prev = i;
      ti++;
    }
  }
  return ti === term.length ? {score, indices} : null;
}

export function fuzzyMatch(query, text) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if(!terms.length) return {score: 0, indices: []};
  const lower = String(text).toLowerCase();
  let total = 0;
  const indices = new Set();
  for(const term of terms) {
    const res = matchTerm(term, text, lower);
    if(!res) return null;
    total += res.score;
    res.indices.forEach((i)=>indices.add(i));
  }
  return {score: total, indices: [...indices].sort((a, b)=>a - b)};
}

/* Splits text into [{text, match}] chunks for highlighting. */
export function highlightChunks(text, indices) {
  const chunks = [];
  const set = new Set(indices);
  let current = null;
  for(let i = 0; i < text.length; i++) {
    const match = set.has(i);
    if(!current || current.match !== match) {
      current = {text: '', match};
      chunks.push(current);
    }
    current.text += text[i];
  }
  return chunks;
}
