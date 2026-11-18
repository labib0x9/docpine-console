import { API_BASE } from "./env";
import type {
  User,
  Lab,
  LabRun,
  LabResult,
  RepoResponse,
  RepoRequest,
  CreateRunRequest,
  HealthResponse,
  ApiErrorResponse,
} from "./types";

export class ApiError extends Error {
  status: number;
  apiError: string;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.apiError = message;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = (await response.json()) as ApiErrorResponse;
      if (errJson && typeof errJson.error === "string") {
        errorMessage = errJson.error;
      }
    } catch {
      // Not JSON, fallback to status text
    }

    if (response.status === 401) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      } else if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new ApiError(response.status, errorMessage);
  }

  // If 204 No Content, return empty object / undefined
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const api = {
  /**
   * Current authenticated user. Returns 401 if not logged in.
   */
  async getMe(): Promise<User> {
    return request<User>("/v1/me");
  },

  /**
   * Log out current user, clearing backend session cookies.
   */
  async logout(): Promise<void> {
    await request<void>("/v1/auth/logout", {
      method: "POST",
    });
  },

  /**
   * Get saved user repository.
   */
  async getUserRepo(): Promise<RepoResponse> {
    return request<RepoResponse>("/v1/me/repo");
  },

  /**
   * Save user repository.
   */
  async setUserRepo(github_repo: string): Promise<RepoResponse> {
    const payload: RepoRequest = { github_repo };
    return request<RepoResponse>("/v1/me/repo", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  /**
   * List available labs.
   */
  async getLabs(): Promise<Lab[]> {
    return request<Lab[]>("/v1/labs");
  },

  /**
   * Create and enqueue a lab run.
   */
  async createRun(
    labId: number,
    githubRepo: string,
    turnstileToken?: string
  ): Promise<LabRun> {
    const payload: CreateRunRequest = { github_repo: githubRepo };
    const headers: Record<string, string> = {};

    if (turnstileToken) {
      headers["CF-Turnstile-Response"] = turnstileToken;
    }

    return request<LabRun>(`/v1/labs/${labId}/runs`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  },

  /**
   * List runs for a specific lab.
   */
  async getLabRuns(labId: number): Promise<LabRun[]> {
    return request<LabRun[]>(`/v1/labs/${labId}/runs`);
  },

  /**
   * Get detail for one run.
   */
  async getRun(labId: number, runId: number): Promise<LabRun> {
    return request<LabRun>(`/v1/labs/${labId}/runs/${runId}`);
  },

  /**
   * Get persisted run result output.
   */
  async getRunResult(labId: number, runId: number): Promise<LabResult> {
    return request<LabResult>(`/v1/labs/${labId}/runs/${runId}/result`);
  },

  /**
   * Liveness probe / backend health.
   */
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/healthz");
  },
};
