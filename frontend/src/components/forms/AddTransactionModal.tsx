import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DatePicker from "@/components/ui/DatePicker";
import CategoryPicker from "./CategoryPicker";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { cn } from "@/utils/cn";
import type { TransactionType } from "@/types";

interface AddTransactionModalProps {
  open: boolean;
  onClose: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function AddTransactionModal({ open, onClose }: AddTransactionModalProps) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ amount?: string; category?: string }>({});

  const { data: categories = [], isLoading: catLoading } = useCategories();
  const createCategory = useCreateCategory();
  const createTx = useCreateTransaction();

  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategoryId(null);
    setDate(today);
    setDescription("");
    setErrors({});
  };

  const handleClose = () => { resetForm(); onClose(); };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!amount || parseFloat(amount) <= 0) next.amount = "Amount must be greater than 0";
    if (!categoryId) next.category = "Select a category";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createTx.mutate(
      { category_id: categoryId!, type, amount: parseFloat(amount), description: description || undefined, date },
      { onSuccess: handleClose },
    );
  };

  const handleAddCategory = (name: string) => {
    createCategory.mutate({ name }, { onSuccess: (cat) => setCategoryId(cat.id) });
  };

  const pill = (value: TransactionType, label: string) => (
    <button
      type="button"
      onClick={() => setType(value)}
      className={cn(
        "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
        type === value
          ? value === "income"
            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700",
      )}
    >
      {label}
    </button>
  );

  return (
    <Modal open={open} onClose={handleClose} title="Add Transaction">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex gap-1 rounded-lg border border-gray-200 p-1 dark:border-gray-700">
          {pill("income", "Income")}
          {pill("expense", "Expense")}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={cn(
                "w-full rounded-lg border bg-white py-2 pl-8 pr-3 text-2xl font-semibold text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-primary-500",
                "dark:bg-gray-800 dark:text-gray-100",
                errors.amount ? "border-red-500" : "border-gray-300 dark:border-gray-600",
              )}
            />
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <CategoryPicker
            categories={categories}
            selectedId={categoryId}
            onSelect={setCategoryId}
            loading={catLoading}
            onAddCategory={handleAddCategory}
          />
          {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
        </div>

        <DatePicker label="Date" value={date} onChange={setDate} />
        <Input id="tx-desc" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />

        <Button type="submit" className="w-full" disabled={createTx.isPending}>
          {createTx.isPending ? "Saving..." : "Save Transaction"}
        </Button>
      </form>
    </Modal>
  );
}
