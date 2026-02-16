const API_BASE_URL = "http://localhost:8000";

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  // Merge default headers with options.headers
  const headers = {
    ...options.headers,
  };

  // If body is an object (and not FormData), stringify it? 
  // No, let the caller handle stringify if they want flexible fetch.
  // But typically JSON is default.
  
  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error("API Fetch Error:", err);
    throw err;
  }
}
