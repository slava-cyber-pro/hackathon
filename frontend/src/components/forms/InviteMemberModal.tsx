import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { inviteMember } from "@/api/teams";
import axios from "axios";

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  teamId: string;
}

const roleOptions = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteMemberModal({ open, onClose, teamId }: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setEmail(""); setRole("member"); setError(""); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      await inviteMember(teamId, email, role);
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) setError("No user found with this email");
        else if (status === 409) setError("This user is already a team member");
        else setError("Failed to send invite. Please try again.");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="invite-email"
          label="Email"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error || undefined}
          required
        />
        <Select
          id="invite-role"
          label="Role"
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Inviting..." : "Send Invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
