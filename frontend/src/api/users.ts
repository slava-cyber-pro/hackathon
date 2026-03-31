import apiClient from "./client";
import type { User } from "@/types";

export async function updateMe(payload: {
  display_name?: string;
  email?: string;
}): Promise<User> {
  const { data } = await apiClient.patch<User>("/users/me", payload);
  return data;
}
