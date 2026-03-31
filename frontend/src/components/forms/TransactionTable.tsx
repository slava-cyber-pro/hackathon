import Card from "@/components/ui/Card";
import Badge, { type BadgeColor } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { Transaction } from "@/types";

/** Stable color rotation keyed by category name */
const BADGE_COLORS: BadgeColor[] = ["green", "amber", "blue", "purple", "red", "teal", "gray"];
const colorCache = new Map<string, BadgeColor>();

export function categoryColor(name: string): BadgeColor {
  if (!colorCache.has(name)) {
    colorCache.set(name, BADGE_COLORS[colorCache.size % BADGE_COLORS.length]);
  }
  return colorCache.get(name)!;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  formatCurrency?: (amount: number) => string;
}

const thCls = "whitespace-nowrap px-6 py-3 font-medium text-gray-500 dark:text-gray-400";
const signedAmount = (tx: Transaction) => (tx.type === "expense" ? -tx.amount : tx.amount);
const amtCls = (n: number) => cn("font-semibold", n >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400");

const bold = "font-medium text-gray-900 dark:text-gray-100";

function Pagination({ page, totalPages, totalItems, count, onPageChange }: {
  page: number; totalPages: number; totalItems: number; count: number;
  onPageChange?: (p: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * Math.ceil(totalItems / totalPages) + 1;
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing <span className={bold}>{start}-{start + count - 1}</span> of <span className={bold}>{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

const icons = { edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", delete: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" };

const defaultFmtCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function TransactionTable({ transactions, onDelete, page = 1, totalPages = 1, totalItems, onPageChange, formatCurrency }: TransactionTableProps) {
  const fmt = formatCurrency ?? defaultFmtCurrency;
  const fmtAmt = (n: number) => `${n >= 0 ? "+" : ""}${fmt(Math.abs(n))}`;
  const total = totalItems ?? transactions.length;

  return (
    <>
      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              {["Date", "User", "Description", "Category"].map((h) => <th key={h} className={thCls}>{h}</th>)}
              <th className={cn(thCls, "text-right")}>Amount</th>
              <th className={cn(thCls, "text-right")}>Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{transactions.map((tx) => {
              const amt = signedAmount(tx);
              const catName = tx.category?.name ?? "Uncategorized";
              return (
                <tr key={tx.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(tx.date)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">{tx.user_name ?? ""}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{tx.description ?? ""}</td>
                  <td className="px-6 py-4"><Badge color={categoryColor(catName)}>{catName}</Badge></td>
                  <td className={cn("whitespace-nowrap px-6 py-4 text-right", amtCls(amt))}>{fmtAmt(amt)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icons.edit} /></svg></Button>
                      <Button variant="ghost" size="sm" onClick={() => onDelete?.(tx.id)}><svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={icons.delete} /></svg></Button>
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
        <div className="border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <Pagination page={page} totalPages={totalPages} totalItems={total} count={transactions.length} onPageChange={onPageChange} />
        </div>
      </Card>

      <div className="space-y-3 md:hidden">
        {transactions.map((tx) => {
          const amt = signedAmount(tx);
          const catName = tx.category?.name ?? "Uncategorized";
          return (
            <Card key={tx.id} className="flex items-center gap-3 px-4 py-3">
              <span className={cn("h-2.5 w-2.5 flex-shrink-0 rounded-full", tx.type === "income" ? "bg-green-500" : "bg-red-500")} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{tx.description ?? ""}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(tx.date)} &middot; {catName}{tx.user_name ? ` \u00b7 ${tx.user_name}` : ""}</p>
              </div>
              <span className={cn("flex-shrink-0 text-sm", amtCls(amt))}>{fmtAmt(amt)}</span>
            </Card>
          );
        })}
        <div className="pt-2">
          <Pagination page={page} totalPages={totalPages} totalItems={total} count={transactions.length} onPageChange={onPageChange} />
        </div>
      </div>
    </>
  );
}
