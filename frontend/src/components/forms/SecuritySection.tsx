import Card, { CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export interface SecuritySectionProps {
  lastChanged?: string;
}

export default function SecuritySection({
  lastChanged = "2 weeks ago",
}: SecuritySectionProps) {
  return (
    <Card>
      <CardTitle>Security</CardTitle>

      <div className="mt-6 flex flex-col gap-4">
        <Input
          id="currentPassword"
          label="Current Password"
          type="password"
          placeholder="Enter current password"
        />
        <Input
          id="newPassword"
          label="New Password"
          type="password"
          placeholder="Enter new password"
        />
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
        />
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Password last changed: {lastChanged}
        </p>
      </div>
    </Card>
  );
}
