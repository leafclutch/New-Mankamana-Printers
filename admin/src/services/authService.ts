import { LoginPayload, LoginResponse } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const loginUser = async (
  credentials: LoginPayload
): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();

  if (!response.ok) {
    // If the server returns a specific error message, use it. Otherwise, use a default.
    throw new Error(data.message || 'Login failed. Please check your credentials.');
  }

  return data;
};
