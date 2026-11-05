export type RunStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: RunStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type Night = {
  night: string;
  rows: DigestRow[];
  badLines: number;
};

// Returns null when there is no log for that night (the page answers 404).
// Rows are sorted by job. Times keep the offset from the log.
export type ReadNight = (runsDir: string, night: string) => Night | null;
