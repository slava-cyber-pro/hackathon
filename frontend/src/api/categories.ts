import apiClient from "./client";
import type { Category } from "@/types";

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function createCategory(payload: {
  name: string;
  icon?: string;
}): Promise<Category> {
  const { data } = await apiClient.post<Category>("/categories", payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
