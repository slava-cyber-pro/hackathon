import { useEffect, useState } from "react";
import Card, { CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { User } from "@/types";

export interface ProfileSectionProps {
  user?: User | null;
  onSave?: (payload: { display_name?: string; email?: string }) => void;
  saving?: boolean;
}

export default function ProfileSection({ user, onSave, saving = false }: ProfileSectionProps) {
  const [name, setName] = useState(user?.display_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  useEffect(() => {
    setName(user?.display_name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.display_name, user?.email]);

  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const hasChanges = name.trim() !== (user?.display_name ?? "") || email.trim() !== (user?.email ?? "");

  const handleSave = () => {
    if (!onSave || !hasChanges) return;
    const payload: { display_name?: string; email?: string } = {};
    if (name.trim() !== (user?.display_name ?? "")) payload.display_name = name.trim();
    if (email.trim() !== (user?.email ?? "")) payload.email = email.trim();
    onSave(payload);
  };

  return (
    <Card>
      <CardTitle>Profile</CardTitle>
      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xl font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {initials}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <Input id="displayName" label="Display Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {onSave && (
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges || !name.trim()}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
