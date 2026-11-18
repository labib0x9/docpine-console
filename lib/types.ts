export type User = {
  id: number;
  github_id: number;
  login: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

export type Lab = {
  id: number;
  name: string;
  tests: string[];
  created_at: string;
  updated_at: string;
};

export type RunStatus = "queued" | "running" | "passed" | "failed";

export type LabRun = {
  id: number;
  user_id: number;
  lab_id: number;
  github_repo: string;
  status: RunStatus;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  finished_at?: string | null;
};

export type LabResult = {
  id: number;
  run_id: number;
  user_id: number;
  github_repo: string;
  lab_id: number;
  results: string;
  created_at: string;
};

export type RepoResponse = {
  github_repo: string;
};

export type RepoRequest = {
  github_repo: string;
};

export type CreateRunRequest = {
  github_repo: string;
};

export type HealthResponse = {
  status: string;
};

export type ApiErrorResponse = {
  error: string;
};

export type SseEventName = "status" | "output" | "result" | "error" | "ping";
