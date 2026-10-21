import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isComplementary, rankCandidates, scoreCandidate } from '../src/services/recommendations.js';
import { generateProfiles } from '../db/seed.js';

const reactDev = { id: 1, role: 'frontend', tech_stack: ['React', 'TypeScript'], interests: ['open source'] };
const reactDev2 = { id: 2, role: 'frontend', tech_stack: ['React', 'Next.js'], interests: ['open source'] };
const springDev = { id: 3, role: 'backend', tech_stack: ['Java', 'Spring Boot'], interests: ['system design'] };
const springDev2 = { id: 4, role: 'backend', tech_stack: ['Kotlin', 'Spring Boot'], interests: ['system design'] };
const nodeDev = { id: 5, role: 'backend', tech_stack: ['Node.js', 'Express'], interests: ['open source'] };
const designer = { id: 6, role: 'designer', tech_stack: ['Figma'], interests: [] };

test('frontend and backend are complementary', () => {
  assert.equal(isComplementary('frontend', 'backend'), true);
  assert.equal(isComplementary('backend', 'frontend'), true);
  assert.equal(isComplementary('frontend', 'frontend'), false);
});

test('similar mode puts React devs with React devs', () => {
  const [top] = rankCandidates(reactDev, [springDev, designer, reactDev2, nodeDev], 'similar');
  assert.equal(top.id, reactDev2.id);
  assert.match(top.match.reason, /React/);
});

test('similar mode puts Spring devs with Spring devs', () => {
  const [top] = rankCandidates(springDev, [reactDev, springDev2, nodeDev], 'similar');
  assert.equal(top.id, springDev2.id);
});

test('complementary mode recommends backend to frontend devs', () => {
  const ranked = rankCandidates(reactDev, [reactDev2, springDev, nodeDev], 'complementary');
  assert.equal(ranked[0].match.kind, 'complementary');
  assert.equal(ranked[0].role, 'backend');
  // Node backend shares the JavaScript ecosystem and interests, so it ranks first.
  assert.equal(ranked[0].id, nodeDev.id);
  assert.notEqual(ranked.at(-1).role, 'backend');
});

test('scores are bounded', () => {
  for (const mode of ['similar', 'complementary', 'mixed']) {
    const { score } = scoreCandidate(reactDev, reactDev, mode);
    assert.ok(score >= 0 && score <= 1, `${mode} score ${score}`);
  }
});

test('seed generates 100 unique, valid profiles', () => {
  const profiles = generateProfiles(100);
  assert.equal(profiles.length, 100);
  assert.equal(new Set(profiles.map((p) => p.email)).size, 100);
  assert.ok(profiles.filter((p) => p.tech_stack.includes('React')).length >= 10);
  assert.ok(profiles.filter((p) => p.tech_stack.includes('Spring Boot')).length >= 5);
});
