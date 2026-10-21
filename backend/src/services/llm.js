import { config } from '../config.js';

export const llmEnabled = () => Boolean(config.openai.apiKey);

const summarize = (p) => ({
  id: p.id,
  role: p.role,
  seniority: p.seniority,
  tech_stack: p.tech_stack,
  interests: p.interests,
  bio: (p.bio || '').slice(0, 200),
});

/**
 * Re-ranks heuristic candidates using an OpenAI-compatible chat completion API.
 * Returns [{ id, reason }] in ranked order, or null if unavailable/failed.
 */
export async function llmRerank(me, candidates, mode) {
  if (!llmEnabled() || candidates.length === 0) return null;

  const system =
    'You are the matchmaking engine of DevMatch, a networking app for software developers. ' +
    'Rank candidate developers for the user. Consider: same tech stack/ecosystem (e.g. React with React, ' +
    'Spring Boot with Spring/Java), shared interests, and complementary roles that help both grow ' +
    '(e.g. frontend <-> backend, data <-> ML, designer <-> frontend). ' +
    'Respond ONLY with JSON: {"ranked":[{"id":number,"reason":string}]}. Reasons must be under 120 characters, ' +
    'addressed to the user in second person. Only use ids from the candidate list.';

  const user = JSON.stringify({
    mode,
    modeHint:
      mode === 'similar'
        ? 'Prefer people with the same stack/role.'
        : mode === 'complementary'
          ? 'Prefer people with complementary roles who can exchange knowledge.'
          : 'Balance similar-stack and complementary-role matches.',
    me: summarize(me),
    candidates: candidates.map(summarize),
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${config.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.warn(`OpenAI rerank failed: HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const allowed = new Set(candidates.map((c) => c.id));
    const ranked = (parsed.ranked || [])
      .filter((r) => allowed.has(Number(r.id)))
      .map((r) => ({ id: Number(r.id), reason: String(r.reason || '').slice(0, 200) }));
    return ranked.length ? ranked : null;
  } catch (err) {
    console.warn('OpenAI rerank error:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
