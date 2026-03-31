import { useMemo, useRef, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useFormatCurrency } from "@/hooks/useFormatCurrency";
import { cn } from "@/utils/cn";
import TransactionTable from "@/components/forms/TransactionTable";
import AddTransactionModal from "@/components/forms/AddTransactionModal";
import { useTransactions, useDeleteTransaction } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useMyTeamMembers } from "@/hooks/useTeamMembers";
import DateRangeFilter from "@/components/ui/DateRangeFilter";

const PAGE_SIZE = 20;

type TypeFilter = "all" | "income" | "expense";

export default function Transactions() {
  const formatCurrency = useFormatCurrency();
  const [showAddModal, setShowAddModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data: categories = [] } = useCategories();
  const { members, hasTeam } = useMyTeamMembers();

  // Debounce search
  const searchTimerRef = useRef<number>(0);
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const params = useMemo(() => ({
    page,
    size: PAGE_SIZE,
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    ...(searchDebounced ? { search: searchDebounced } : {}),
    ...(selectedCategories.length === 1 ? { category_id: selectedCategories[0] } : {}),
    ...(selectedUserId ? { user_id: selectedUserId } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  }), [page, typeFilter, searchDebounced, selectedCategories, selectedUserId, dateFrom, dateTo]);

  const { data, isLoading, isError } = useTransactions(params);
  const deleteMutation = useDeleteTransaction();

  const transactions = data?.items ?? [];
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(String(t.amount)), 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(String(t.amount)), 0);
  const net = totalIncome - totalExpenses;

  const handleTypeChange = (f: TypeFilter) => { setTypeFilter(f); setPage(1); };
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
    setPage(1);
  };

  const typePill = (value: TypeFilter, label: string) => (
    <button
      key={value}
      onClick={() => handleTypeChange(value)}
      className={cn(
        "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
        typeFilter === value
          ? "bg-primary-600 text-white dark:bg-primary-500"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700",
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transactions</h1>
        <Button onClick={() => setShowAddModal(true)}>+ Add Transaction</Button>
      </div>

      {/* Filters */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex gap-1">
          {typePill("all", "All")}
          {typePill("income", "Income")}
          {typePill("expense", "Expense")}
        </div>

        {/* User filter dropdown */}
        {hasTeam && (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            >
              {selectedUserId ? members.find((m) => m.user_id === selectedUserId)?.display_name ?? "Member" : "All members"} ▾
            </button>
            {userDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-60 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => { setSelectedUserId(undefined); setUserDropdownOpen(false); setPage(1); }}
                  className={cn(
                    "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700",
                    !selectedUserId ? "font-medium text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  All members
                </button>
                {members.map((m) => (
                  <button
                    key={m.user_id}
                    onClick={() => { setSelectedUserId(m.user_id); setUserDropdownOpen(false); setPage(1); }}
                    className={cn(
                      "w-full rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700",
                      selectedUserId === m.user_id ? "font-medium text-primary-600 dark:text-primary-400" : "text-gray-700 dark:text-gray-300",
                    )}
                  >
                    {m.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category dropdown */}
        <div className="relative">
          <button
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          >
            Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`} ▾
          </button>
          {catDropdownOpen && (
            <div className="absolute z-20 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {categories.map((cat) => (
                <label key={cat.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="rounded border-gray-300 text-primary-600"
                  />
                  <span>{cat.icon}</span>
                  <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                </label>
              ))}
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => { setSelectedCategories([]); setPage(1); }}
                  className="mt-1 w-full rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <Input placeholder="Search description..." value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
      </Card>

      <DateRangeFilter
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={(v) => { setDateFrom(v); setPage(1); }}
        onDateToChange={(v) => { setDateTo(v); setPage(1); }}
        onClear={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">↑</div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
            <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">↓</div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">$</div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Net</p>
            <p className={cn("text-lg font-semibold", net >= 0 ? "text-green-600" : "text-red-600")}>{formatCurrency(net)}</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card className="py-12 text-center text-gray-500">Loading...</Card>
      ) : isError ? (
        <Card className="py-12 text-center text-red-500">Failed to load transactions</Card>
      ) : transactions.length === 0 ? (
        <Card className="py-12 text-center text-gray-500">No transactions yet</Card>
      ) : (
        <TransactionTable
          transactions={transactions}
          onDelete={(id) => deleteMutation.mutate(id)}
          page={data?.page ?? 1}
          totalPages={data?.pages ?? 1}
          totalItems={data?.total ?? 0}
          onPageChange={setPage}
          formatCurrency={formatCurrency}
        />
      )}

      <AddTransactionModal open={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
