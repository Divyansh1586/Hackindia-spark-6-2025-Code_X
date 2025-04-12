interface ProcessPdfParams {
  file: File;
  sessionId?: string;
}

interface ProcessUrlParams {
  url: string;
  sessionId?: string;
}

interface QueryParams {
  query: string;
  sessionId: string;
}

interface Session {
  session_id: string;
  created_at: string;
  title: string;
  type: "pdf" | "url";
  status: "processing" | "complete" | "error";
}

class ApiService {
  private baseUrl = "http://localhost:8000";
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("token", token);
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    method: string = "GET",
    data?: any,
    formData: boolean = false
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: formData ? { 
        Authorization: this.token ? `Bearer ${this.token}` : "",
      } : this.getHeaders(),
    };

    if (data) {
      if (formData) {
        const formDataObj = new FormData();
        
        Object.entries(data).forEach(([key, value]) => {
          if (value instanceof File) {
            formDataObj.append(key, value);
          } else if (typeof value === "string") {
            formDataObj.append(key, value);
          }
        });
        
        options.body = formDataObj;
      } else {
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "API request failed");
    }

    // For endpoints that don't return JSON
    if (response.status === 204) {
      return {} as T;
    }

    return await response.json() as T;
  }

  async login(username: string, password: string) {
    const response = await this.request<{ access_token: string; token_type: string }>(
      "/login",
      "POST",
      { username, password }
    );
    this.setToken(response.access_token);
    return response;
  }

  async register(username: string, password: string) {
    const response = await this.request<{ access_token: string; token_type: string }>(
      "/register",
      "POST",
      { username, password }
    );
    this.setToken(response.access_token);
    return response;
  }

  async processPdf({ file, sessionId }: ProcessPdfParams) {
    const data: Record<string, File | string> = { file };
    if (sessionId) {
      data.session_id = sessionId;
    }
    return this.request<{ session_id: string; message: string }>(
      "/process-pdf",
      "POST",
      data,
      true
    );
  }

  async processUrl({ url, sessionId }: ProcessUrlParams) {
    const data: { url: string; session_id?: string } = { url };
    if (sessionId) {
      data.session_id = sessionId;
    }
    return this.request<{ session_id: string; message: string }>(
      "/process-urls",
      "POST",
      data
    );
  }

  async query({ query, sessionId }: QueryParams) {
    return this.request<{ answer: string; sources: Array<any> }>(
      "/query",
      "POST",
      { query, session_id: sessionId }
    );
  }

  async summarizePdf(sessionId: string) {
    return this.request<{ summary: string }>(
      "/summarize-pdf",
      "POST",
      { session_id: sessionId }
    );
  }

  async getMySessions() {
    return this.request<{ sessions: Session[] }>("/my-sessions");
  }

  async loadSession(sessionId: string) {
    return this.request<{ message: string; session_id: string }>(
      `/load-session/${sessionId}`,
      "GET"
    );
  }
}

export const apiService = new ApiService();
