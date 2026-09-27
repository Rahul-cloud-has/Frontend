// ============================================
// 🌐 API Configuration - ProSkillHub
// ============================================
// d

// Base URL - set REACT_APP_API_URL in production (e.g. Vercel env var
// pointing at the Render backend); falls back to local dev otherwise.
export const API_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8001/api";

// ============================================
// 🔑 Common API Config
// Automatically Token Add
// ============================================

export const apiConfig = () => {
  const token = localStorage.getItem("access_token");

  return {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token && {
        Authorization: `Bearer ${token}`,
      }),
    },
  };
};

// ============================================
// GET
// ============================================

export const getData = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    ...apiConfig(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
};

// ============================================
// POST
// ============================================

export const postData = async (endpoint, data) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    ...apiConfig(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
};

// ============================================
// PUT
// ============================================

export const putData = async (endpoint, data) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    ...apiConfig(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.json();
};

// ============================================
// DELETE
// ============================================

export const deleteData = async (endpoint) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
    ...apiConfig(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return true;
  }

  return await response.json();
};

// ============================================
// Default Export
// ============================================

const api = {
  API_URL,
  apiConfig,
  getData,
  postData,
  putData,
  deleteData,
};

export default api;