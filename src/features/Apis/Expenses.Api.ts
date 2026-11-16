import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type ExpenseCategory =
  | 'Utilities'
  | 'Salary'
  | 'Maintenance'
  | 'Supplies'
  | 'Transport'
  | string;

export type PaymentMethod = 'Bank' | 'Cash' | 'M-Pesa' | string;

export interface Expense {
  id: string;
  schoolId: string;
  title: string;
  category: ExpenseCategory;
  amount: string;
  paymentMethod: PaymentMethod;
  referenceCode?: string | null;
  expenseDate: string;
  isApproved: boolean;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/* ── Request payloads ────────────────────────────────────────── */

export interface CreateExpenseInput {
  schoolId: string;
  title: string;
  category: ExpenseCategory;
  amount: string | number;
  paymentMethod: PaymentMethod;
  referenceCode?: string;
  expenseDate: string;
}

export interface BulkCreateExpensesInput {
  schoolId: string;
  expenses: Array<Omit<CreateExpenseInput, 'schoolId'>>;
}

export interface UpdateExpenseInput {
  expenseId: string;
  patch: Partial<Omit<CreateExpenseInput, 'schoolId'>>;
}

export interface ListExpensesParams {
  schoolId: string;
  approved?: boolean;
}

export interface ListExpensesByCategoryParams {
  schoolId: string;
  category: ExpenseCategory;
}

export interface ListExpensesByDateRangeParams {
  schoolId: string;
  fromDate: string;
  toDate: string;
}

export interface SummaryParams {
  schoolId: string;
  fromDate?: string;
  toDate?: string;
}

export interface MonthlyTrendParams {
  schoolId: string;
  months?: number;
}

export interface TopCategoriesParams {
  schoolId: string;
  limit?: number;
}

export interface FeeComparisonParams {
  schoolId: string;
  fromDate?: string;
  toDate?: string;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface SingleExpenseResponse {
  success: boolean;
  message?: string;
  expense: Expense;
  [key: string]: any;
}

export interface ExpenseListResponse {
  success: boolean;
  count?: number;
  expenses: Expense[];
  [key: string]: any;
}

export interface BulkCreateExpensesResponse {
  success: boolean;
  message?: string;
  count?: number;
  inserted?: number;
  skipped?: number;
  expenses?: Expense[];
  [key: string]: any;
}

export interface ExpenseSummaryResponse {
  success: boolean;
  summary: {
    total?: number;
    approved?: number;
    pending?: number;
    byCategory?: Record<string, number>;
    byPaymentMethod?: Record<string, number>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MonthlyTrendPoint {
  month: string;
  total?: number;
  amount?: number;
  count?: number;
  [key: string]: any;
}

export interface MonthlyTrendResponse {
  success: boolean;
  trend: MonthlyTrendPoint[];
  [key: string]: any;
}

export interface CategoryBreakdownItem {
  category: string;
  total?: number;
  amount?: number;
  count?: number;
  percentage?: number;
  [key: string]: any;
}

export interface CategoryBreakdownResponse {
  success: boolean;
  breakdown: CategoryBreakdownItem[];
  [key: string]: any;
}

export interface TopCategoriesResponse {
  success: boolean;
  categories: CategoryBreakdownItem[];
  [key: string]: any;
}

export interface FeeComparisonResponse {
  success: boolean;
  comparison: {
    totalFees?: number;
    totalExpenses?: number;
    net?: number;
    margin?: number;
    byMonth?: Array<{
      month: string;
      fees?: number;
      expenses?: number;
      net?: number;
      [k: string]: any;
    }>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const expensesApi = createApi({
  reducerPath: 'expensesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/expenses`,
    credentials: 'include',
  }),
  tagTypes: [
    'Expenses',
    'ExpenseDetail',
    'PendingApprovals',
    'ExpenseSummary',
    'MonthlyTrend',
    'CategoryBreakdown',
    'TopCategories',
    'FeeComparison',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════════
       RECORD EXPENSES (1.1 – 1.6)
       ═══════════════════════════════════════════════════════════ */

    /** 1.1–1.5 POST /expenses */
    createExpense: builder.mutation<SingleExpenseResponse, CreateExpenseInput>({
      query: (body: CreateExpenseInput) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Expenses',
        'PendingApprovals',
        'ExpenseSummary',
        'MonthlyTrend',
        'CategoryBreakdown',
        'TopCategories',
        'FeeComparison',
      ],
    }),

    /** 1.6 POST /expenses/bulk */
    bulkCreateExpenses: builder.mutation<
      BulkCreateExpensesResponse,
      BulkCreateExpensesInput
    >({
      query: (body: BulkCreateExpensesInput) => ({
        url: '/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Expenses',
        'PendingApprovals',
        'ExpenseSummary',
        'MonthlyTrend',
        'CategoryBreakdown',
        'TopCategories',
        'FeeComparison',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       READS (2.1 – 2.6)
       ═══════════════════════════════════════════════════════════ */

    /** 2.1 GET /expenses/{expenseId} */
    getExpenseById: builder.query<SingleExpenseResponse, string>({
      query: (expenseId: string) => `/${expenseId}`,
      providesTags: (_r, _e, expenseId: string) => [
        { type: 'ExpenseDetail', id: expenseId },
      ],
    }),

    /** 2.2 / 2.6 GET /expenses/school/{schoolId}?approved= */
    getExpensesBySchool: builder.query<ExpenseListResponse, ListExpensesParams>({
      query: (arg: ListExpensesParams) => ({
        url: `/school/${arg.schoolId}`,
        params: arg.approved !== undefined ? { approved: arg.approved } : {},
      }),
      providesTags: ['Expenses'],
    }),

    /** 2.3 GET /expenses/school/{schoolId}/category/{category} */
    getExpensesByCategory: builder.query<
      ExpenseListResponse,
      ListExpensesByCategoryParams
    >({
      query: (arg: ListExpensesByCategoryParams) =>
        `/school/${arg.schoolId}/category/${encodeURIComponent(arg.category)}`,
      providesTags: ['Expenses'],
    }),

    /** 2.4 GET /expenses/school/{schoolId}/by-date-range?fromDate=&toDate= */
    getExpensesByDateRange: builder.query<
      ExpenseListResponse,
      ListExpensesByDateRangeParams
    >({
      query: (arg: ListExpensesByDateRangeParams) => ({
        url: `/school/${arg.schoolId}/by-date-range`,
        params: { fromDate: arg.fromDate, toDate: arg.toDate },
      }),
      providesTags: ['Expenses'],
    }),

    /** 2.5 GET /expenses/school/{schoolId}/pending-approval */
    getPendingApprovals: builder.query<ExpenseListResponse, string>({
      query: (schoolId: string) => `/school/${schoolId}/pending-approval`,
      providesTags: ['PendingApprovals', 'Expenses'],
    }),

    /* ═══════════════════════════════════════════════════════════
       APPROVALS (3.1 – 3.3)
       ═══════════════════════════════════════════════════════════ */

    /** 3.1 / 3.3 PATCH /expenses/{expenseId}/approve */
    approveExpense: builder.mutation<SingleExpenseResponse, string>({
      query: (expenseId: string) => ({
        url: `/${expenseId}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, expenseId: string) => [
        { type: 'ExpenseDetail', id: expenseId },
        'Expenses',
        'PendingApprovals',
        'ExpenseSummary',
        'FeeComparison',
      ],
    }),

    /** 3.2 PATCH /expenses/{expenseId}/revoke-approval */
    revokeApproval: builder.mutation<SingleExpenseResponse, string>({
      query: (expenseId: string) => ({
        url: `/${expenseId}/revoke-approval`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, expenseId: string) => [
        { type: 'ExpenseDetail', id: expenseId },
        'Expenses',
        'PendingApprovals',
        'ExpenseSummary',
        'FeeComparison',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       UPDATES (4.1 – 4.2)
       ═══════════════════════════════════════════════════════════ */

    /** 4.1 / 4.2 PUT /expenses/{expenseId} */
    updateExpense: builder.mutation<SingleExpenseResponse, UpdateExpenseInput>({
      query: (arg: UpdateExpenseInput) => ({
        url: `/${arg.expenseId}`,
        method: 'PUT',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdateExpenseInput) => [
        { type: 'ExpenseDetail', id: arg.expenseId },
        'Expenses',
        'PendingApprovals',
        'ExpenseSummary',
        'MonthlyTrend',
        'CategoryBreakdown',
        'TopCategories',
        'FeeComparison',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       ANALYTICS (5.1 – 5.8)
       ═══════════════════════════════════════════════════════════ */

    /** 5.1 / 5.2 GET /expenses/school/{schoolId}/summary?fromDate=&toDate= */
    getExpenseSummary: builder.query<ExpenseSummaryResponse, SummaryParams>({
      query: (arg: SummaryParams) => ({
        url: `/school/${arg.schoolId}/summary`,
        params: {
          ...(arg.fromDate ? { fromDate: arg.fromDate } : {}),
          ...(arg.toDate ? { toDate: arg.toDate } : {}),
        },
      }),
      providesTags: ['ExpenseSummary'],
    }),

    /** 5.3 / 5.4 GET /expenses/school/{schoolId}/monthly-trend?months= */
    getMonthlyTrend: builder.query<MonthlyTrendResponse, MonthlyTrendParams>({
      query: (arg: MonthlyTrendParams) => ({
        url: `/school/${arg.schoolId}/monthly-trend`,
        params: arg.months !== undefined ? { months: arg.months } : {},
      }),
      providesTags: ['MonthlyTrend'],
    }),

    /** 5.5 GET /expenses/school/{schoolId}/category-breakdown */
    getCategoryBreakdown: builder.query<CategoryBreakdownResponse, string>({
      query: (schoolId: string) => `/school/${schoolId}/category-breakdown`,
      providesTags: ['CategoryBreakdown'],
    }),

    /** 5.6 GET /expenses/school/{schoolId}/top-categories?limit= */
    getTopCategories: builder.query<TopCategoriesResponse, TopCategoriesParams>({
      query: (arg: TopCategoriesParams) => ({
        url: `/school/${arg.schoolId}/top-categories`,
        params: arg.limit !== undefined ? { limit: arg.limit } : {},
      }),
      providesTags: ['TopCategories'],
    }),

    /** 5.7 / 5.8 GET /expenses/school/{schoolId}/fee-comparison?fromDate=&toDate= */
    getFeeComparison: builder.query<FeeComparisonResponse, FeeComparisonParams>({
      query: (arg: FeeComparisonParams) => ({
        url: `/school/${arg.schoolId}/fee-comparison`,
        params: {
          ...(arg.fromDate ? { fromDate: arg.fromDate } : {}),
          ...(arg.toDate ? { toDate: arg.toDate } : {}),
        },
      }),
      providesTags: ['FeeComparison'],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Record ── */
  useCreateExpenseMutation,
  useBulkCreateExpensesMutation,

  /* ── Reads ── */
  useGetExpenseByIdQuery,
  useGetExpensesBySchoolQuery,
  useGetExpensesByCategoryQuery,
  useGetExpensesByDateRangeQuery,
  useGetPendingApprovalsQuery,

  /* ── Approvals ── */
  useApproveExpenseMutation,
  useRevokeApprovalMutation,

  /* ── Update ── */
  useUpdateExpenseMutation,

  /* ── Analytics ── */
  useGetExpenseSummaryQuery,
  useGetMonthlyTrendQuery,
  useGetCategoryBreakdownQuery,
  useGetTopCategoriesQuery,
  useGetFeeComparisonQuery,
} = expensesApi;