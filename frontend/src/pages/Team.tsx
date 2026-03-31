import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";
import { getMyTeams, getTeamMembers, createTeam as apiCreateTeam, removeMember, leaveTeam } from "@/api/teams";
import InviteMemberModal from "@/components/forms/InviteMemberModal";
import { useAuthStore } from "@/stores/authStore";
import type { Team as TeamType, TeamRole } from "@/types";

const roleBadgeColor: Record<TeamRole, BadgeColor> = { owner: "teal", admin: "blue", member: "gray" };
const avatarColors = ["bg-primary-500", "bg-blue-500", "bg-purple-500", "bg-amber-500", "bg-green-500"];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function TeamView({ team, onChanged }: { team: TeamType; onChanged: () => void }) {
  const [showInvite, setShowInvite] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members", team.id],
    queryFn: () => getTeamMembers(team.id),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["team-members", team.id] });
    queryClient.invalidateQueries({ queryKey: ["my-teams"] });
  }, [team.id, queryClient]);

  const kick = useMutation({
    mutationFn: (userId: string) => removeMember(team.id, userId),
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: () => leaveTeam(team.id),
    onSuccess: () => { invalidate(); onChanged(); },
  });

  const handleInviteClose = useCallback(() => {
    setShowInvite(false);
    invalidate();
  }, [invalidate]);

  const memberList = members ?? [];
  const myMembership = memberList.find((m) => m.user_id === currentUser?.id);
  const canKick = myMembership?.role === "owner" || myMembership?.role === "admin";

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.name}</h2>
        <div className="flex gap-2">
          {myMembership && myMembership.role !== "owner" && (
            <Button size="sm" variant="danger" onClick={() => leave.mutate()} disabled={leave.isPending}>
              {leave.isPending ? "Leaving..." : "Leave Team"}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowInvite(true)}>Invite Member</Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="py-8 text-center text-gray-500">Loading members...</Card>
      ) : (
        <div className="space-y-3">
          {memberList.map((m, idx) => {
            const isMe = m.user_id === currentUser?.id;
            const showKick = canKick && !isMe && m.role !== "owner";
            return (
              <Card key={m.user_id} className="flex items-center gap-4">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", avatarColors[idx % avatarColors.length])}>
                  {getInitials(m.display_name ?? m.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {m.display_name}{isMe && " (you)"}
                    </span>
                    <Badge color={roleBadgeColor[m.role]}>{m.role}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{m.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Joined {new Date(m.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  {showKick && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => kick.mutate(m.user_id)}
                      disabled={kick.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <InviteMemberModal open={showInvite} onClose={handleInviteClose} teamId={team.id} />
    </>
  );
}

export default function Team() {
  const [teamName, setTeamName] = useState("My Household");
  const [activeIdx, setActiveIdx] = useState(0);
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({ queryKey: ["my-teams"], queryFn: getMyTeams });

  const createTeam = useMutation({
    mutationFn: (name: string) => apiCreateTeam(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-teams"] }),
  });

  const handleChanged = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["my-teams"] });
    const team = teams?.[activeIdx];
    if (team) queryClient.invalidateQueries({ queryKey: ["team-members", team.id] });
  }, [teams, activeIdx, queryClient]);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" /></div>;
  }

  const teamList = teams ?? [];
  const activeTeam = teamList[activeIdx] ?? null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Teams</h1>
      </div>

      {/* Team tabs if multiple */}
      {teamList.length > 1 && (
        <div className="flex gap-2">
          {teamList.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                i === activeIdx
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400",
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {/* Active team or create prompt */}
      {activeTeam ? (
        <TeamView team={activeTeam} onChanged={handleChanged} />
      ) : (
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">No team yet</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a team to collaborate on budgets and track spending together.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              <Button onClick={() => createTeam.mutate(teamName)} disabled={createTeam.isPending || !teamName.trim()}>
                {createTeam.isPending ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
