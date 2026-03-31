import apiClient from "./client";
import type { AuthTokens, User } from "@/types";

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login", { email, password });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function register(
  email: string,
  password: string,
  display_name: string,
): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/register", {
    email,
    password,
    display_name,
  });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>("/users/me");
  return data;
}
