import { useState } from "react";
import Card, { CardTitle } from "@/components/ui/Card";
import Toggle from "@/components/ui/Toggle";

export interface NotificationsSectionProps {
  defaultBudgetWarnings?: boolean;
  defaultWeeklySummary?: boolean;
  defaultTeamAlerts?: boolean;
  defaultNewMember?: boolean;
}

export default function NotificationsSection({
  defaultBudgetWarnings = true,
  defaultWeeklySummary = true,
  defaultTeamAlerts = false,
  defaultNewMember = true,
}: NotificationsSectionProps) {
  const [budgetWarnings, setBudgetWarnings] = useState(defaultBudgetWarnings);
  const [weeklySummary, setWeeklySummary] = useState(defaultWeeklySummary);
  const [teamAlerts, setTeamAlerts] = useState(defaultTeamAlerts);
  const [newMember, setNewMember] = useState(defaultNewMember);

  return (
    <Card>
      <CardTitle>Notifications</CardTitle>

      <div className="mt-6 flex flex-col gap-5">
        <Toggle
          checked={budgetWarnings}
          onChange={setBudgetWarnings}
          label="Budget limit warnings"
        />
        <Toggle
          checked={weeklySummary}
          onChange={setWeeklySummary}
          label="Weekly summary email"
        />
        <Toggle
          checked={teamAlerts}
          onChange={setTeamAlerts}
          label="Team activity alerts"
        />
        <Toggle
          checked={newMember}
          onChange={setNewMember}
          label="New member joined"
        />
      </div>
    </Card>
  );
}
