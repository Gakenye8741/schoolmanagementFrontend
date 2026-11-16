import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   DOMAIN TYPES — loose on purpose; extra server fields are kept
   ═══════════════════════════════════════════════════════════════ */

export type BoardingStatus = 'Day' | 'Boarding';
export type PaymentMethod = 'Cash' | 'Bank' | 'M-Pesa';

export interface FeeItem {
  id: string;
  schoolId: string;
  name: string;
  description: string | null;
  isOptional: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface FeeStructure {
  id: string;
  schoolId: string;
  termId: string;
  feeItemId: string;
  boardingStatus: BoardingStatus;
  gradeLevelId: string | null;
  classId: string | null;
  amount: string;
  feeItem?: FeeItem;
  [key: string]: any;
}

export interface Invoice {
  id: string;
  schoolId: string;
  studentId: string;
  termId: string;
  invoiceNumber?: string;
  totalAmount?: string;
  discount?: string;
  amountPaid?: string;
  balance?: string;
  status: string;
  dueDate?: string | null;
  notes?: string | null;
  student?: Record<string, any>;
  items?: any[];
  [key: string]: any;
}

export interface Transaction {
  id: string;
  schoolId: string;
  studentId: string;
  termId: string;
  invoiceId?: string | null;
  amountPaid: string;
  paymentMethod: PaymentMethod;
  referenceCode: string;
  status?: string;
  payerName?: string | null;
  payerPhone?: string | null;
  notes?: string | null;
  createdAt?: string;
  student?: Record<string, any>;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   REQUEST PAYLOADS
   ═══════════════════════════════════════════════════════════════ */

/* ── Fee items ── */
export interface CreateFeeItemInput {
  schoolId: string;
  name: string;
  description?: string | null;
  isOptional?: boolean;
}
export interface BulkCreateFeeItemsInput {
  schoolId: string;
  items: Array<Omit<CreateFeeItemInput, 'schoolId'>>;
}
export interface UpdateFeeItemInput {
  feeItemId: string;
  patch: Partial<Omit<CreateFeeItemInput, 'schoolId'>>;
}

/* ── Fee structures ── */
export interface CreateFeeStructureInput {
  schoolId: string;
  termId: string;
  feeItemId: string;
  boardingStatus: BoardingStatus;
  gradeLevelId?: string | null;
  classId?: string | null;
  amount: string;
}
export interface BulkUpsertFeeStructuresInput {
  schoolId: string;
  termId: string;
  boardingStatus: BoardingStatus;
  gradeLevelId?: string | null;
  classId?: string | null;
  items: Array<{ feeItemId: string; amount: string }>;
}
export interface UpdateFeeStructureInput {
  feeStructureId: string;
  patch: { amount: string };
}
export interface CopyFeeStructuresInput {
  schoolId: string;
  fromTermId: string;
  toTermId: string;
}
export interface SchoolTermParams { schoolId: string; termId: string }
export interface FeesByBoardingParams extends SchoolTermParams { boardingStatus: BoardingStatus }
export interface FeesByGradeParams extends SchoolTermParams { gradeLevelId: string; boardingStatus: BoardingStatus }
export interface FeesByClassParams extends SchoolTermParams { classId: string; boardingStatus: BoardingStatus }

/* ── Invoices ── */
interface InvoiceCommon {
  schoolId: string;
  termId: string;
  dueDate?: string | null;
  notes?: string | null;
}
export interface GenerateStudentInvoiceInput extends InvoiceCommon { studentId: string }
export interface GenerateClassInvoicesInput extends InvoiceCommon { classId: string }
export interface GenerateGradeInvoicesInput extends InvoiceCommon { gradeLevelId: string }
export type GenerateSchoolInvoicesInput = InvoiceCommon;

export interface InvoicesByStudentParams { schoolId: string; studentId: string }
export interface InvoicesByStatusParams { schoolId: string; status: string; termId?: string }
export interface ApplyDiscountInput { invoiceId: string; discount: string }
export interface UpdateInvoiceStatusInput { invoiceId: string; status: string }
export interface WaiveInvoiceInput { invoiceId: string; reason: string }

/* ── Payments ── */
export interface RecordPaymentInput {
  schoolId: string;
  studentId: string;
  termId: string;
  invoiceId?: string | null;
  amountPaid: string;
  paymentMethod: PaymentMethod;
  referenceCode: string;
  payerName?: string | null;
  payerPhone?: string | null;
  mpesaCheckoutRequestId?: string | null;
  notes?: string | null;
}
export interface ReversePaymentInput { transactionId: string; reason: string }
export interface TransactionsByMethodParams { schoolId: string; method: PaymentMethod }
export interface StudentBalanceParams { studentId: string; schoolId: string; termId: string }
export interface StudentStatementParams { studentId: string; schoolId: string }
export interface MpesaLookupParams { schoolId: string; checkoutRequestId: string }

/* ── Reports ── */
export interface DefaultersParams extends SchoolTermParams { minBalance?: number }
export interface DailyReportParams { schoolId: string; date: string }
export interface TrendParams { schoolId: string; days?: number }

/* ═══════════════════════════════════════════════════════════════
   RESPONSE ENVELOPE
   ═══════════════════════════════════════════════════════════════ */

export interface FeesResponse {
  success: boolean;
  message: string;
  feeItem?: FeeItem;
  feeItems?: FeeItem[];
  feeStructure?: FeeStructure;
  feeStructures?: FeeStructure[];
  invoice?: Invoice;
  invoices?: Invoice[];
  transaction?: Transaction;
  transactions?: Transaction[];
  count?: number;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const feesApi = createApi({
  reducerPath: 'feesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/fees`,
    credentials: 'include',
  }),
  tagTypes: ['FeeItems', 'FeeStructures', 'Invoices', 'Payments', 'Balances', 'Reports'],
  endpoints: (builder) => ({

    /* ───────── FEE ITEMS ───────── */

    createFeeItem: builder.mutation<FeesResponse, CreateFeeItemInput>({
      query: (body) => ({ url: '/fee-items', method: 'POST', body }),
      invalidatesTags: ['FeeItems'],
    }),
    bulkCreateFeeItems: builder.mutation<FeesResponse, BulkCreateFeeItemsInput>({
      query: (body) => ({ url: '/fee-items/bulk', method: 'POST', body }),
      invalidatesTags: ['FeeItems'],
    }),
    getFeeItemsBySchool: builder.query<FeesResponse, string>({
      query: (schoolId) => `/fee-items/school/${schoolId}`,
      providesTags: ['FeeItems'],
    }),
    getMandatoryFeeItems: builder.query<FeesResponse, string>({
      query: (schoolId) => `/fee-items/school/${schoolId}/mandatory`,
      providesTags: ['FeeItems'],
    }),
    getOptionalFeeItems: builder.query<FeesResponse, string>({
      query: (schoolId) => `/fee-items/school/${schoolId}/optional`,
      providesTags: ['FeeItems'],
    }),
    searchFeeItems: builder.query<FeesResponse, { schoolId: string; query: string }>({
      query: ({ schoolId, query }) => ({ url: `/fee-items/school/${schoolId}/search`, params: { query } }),
      providesTags: ['FeeItems'],
    }),
    getFeeItemById: builder.query<FeesResponse, string>({
      query: (id) => `/fee-items/${id}`,
      providesTags: ['FeeItems'],
    }),
    updateFeeItem: builder.mutation<FeesResponse, UpdateFeeItemInput>({
      query: ({ feeItemId, patch }) => ({ url: `/fee-items/${feeItemId}`, method: 'PUT', body: patch }),
      invalidatesTags: ['FeeItems', 'FeeStructures'],
    }),
    /** Blocked (400) when the item is referenced by a fee structure. */
    deleteFeeItem: builder.mutation<FeesResponse, string>({
      query: (id) => ({ url: `/fee-items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FeeItems'],
    }),

    /* ───────── FEE STRUCTURES ───────── */

    bulkUpsertFeeStructures: builder.mutation<FeesResponse, BulkUpsertFeeStructuresInput>({
      query: (body) => ({ url: '/fee-structures/bulk-upsert', method: 'POST', body }),
      invalidatesTags: ['FeeStructures'],
    }),
    createFeeStructure: builder.mutation<FeesResponse, CreateFeeStructureInput>({
      query: (body) => ({ url: '/fee-structures', method: 'POST', body }),
      invalidatesTags: ['FeeStructures'],
    }),
    copyFeeStructures: builder.mutation<FeesResponse, CopyFeeStructuresInput>({
      query: (body) => ({ url: '/fee-structures/copy', method: 'POST', body }),
      invalidatesTags: ['FeeStructures'],
    }),
    getFeeStructuresByTerm: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/fee-structures/school/${schoolId}/term/${termId}`,
      providesTags: ['FeeStructures'],
    }),
    getFeeStructuresByBoarding: builder.query<FeesResponse, FeesByBoardingParams>({
      query: ({ schoolId, termId, boardingStatus }) => ({
        url: `/fee-structures/school/${schoolId}/term/${termId}/by-boarding`,
        params: { boardingStatus },
      }),
      providesTags: ['FeeStructures'],
    }),
    getFeeStructuresByGrade: builder.query<FeesResponse, FeesByGradeParams>({
      query: ({ schoolId, termId, gradeLevelId, boardingStatus }) => ({
        url: `/fee-structures/school/${schoolId}/term/${termId}/by-grade`,
        params: { gradeLevelId, boardingStatus },
      }),
      providesTags: ['FeeStructures'],
    }),
    resolveClassFees: builder.query<FeesResponse, FeesByClassParams>({
      query: ({ schoolId, termId, classId, boardingStatus }) => ({
        url: `/fee-structures/school/${schoolId}/term/${termId}/resolve-class`,
        params: { classId, boardingStatus },
      }),
      providesTags: ['FeeStructures'],
    }),
    getClassFeeTotal: builder.query<FeesResponse, FeesByClassParams>({
      query: ({ schoolId, termId, classId, boardingStatus }) => ({
        url: `/fee-structures/school/${schoolId}/term/${termId}/class-total`,
        params: { classId, boardingStatus },
      }),
      providesTags: ['FeeStructures'],
    }),
    validateFeeStructures: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/fee-structures/school/${schoolId}/term/${termId}/validate`,
      providesTags: ['FeeStructures'],
    }),
    getFeeStructureById: builder.query<FeesResponse, string>({
      query: (id) => `/fee-structures/${id}`,
      providesTags: ['FeeStructures'],
    }),
    updateFeeStructure: builder.mutation<FeesResponse, UpdateFeeStructureInput>({
      query: ({ feeStructureId, patch }) => ({ url: `/fee-structures/${feeStructureId}`, method: 'PUT', body: patch }),
      invalidatesTags: ['FeeStructures'],
    }),
    deleteFeeStructure: builder.mutation<FeesResponse, string>({
      query: (id) => ({ url: `/fee-structures/${id}`, method: 'DELETE' }),
      invalidatesTags: ['FeeStructures'],
    }),

    /* ───────── INVOICES ───────── */

    generateStudentInvoice: builder.mutation<FeesResponse, GenerateStudentInvoiceInput>({
      query: (body) => ({ url: '/invoices/generate/student', method: 'POST', body }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    generateClassInvoices: builder.mutation<FeesResponse, GenerateClassInvoicesInput>({
      query: (body) => ({ url: '/invoices/generate/class', method: 'POST', body }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    generateGradeInvoices: builder.mutation<FeesResponse, GenerateGradeInvoicesInput>({
      query: (body) => ({ url: '/invoices/generate/grade-level', method: 'POST', body }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    generateSchoolInvoices: builder.mutation<FeesResponse, GenerateSchoolInvoicesInput>({
      query: (body) => ({ url: '/invoices/generate/school', method: 'POST', body }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    getInvoicesByTerm: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/invoices/school/${schoolId}/term/${termId}`,
      providesTags: ['Invoices'],
    }),
    getInvoicesByStudent: builder.query<FeesResponse, InvoicesByStudentParams>({
      query: ({ schoolId, studentId }) => `/invoices/school/${schoolId}/student/${studentId}`,
      providesTags: ['Invoices'],
    }),
    getInvoicesByStatus: builder.query<FeesResponse, InvoicesByStatusParams>({
      query: ({ schoolId, status, termId }) => ({
        url: `/invoices/school/${schoolId}/status`,
        params: { status, ...(termId ? { termId } : {}) },
      }),
      providesTags: ['Invoices'],
    }),
    getInvoiceById: builder.query<FeesResponse, string>({
      query: (id) => `/invoices/${id}`,
      providesTags: ['Invoices'],
    }),
    applyInvoiceDiscount: builder.mutation<FeesResponse, ApplyDiscountInput>({
      query: ({ invoiceId, discount }) => ({ url: `/invoices/${invoiceId}/discount`, method: 'PATCH', body: { discount } }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    updateInvoiceStatus: builder.mutation<FeesResponse, UpdateInvoiceStatusInput>({
      query: ({ invoiceId, status }) => ({ url: `/invoices/${invoiceId}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    waiveInvoice: builder.mutation<FeesResponse, WaiveInvoiceInput>({
      query: ({ invoiceId, reason }) => ({ url: `/invoices/${invoiceId}/waive`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    markOverdueInvoices: builder.mutation<FeesResponse, string>({
      query: (schoolId) => ({ url: `/invoices/mark-overdue/${schoolId}`, method: 'POST' }),
      invalidatesTags: ['Invoices', 'Reports'],
    }),
    /** Blocked (400) when the invoice has payments. */
    deleteInvoice: builder.mutation<FeesResponse, string>({
      query: (id) => ({ url: `/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),

    /* ───────── PAYMENTS ───────── */

    recordPayment: builder.mutation<FeesResponse, RecordPaymentInput>({
      query: (body) => ({ url: '/payments/record', method: 'POST', body }),
      invalidatesTags: ['Payments', 'Invoices', 'Balances', 'Reports'],
    }),
    getTransactionsByStudent: builder.query<FeesResponse, InvoicesByStudentParams>({
      query: ({ schoolId, studentId }) => `/payments/school/${schoolId}/student/${studentId}`,
      providesTags: ['Payments'],
    }),
    getTransactionsByTerm: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/payments/school/${schoolId}/term/${termId}`,
      providesTags: ['Payments'],
    }),
    getTransactionsByInvoice: builder.query<FeesResponse, string>({
      query: (invoiceId) => `/payments/invoice/${invoiceId}`,
      providesTags: ['Payments'],
    }),
    getTransactionsByMethod: builder.query<FeesResponse, TransactionsByMethodParams>({
      query: ({ schoolId, method }) => ({ url: `/payments/school/${schoolId}/by-method`, params: { method } }),
      providesTags: ['Payments'],
    }),
    getTransactionById: builder.query<FeesResponse, string>({
      query: (id) => `/payments/${id}`,
      providesTags: ['Payments'],
    }),
    reversePayment: builder.mutation<FeesResponse, ReversePaymentInput>({
      query: ({ transactionId, reason }) => ({ url: `/payments/${transactionId}/reverse`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Payments', 'Invoices', 'Balances', 'Reports'],
    }),
    getMpesaPending: builder.query<FeesResponse, string>({
      query: (schoolId) => `/payments/school/${schoolId}/mpesa-pending`,
      providesTags: ['Payments'],
    }),
    lookupMpesaPayment: builder.query<FeesResponse, MpesaLookupParams>({
      query: ({ schoolId, checkoutRequestId }) => ({
        url: `/payments/school/${schoolId}/mpesa-lookup`,
        params: { checkoutRequestId },
      }),
      providesTags: ['Payments'],
    }),

    /* ───────── STUDENT BALANCE / STATEMENT ───────── */

    getStudentBalance: builder.query<FeesResponse, StudentBalanceParams>({
      query: ({ studentId, schoolId, termId }) => ({ url: `/students/${studentId}/balance`, params: { schoolId, termId } }),
      providesTags: ['Balances'],
    }),
    getStudentStatement: builder.query<FeesResponse, StudentStatementParams>({
      query: ({ studentId, schoolId }) => ({ url: `/students/${studentId}/statement`, params: { schoolId } }),
      providesTags: ['Balances'],
    }),

    /* ───────── REPORTS ───────── */

    getTermSummary: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/summary`,
      providesTags: ['Reports'],
    }),
    getCollectionsByMethod: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/by-method`,
      providesTags: ['Reports'],
    }),
    getCollectionsByBoarding: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/by-boarding`,
      providesTags: ['Reports'],
    }),
    getCollectionsByGrade: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/by-grade`,
      providesTags: ['Reports'],
    }),
    getAgingReport: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/aging`,
      providesTags: ['Reports'],
    }),
    getExpectedVsCollected: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/expected-vs-collected`,
      providesTags: ['Reports'],
    }),
    getDefaulters: builder.query<FeesResponse, DefaultersParams>({
      query: ({ schoolId, termId, minBalance }) => ({
        url: `/reports/school/${schoolId}/term/${termId}/defaulters`,
        params: minBalance ? { minBalance } : undefined,
      }),
      providesTags: ['Reports'],
    }),
    getClearedStudents: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/cleared`,
      providesTags: ['Reports'],
    }),
    getDailyCollections: builder.query<FeesResponse, DailyReportParams>({
      query: ({ schoolId, date }) => ({ url: `/reports/school/${schoolId}/daily`, params: { date } }),
      providesTags: ['Reports'],
    }),
    getCollectionTrend: builder.query<FeesResponse, TrendParams>({
      query: ({ schoolId, days = 30 }) => ({ url: `/reports/school/${schoolId}/trend`, params: { days } }),
      providesTags: ['Reports'],
    }),
    recomputeInvoices: builder.mutation<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => ({ url: `/reports/school/${schoolId}/term/${termId}/recompute-invoices`, method: 'POST' }),
      invalidatesTags: ['Invoices', 'Balances', 'Reports'],
    }),
    getFeeDashboard: builder.query<FeesResponse, SchoolTermParams>({
      query: ({ schoolId, termId }) => `/reports/school/${schoolId}/term/${termId}/dashboard`,
      providesTags: ['Reports'],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  useCreateFeeItemMutation,
  useBulkCreateFeeItemsMutation,
  useGetFeeItemsBySchoolQuery,
  useGetMandatoryFeeItemsQuery,
  useGetOptionalFeeItemsQuery,
  useSearchFeeItemsQuery,
  useGetFeeItemByIdQuery,
  useUpdateFeeItemMutation,
  useDeleteFeeItemMutation,

  useBulkUpsertFeeStructuresMutation,
  useCreateFeeStructureMutation,
  useCopyFeeStructuresMutation,
  useGetFeeStructuresByTermQuery,
  useGetFeeStructuresByBoardingQuery,
  useGetFeeStructuresByGradeQuery,
  useResolveClassFeesQuery,
  useGetClassFeeTotalQuery,
  useValidateFeeStructuresQuery,
  useLazyValidateFeeStructuresQuery,
  useGetFeeStructureByIdQuery,
  useUpdateFeeStructureMutation,
  useDeleteFeeStructureMutation,

  useGenerateStudentInvoiceMutation,
  useGenerateClassInvoicesMutation,
  useGenerateGradeInvoicesMutation,
  useGenerateSchoolInvoicesMutation,
  useGetInvoicesByTermQuery,
  useGetInvoicesByStudentQuery,
  useGetInvoicesByStatusQuery,
  useGetInvoiceByIdQuery,
  useApplyInvoiceDiscountMutation,
  useUpdateInvoiceStatusMutation,
  useWaiveInvoiceMutation,
  useMarkOverdueInvoicesMutation,
  useDeleteInvoiceMutation,

  useRecordPaymentMutation,
  useGetTransactionsByStudentQuery,
  useGetTransactionsByTermQuery,
  useGetTransactionsByInvoiceQuery,
  useGetTransactionsByMethodQuery,
  useGetTransactionByIdQuery,
  useReversePaymentMutation,
  useGetMpesaPendingQuery,
  useLookupMpesaPaymentQuery,

  useGetStudentBalanceQuery,
  useGetStudentStatementQuery,

  useGetTermSummaryQuery,
  useGetCollectionsByMethodQuery,
  useGetCollectionsByBoardingQuery,
  useGetCollectionsByGradeQuery,
  useGetAgingReportQuery,
  useGetExpectedVsCollectedQuery,
  useGetDefaultersQuery,
  useGetClearedStudentsQuery,
  useGetDailyCollectionsQuery,
  useGetCollectionTrendQuery,
  useRecomputeInvoicesMutation,
  useGetFeeDashboardQuery,
} = feesApi;