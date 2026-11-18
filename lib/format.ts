/**
 * Formatting and validation utilities for Docpine Console.
 */

// GitHub repo format patterns:
// 1. owner/repo (e.g. octocat/Hello-World)
// 2. github.com/owner/repo
// 3. https://github.com/owner/repo[.git]
// 4. git@github.com:owner/repo.git
const REPO_REGEXES = [
  /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/,
  /^github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/,
  /^https?:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$/,
  /^git@github\.com:[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\.git)?$/,
];

export function isValidGithubRepo(repo: string): boolean {
  const trimmed = repo.trim();
  if (!trimmed) return false;
  return REPO_REGEXES.some((regex) => regex.test(trimmed));
}

export function extractRepoShortName(repo: string): string {
  const trimmed = repo.trim();
  if (!trimmed) return "";

  // Handle git@github.com:owner/repo.git
  const sshMatch = trimmed.match(/^git@github\.com:([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+?)(\.git)?$/);
  if (sshMatch) return sshMatch[1];

  // Handle https://github.com/owner/repo.git
  const httpsMatch = trimmed.match(/^https?:\/\/github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+?)(\.git)?$/);
  if (httpsMatch) return httpsMatch[1];

  // Handle github.com/owner/repo
  const hostMatch = trimmed.match(/^github\.com\/([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+?)(\.git)?$/);
  if (hostMatch) return hostMatch[1];

  // Handle owner/repo
  return trimmed.replace(/\.git$/, "");
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const now = Date.now();
    const diffMs = now - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 5) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;

    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;

    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function formatDuration(
  startedAt?: string | null,
  finishedAt?: string | null
): string {
  if (!startedAt) return "—";
  try {
    const start = new Date(startedAt).getTime();
    const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
    if (isNaN(start) || isNaN(end) || end < start) return "—";

    const totalSeconds = Math.floor((end - start) / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  } catch {
    return "—";
  }
}

/**
 * Strips ANSI escape sequences for plain text viewing or downloading.
 */
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}
