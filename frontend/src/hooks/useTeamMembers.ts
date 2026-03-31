import { useQuery } from "@tanstack/react-query";
import { getMyTeams, getTeamMembers } from "@/api/teams";
import { useAuthStore } from "@/stores/authStore";

export function useMyTeamMembers() {
  const user = useAuthStore((s) => s.user);

  const { data: teams } = useQuery({
    queryKey: ["my-teams"],
    queryFn: getMyTeams,
  });

  const teamId = teams?.[0]?.id;

  const { data: members } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: () => getTeamMembers(teamId!),
    enabled: !!teamId,
  });

  const memberList = members ?? [];
  const myRole = memberList.find((m) => m.user_id === user?.id)?.role;
  const isOwner = myRole === "owner";
  const isAdmin = myRole === "admin";

  return {
    teamId,
    members: memberList,
    hasTeam: !!teamId,
    isOwner,
    isAdmin,
    isOwnerOrAdmin: isOwner || isAdmin,
    myRole: myRole ?? null,
  };
}
