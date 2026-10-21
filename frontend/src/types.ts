export type TransactionType = "income" | "expense";

export type Transaction = {
  id: number;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
};

export type NewTransaction = Omit<Transaction, "id" | "created_at">;

export type Summary = {
  income: number;
  expense: number;
  balance: number;
  byCategory: { category: string; total: number }[];
};

export type TransactionFilters = {
  type: "" | TransactionType;
  category: string;
  from: string;
  to: string;
  q: string;
};

export type TransactionPage = {
  items: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
