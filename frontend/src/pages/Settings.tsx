import { useCallback } from "react";
import ProfileSection from "@/components/forms/ProfileSection";
import SecuritySection from "@/components/forms/SecuritySection";
import NotificationsSection from "@/components/forms/NotificationsSection";
import TelegramSection from "@/components/forms/TelegramSection";
import AppearanceSection from "@/components/forms/AppearanceSection";
import { useAuthStore } from "@/stores/authStore";
import { updateMe } from "@/api/users";
import { useMutation } from "@tanstack/react-query";

function Settings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const updateProfile = useMutation({
    mutationFn: updateMe,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
    },
  });

  const handleSaveProfile = useCallback(
    (payload: { display_name?: string; email?: string }) => {
      updateProfile.mutate(payload);
    },
    [updateProfile],
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your account preferences
        </p>
      </div>

      <ProfileSection
        user={user}
        onSave={handleSaveProfile}
        saving={updateProfile.isPending}
      />
      <SecuritySection />
      <NotificationsSection />
      <TelegramSection />
      <AppearanceSection />
    </div>
  );
}

export default Settings;
