const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("qp_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const apiSignup = (email, password, name) =>
  request("/api/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });

export const apiLogin = (email, password) =>
  request("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// ── Templates ─────────────────────────────────────────────────────────────────

export const apiGetTemplates = (userId) =>
  request(`/api/templates/${userId}`);

export const apiCreateTemplate = (formData) =>
  request("/api/templates", { method: "POST", body: formData });

export const apiProcessTemplate = (templateId) =>
  request(`/api/process-template/${templateId}`, { method: "POST" });

export const apiGetTemplateResults = (templateId) =>
  request(`/api/template-results/${templateId}`);

// ── Question Papers ───────────────────────────────────────────────────────────

export const apiUploadQuestionPapers = (formData) =>
  request("/api/upload-question-papers", { method: "POST", body: formData });

export const apiGetQPResults = (templateId) =>
  request(`/api/question-paper-results/${templateId}`);

// ── Generate ──────────────────────────────────────────────────────────────────

export const apiGenerate = (templateId, customInstructions, layoutId) =>
  request("/api/generate", {
    method: "POST",
    body: JSON.stringify({
      template_id: templateId,
      custom_instructions: customInstructions || undefined,
      layout_id: layoutId || "default",
    }),
  });

export const apiGetGeneratedPapers = (templateId) =>
  request(`/generated/${templateId}`);

export const apiGetGeneratedPaper = (generationId) =>
  request(`/generated/paper/${generationId}`);

// ── Template Layout ───────────────────────────────────────────────────────────

export const apiSaveLayout = (templateId, layout) =>
  request(`/api/template-layout/${templateId}`, {
    method: "POST",
    body: JSON.stringify({ layout }),
  });

export const apiGetLayout = (templateId) =>
  request(`/api/template-layout/${templateId}`);

// ── Template Config ───────────────────────────────────────────────────────────

export const apiSaveConfig = (templateId, config) =>
  request(`/api/template-config/${templateId}`, {
    method: "POST",
    body: JSON.stringify({ config }),
  });

export const apiGetConfig = (templateId) =>
  request(`/api/template-config/${templateId}`);
