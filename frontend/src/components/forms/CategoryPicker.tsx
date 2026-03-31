import { useState } from "react";
import { cn } from "@/utils/cn";
import type { Category } from "@/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface CategoryPickerProps {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
  onAddCategory?: (name: string) => void;
}

export default function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  loading,
  onAddCategory,
}: CategoryPickerProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");

  if (loading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading categories...</p>;
  }

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed || !onAddCategory) return;
    onAddCategory(trimmed);
    setNewName("");
    setShowAdd(false);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              selectedId === cat.id
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300"
                : "border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300",
            )}
          >
            {cat.icon && <span>{cat.icon}</span>}
            <span className="truncate">{cat.name}</span>
          </button>
        ))}
      </div>

      {onAddCategory && !showAdd && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          + Add custom
        </button>
      )}

      {onAddCategory && showAdd && (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name"
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setNewName(""); }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
