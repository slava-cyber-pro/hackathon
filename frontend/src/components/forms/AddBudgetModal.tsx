import { useState, useMemo, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import DatePicker from "@/components/ui/DatePicker";
import { useCreateBudget } from "@/hooks/useBudgets";
import { useCategories } from "@/hooks/useCategories";

const periodOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function firstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  teamId?: string;
}

export default function AddBudgetModal({ open, onClose, teamId }: Props) {
  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState(firstOfMonth);

  const create = useCreateBudget();
  const { data: categories } = useCategories();

  const isTeamBudget = !!teamId;

  const categoryOptions = useMemo(() => {
    const opts = [{ value: "", label: "General (all categories)" }];
    categories?.forEach((c) => opts.push({ value: c.id, label: `${c.icon ?? ""} ${c.name}`.trim() }));
    return opts;
  }, [categories]);

  const reset = () => {
    setCategoryId("");
    setAmountLimit("");
    setPeriod("monthly");
    setStartDate(firstOfMonth());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (Number(amountLimit) <= 0) return;

    create.mutate(
      {
        ...(categoryId ? { category_id: categoryId } : {}),
        amount_limit: Number(amountLimit),
        period,
        period_start: startDate,
        ...(isTeamBudget ? { team_id: teamId } : {}),
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal open={open} onClose={handleClose} title={isTeamBudget ? "Set Team Budget Limit" : "Set Budget Limit"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {isTeamBudget && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            This budget will apply to the entire team.
          </p>
        )}
        <Select label="Category" id="budget-cat" options={categoryOptions} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
        <Input label="Amount Limit" id="budget-amount" type="number" required min={0.01} step="any" value={amountLimit} onChange={(e) => setAmountLimit(e.target.value)} />
        <Select label="Period" id="budget-period" options={periodOptions} value={period} onChange={(e) => setPeriod(e.target.value)} />
        <DatePicker label="Start Date" value={startDate} onChange={setStartDate} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : isTeamBudget ? "Set Team Limit" : "Set Limit"}</Button>
        </div>
      </form>
    </Modal>
  );
}
