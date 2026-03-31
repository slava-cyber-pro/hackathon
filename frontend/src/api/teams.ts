import apiClient from "./client";
import type { Team, TeamMember } from "@/types";

export async function getMyTeams(): Promise<Team[]> {
  const { data } = await apiClient.get<Team[]>("/teams");
  return data;
}

export async function getTeam(id: string): Promise<Team> {
  const { data } = await apiClient.get<Team>(`/teams/${id}`);
  return data;
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const { data } = await apiClient.get<TeamMember[]>(`/teams/${teamId}/members`);
  return data;
}

export async function createTeam(name: string): Promise<Team> {
  const { data } = await apiClient.post<Team>("/teams", { name });
  return data;
}

export async function inviteMember(teamId: string, email: string, role: string): Promise<void> {
  await apiClient.post(`/teams/${teamId}/invite`, { email, role });
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await apiClient.delete(`/teams/${teamId}/members/${userId}`);
}

export async function leaveTeam(teamId: string): Promise<void> {
  await apiClient.post(`/teams/${teamId}/leave`);
}
