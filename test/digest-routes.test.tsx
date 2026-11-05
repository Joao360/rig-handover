import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const good = [
  '{"at":"2026-01-01T23:00:00+01:00","job":"b/job","status":"ok","owner":"rook"}',
  '{"at":"2026-01-01T23:05:00+01:00","job":"a/job","status":"fail","owner":null,"error":"boom"}',
].join('\n');

let app: ReturnType<typeof createApp>;

beforeAll(() => {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-routes-'));
  writeFileSync(join(runsDir, '2026-01-01.jsonl'), good + '\n');
  writeFileSync(join(runsDir, '2026-01-02.jsonl'), '');
  writeFileSync(join(runsDir, '2026-01-03.jsonl'), 'not json\n' + good + '\n');
  app = createApp({ adapter: 'shim', installed: 'x', beatEverySeconds: 60, runsDir });
});

describe.each([
  { name: 'page', prefix: '/digest/' },
  { name: 'JSON', prefix: '/api/digest/' },
])('$name route', ({ prefix }) => {
  it('answers 200 for a night with a log', async () => {
    expect((await app.request(`${prefix}2026-01-01`)).status).toBe(200);
  });

  it('answers 404 for a night with no file', async () => {
    expect((await app.request(`${prefix}2000-01-01`)).status).toBe(404);
  });

  it('answers 404 for a night that is not a date', async () => {
    expect((await app.request(`${prefix}nope`)).status).toBe(404);
  });
});

describe('digest page', () => {
  it('lists jobs sorted by job and shows a missing owner as a dash', async () => {
    const html = await (await app.request('/digest/2026-01-01')).text();
    expect(html.indexOf('a/job')).toBeLessThan(html.indexOf('b/job'));
    expect(html).toContain('<td>—</td>');
  });

  it('renders "nothing ran" for an empty file', async () => {
    const html = await (await app.request('/digest/2026-01-02')).text();
    expect(html).toContain('nothing ran');
  });

  it('renders the night and reports the bad line', async () => {
    const html = await (await app.request('/digest/2026-01-03')).text();
    expect(html).toContain('a/job');
    expect(html).toContain('1 unreadable line(s) skipped');
  });
});

describe('digest JSON', () => {
  it('returns an empty list for an empty file', async () => {
    const body = await (await app.request('/api/digest/2026-01-02')).json();
    expect(body).toEqual({ night: '2026-01-02', rows: [], badLines: 0 });
  });

  it('counts the bad line and keeps the good rows', async () => {
    const body = (await (await app.request('/api/digest/2026-01-03')).json()) as {
      rows: { job: string }[];
      badLines: number;
    };
    expect(body.badLines).toBe(1);
    expect(body.rows.map((r) => r.job)).toEqual(['a/job', 'b/job']);
  });

  it('lists the same jobs in the same order as the page', async () => {
    const html = await (await app.request('/digest/2026-01-03')).text();
    const pageJobs = [...html.matchAll(/<tr[^>]*><td>([^<]+)<\/td>/g)].map((m) => m[1]);
    const body = (await (await app.request('/api/digest/2026-01-03')).json()) as { rows: { job: string }[] };
    expect(body.rows.map((r) => r.job)).toEqual(pageJobs);
  });
});
