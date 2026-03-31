export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  is_default: boolean;
  user_id: string | null;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  user_name?: string;
  team_id: string | null;
  category_id: string;
  category: Category;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  is_recurring: boolean;
  recurrence_rule: string | null;
  created_at: string;
}

export type InvestmentCategory =
  | "stocks"
  | "bonds"
  | "crypto"
  | "real_estate"
  | "mutual_funds"
  | "etfs"
  | "custom";

export interface Investment {
  id: string;
  user_id: string;
  user_name?: string;
  team_id: string | null;
  category: InvestmentCategory;
  name: string;
  ticker?: string;
  quantity?: number;
  purchase_price?: number;
  amount_invested: number;
  current_value: number;
  expected_return_pct: number;
  income_allocation_pct: number;
  created_at: string;
  updated_at: string;
}

export type BudgetPeriod = "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export interface Budget {
  id: string;
  user_id: string | null;
  user_name?: string;
  team_id: string | null;
  is_team_budget?: boolean;
  category_id: string | null;
  category_name: string;
  category_icon: string | null;
  amount_limit: number;
  period: BudgetPeriod;
  period_start: string;
  period_end: string | null;
  spent?: number;
  created_at: string;
}

export type TeamRole = "owner" | "admin" | "member";

export interface TeamMember {
  user_id: string;
  role: TeamRole;
  joined_at: string;
  display_name: string;
  email: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string;
  members: TeamMember[];
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
