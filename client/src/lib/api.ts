import { apiRequest } from "./queryClient";

// User API
export const getUserProfile = async () => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  
  return response.json();
};

// Client API
export const getClients = async () => {
  const response = await fetch("/api/clients", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch clients");
  }
  
  return response.json();
};

export const getClient = async (id: number) => {
  const response = await fetch(`/api/clients/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch client");
  }
  
  return response.json();
};

export const createClient = async (data: any) => {
  return apiRequest("POST", "/api/clients", data);
};

export const updateClient = async (id: number, data: any) => {
  return apiRequest("PATCH", `/api/clients/${id}`, data);
};

export const deleteClient = async (id: number) => {
  return apiRequest("DELETE", `/api/clients/${id}`, undefined);
};

// Project API
export const getProjects = async () => {
  const response = await fetch("/api/projects", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch projects");
  }
  
  return response.json();
};

export const getProject = async (id: number) => {
  const response = await fetch(`/api/projects/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch project");
  }
  
  return response.json();
};

export const getClientProjects = async (clientId: number) => {
  const response = await fetch(`/api/clients/${clientId}/projects`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch client projects");
  }
  
  return response.json();
};

export const createProject = async (data: any) => {
  return apiRequest("POST", "/api/projects", data);
};

export const updateProject = async (id: number, data: any) => {
  return apiRequest("PATCH", `/api/projects/${id}`, data);
};

export const deleteProject = async (id: number) => {
  return apiRequest("DELETE", `/api/projects/${id}`, undefined);
};

// Proposal API
export const getProposals = async () => {
  const response = await fetch("/api/proposals", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch proposals");
  }
  
  return response.json();
};

export const getProposal = async (id: number) => {
  const response = await fetch(`/api/proposals/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch proposal");
  }
  
  return response.json();
};

export const getProjectProposals = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/proposals`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch project proposals");
  }
  
  return response.json();
};

export const createProposal = async (data: any) => {
  return apiRequest("POST", "/api/proposals", data);
};

export const updateProposal = async (id: number, data: any) => {
  return apiRequest("PATCH", `/api/proposals/${id}`, data);
};

export const deleteProposal = async (id: number) => {
  return apiRequest("DELETE", `/api/proposals/${id}`, undefined);
};

// Moodboard API
export const getMoodboards = async () => {
  const response = await fetch("/api/moodboards", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch moodboards");
  }
  
  return response.json();
};

export const getMoodboard = async (id: number) => {
  const response = await fetch(`/api/moodboards/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch moodboard");
  }
  
  return response.json();
};

export const getProjectMoodboards = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/moodboards`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch project moodboards");
  }
  
  return response.json();
};

export const createMoodboard = async (data: any) => {
  return apiRequest("POST", "/api/moodboards", data);
};

export const updateMoodboard = async (id: number, data: any) => {
  return apiRequest("PATCH", `/api/moodboards/${id}`, data);
};

export const deleteMoodboard = async (id: number) => {
  return apiRequest("DELETE", `/api/moodboards/${id}`, undefined);
};

// Estimate API
export const getEstimates = async () => {
  const response = await fetch("/api/estimates", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch estimates");
  }
  
  return response.json();
};

export const getEstimate = async (id: number) => {
  const response = await fetch(`/api/estimates/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch estimate");
  }
  
  return response.json();
};

export const getProjectEstimates = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/estimates`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch project estimates");
  }
  
  return response.json();
};

export const createEstimate = async (data: any) => {
  return apiRequest("POST", "/api/estimates", data);
};

export const updateEstimate = async (id: number, data: any) => {
  return apiRequest("PATCH", `/api/estimates/${id}`, data);
};

export const deleteEstimate = async (id: number) => {
  return apiRequest("DELETE", `/api/estimates/${id}`, undefined);
};

// Task API
export const getTasks = async () => {
  const response = await fetch("/api/tasks", {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  
  return response.json();
};

export const getTask = async (id: number) => {
  const response = await fetch(`/api/tasks/${id}`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch task");
  }
  
  return response.json();
};

export const getProjectTasks = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/tasks`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch project tasks");
  }
  
  return response.json();
};

export const createTask = async (data: any) => {
  return apiRequest("POST", "/api/tasks", data);
};

export const updateTask = async (id: number, data: any) => {
  return apiRequest("PATCH", `/api/tasks/${id}`, data);
};

export const deleteTask = async (id: number) => {
  return apiRequest("DELETE", `/api/tasks/${id}`, undefined);
};

// Activity API
export const getActivities = async (limit?: number) => {
  const url = limit ? `/api/activities?limit=${limit}` : "/api/activities";
  const response = await fetch(url, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch activities");
  }
  
  return response.json();
};

export const getClientActivities = async (clientId: number) => {
  const response = await fetch(`/api/clients/${clientId}/activities`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch client activities");
  }
  
  return response.json();
};

export const getProjectActivities = async (projectId: number) => {
  const response = await fetch(`/api/projects/${projectId}/activities`, {
    credentials: "include",
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch project activities");
  }
  
  return response.json();
};

export const createActivity = async (data: any) => {
  return apiRequest("POST", "/api/activities", data);
};

// AI Assistant API
export interface DesignInsightRequest {
  projectDescription: string;
  clientPreferences?: string;
  budget?: string;
  roomType?: string;
  stylePreferences?: string;
  clientId?: number;
  projectId?: number;
}

export interface DesignInsightResponse {
  suggestions: string[];
  colorPalette: string[];
  materialSuggestions: string[];
  estimatedTimeframe: string;
  budgetBreakdown?: {
    furniture: number;
    materials: number;
    labor: number;
    accessories: number;
    total: number;
  };
}

export const generateDesignInsights = async (data: DesignInsightRequest): Promise<DesignInsightResponse> => {
  const response = await apiRequest("POST", "/api/ai/design-insights", data);
  return response as DesignInsightResponse;
};

export interface FeedbackAnalysisRequest {
  feedback: string;
  clientId?: number;
  projectId?: number;
}

export interface FeedbackAnalysisResponse {
  sentimentScore: number; 
  keyPoints: string[];
  suggestedResponse: string;
}

export const analyzeClientFeedback = async (data: FeedbackAnalysisRequest): Promise<FeedbackAnalysisResponse> => {
  const response = await apiRequest("POST", "/api/ai/analyze-feedback", data);
  return response as FeedbackAnalysisResponse;
};

export interface MoodboardSuggestionRequest {
  style: string;
  colors: string[];
  roomType: string;
  clientId?: number;
  projectId?: number;
}

export interface MoodboardSuggestionResponse {
  imagePrompts: string[];
  textSuggestions: string[];
}

export const generateMoodboardSuggestions = async (data: MoodboardSuggestionRequest): Promise<MoodboardSuggestionResponse> => {
  const response = await apiRequest("POST", "/api/ai/moodboard-suggestions", data);
  return response as MoodboardSuggestionResponse;
};
