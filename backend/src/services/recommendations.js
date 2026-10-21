import { COMPLEMENTARY_ROLES, TECH_ECOSYSTEMS } from '../constants.js';

const norm = (list) => new Set((list || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean));

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  return inter / (a.size + b.size - inter);
}

function intersection(a, b) {
  return [...a].filter((x) => b.has(x));
}

function ecosystems(stack) {
  const out = new Set();
  for (const tech of stack) for (const eco of TECH_ECOSYSTEMS[tech] || []) out.add(eco);
  return out;
}

export function isComplementary(roleA, roleB) {
  return (
    (COMPLEMENTARY_ROLES[roleA] || []).includes(roleB) || (COMPLEMENTARY_ROLES[roleB] || []).includes(roleA)
  );
}

const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Heuristic score in [0,1] plus a human-readable reason.
 * mode: "similar" (same stack/role), "complementary" (roles that teach each other), "mixed" (best of both).
 */
export function scoreCandidate(me, them, mode = 'mixed') {
  const myStack = norm(me.tech_stack);
  const theirStack = norm(them.tech_stack);
  const myEco = ecosystems(myStack);
  const theirEco = ecosystems(theirStack);
  const myInterests = norm(me.interests);
  const theirInterests = norm(them.interests);

  const stack = jaccard(myStack, theirStack);
  const eco = jaccard(myEco, theirEco);
  const interests = jaccard(myInterests, theirInterests);
  const sameRole = me.role === them.role ? 1 : 0;
  const complementary = isComplementary(me.role, them.role) ? 1 : 0;

  const similarScore = 0.5 * stack + 0.2 * eco + 0.2 * interests + 0.1 * sameRole;
  const complementaryScore = complementary
    ? 0.45 + 0.25 * interests + 0.2 * eco + 0.1 * stack
    : 0.15 * interests + 0.1 * eco;

  let score;
  let kind;
  if (mode === 'similar') {
    score = similarScore;
    kind = 'similar';
  } else if (mode === 'complementary') {
    score = complementaryScore;
    kind = 'complementary';
  } else if (complementaryScore > similarScore) {
    score = complementaryScore;
    kind = 'complementary';
  } else {
    score = similarScore;
    kind = 'similar';
  }

  const sharedTech = intersection(myStack, theirStack).slice(0, 3).map(titleCase);
  const sharedInterests = intersection(myInterests, theirInterests).slice(0, 2);
  let reason;
  if (kind === 'complementary' && complementary) {
    reason = `${titleCase(me.role)} ↔ ${titleCase(them.role)}: grow together by exchanging knowledge`;
    if (sharedInterests.length) reason += ` (both into ${sharedInterests.join(', ')})`;
  } else if (sharedTech.length) {
    reason = `You both work with ${sharedTech.join(', ')}`;
  } else if (sharedInterests.length) {
    reason = `Shared interests: ${sharedInterests.join(', ')}`;
  } else {
    reason = `Expand your network into ${them.role}`;
  }

  return { score: Math.round(score * 1000) / 1000, kind, reason };
}

export function rankCandidates(me, candidates, mode = 'mixed', limit = 20) {
  return candidates
    .map((c) => ({ ...c, match: scoreCandidate(me, c, mode) }))
    .sort((a, b) => b.match.score - a.match.score || a.id - b.id)
    .slice(0, limit);
}
