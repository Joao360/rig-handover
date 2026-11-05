import type { DigestRow, Night } from '../digest/types.js';

const MISSING = '—';

function marked(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

export function DigestPage({ digest }: { digest: Night }) {
  return (
    <>
      <h1>digest · {digest.night}</h1>
      {digest.rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {digest.rows.map((row) => (
              <tr class={marked(row) ? 'warn' : undefined}>
                <td>{row.job}</td>
                <td>{row.owner ?? MISSING}</td>
                <td>{row.runs}</td>
                <td>{row.retries}</td>
                <td>{row.lastStatus}</td>
                <td>{row.lastError ?? MISSING}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {digest.badLines > 0 ? <p class="mute">{digest.badLines} unreadable line(s) skipped</p> : null}
    </>
  );
}
