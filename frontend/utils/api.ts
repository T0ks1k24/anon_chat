const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function register(username: string, password: string) {
  const res = await fetch(`${API_URL}/users/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API_URL}/users/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  const data = await res.json();
  
  if (data.access) {
    localStorage.setItem("anon_token", data.access);
    localStorage.setItem("anon_username", username);
  }
  
  return data;
}

export function getToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("anon_token");
  }
  return null;
}

export function getUsername() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("anon_username");
  }
  return null;
}

export function logout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("anon_token");
    localStorage.removeItem("anon_username");
  }
}
