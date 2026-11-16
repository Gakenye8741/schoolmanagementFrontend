import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type TermStatus = 'upcoming' | 'active' | 'completed' | 'archived' | string;

export type WindowType =
  | 'mid_term_break'
  | 'cat_week'
  | 'exam_week'
  | 'registration_deadline'
  | string;

export interface AcademicTerm {
  id: string;
  schoolId: string;
  academicYear: string;
  termName: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  isCurrentTerm: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TermWindow {
  id: string;
  termId: string;
  windowType: WindowType;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicTermWithWindows extends AcademicTerm {
  windows: TermWindow[];
}

/* ── Response shapes ───────────────────────────────────────── */

export interface TermsListResponse {
  success: boolean;
  count: number;
  terms: AcademicTerm[];
}

export interface SingleTermResponse {
  success: boolean;
  message: string;
  term: AcademicTerm;
}

export interface TermWithWindowsResponse {
  success: boolean;
  term: AcademicTermWithWindows;
}

export interface WindowsListResponse {
  success: boolean;
  count: number;
  windows: TermWindow[];
}

export interface SingleWindowResponse {
  success: boolean;
  message: string;
  window: TermWindow;
}

export interface CountResponse {
  success: boolean;
  count: number;
}

export interface YearsResponse {
  success: boolean;
  years: string[];
}

export interface ReadinessResponse {
  success: boolean;
  ready: boolean;
  issues?: string[];
  [key: string]: any;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/* ── Request payloads ──────────────────────────────────────── */

export interface CreateTermInput {
  schoolId: string;
  academicYear: string;
  termName: string;
  startDate: string;
  endDate: string;
  status?: TermStatus;
  isCurrentTerm?: boolean;
}

export interface UpdateTermInput {
  termId: string;
  patch: Partial<AcademicTerm>;
}

export interface CreateWindowInput {
  termId: string;
  windowType: WindowType;
  title: string;
  startDate: string;
  endDate: string;
}

export interface UpdateWindowInput {
  windowId: string;
  patch: Partial<TermWindow>;
}

export interface BulkCreateWindowsInput {
  termId: string;
  windows: Array<Omit<CreateWindowInput, 'termId'>>;
}

export interface CopyWindowsInput {
  sourceTermId: string;
  targetTermId: string;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const termApi = createApi({
  reducerPath: 'termApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api`,
    credentials: 'include',
  }),
  tagTypes: [
    'Terms',
    'TermDetail',
    'CurrentTerm',
    'TermWindows',
    'TermWindowDetail',
    'TermYears',
    'TermReadiness',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════
       ACADEMIC TERM — CRUD (1–6)
       ═══════════════════════════════════════════ */

    /** 1. POST /terms — create a new academic term */
    createTerm: builder.mutation<SingleTermResponse, CreateTermInput>({
      query: (body) => ({ url: '/terms', method: 'POST', body }),
      invalidatesTags: ['Terms', 'CurrentTerm', 'TermYears'],
    }),

    /** 2. GET /terms/school/{schoolId} — list all terms for a school */
    getTermsBySchoolId: builder.query<TermsListResponse, string>({
      query: (schoolId) => `/terms/school/${schoolId}`,
      providesTags: ['Terms'],
    }),

    /** 3. GET /terms/school/{schoolId}/current — current active term */
    getCurrentTermBySchoolId: builder.query<SingleTermResponse, string>({
      query: (schoolId) => `/terms/school/${schoolId}/current`,
      providesTags: ['CurrentTerm'],
    }),

    /** 4. GET /terms/{termId} — single term */
    getTermById: builder.query<SingleTermResponse, string>({
      query: (termId) => `/terms/${termId}`,
      providesTags: (_r, _e, termId) => [{ type: 'TermDetail', id: termId }],
    }),

    /** 5. PUT /terms/{termId} — update a term */
    updateTerm: builder.mutation<SingleTermResponse, UpdateTermInput>({
      query: ({ termId, patch }) => ({
        url: `/terms/${termId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { termId }) => [
        { type: 'TermDetail', id: termId },
        'Terms',
        'CurrentTerm',
      ],
    }),

    /** 6. DELETE /terms/{termId} — delete a term (Super Admin) */
    deleteTerm: builder.mutation<GenericResponse, string>({
      query: (termId) => ({ url: `/terms/${termId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, termId) => [
        { type: 'TermDetail', id: termId },
        'Terms',
        'CurrentTerm',
        'TermWindows',
        'TermYears',
      ],
    }),

    /* ═══════════════════════════════════════════
       ACADEMIC TERM — ADVANCED READS (7–13)
       ═══════════════════════════════════════════ */

    /** 7. GET /terms/{termId}/with-windows */
    getTermWithWindows: builder.query<TermWithWindowsResponse, string>({
      query: (termId) => `/terms/${termId}/with-windows`,
      providesTags: (_r, _e, termId) => [
        { type: 'TermDetail', id: termId },
        { type: 'TermWindows', id: termId },
      ],
    }),

    /** 8. GET /terms/school/{schoolId}/by-year?academicYear=2026 */
    getTermsByYear: builder.query<
      TermsListResponse,
      { schoolId: string; academicYear: string }
    >({
      query: ({ schoolId, academicYear }) => ({
        url: `/terms/school/${schoolId}/by-year`,
        params: { academicYear },
      }),
      providesTags: ['Terms'],
    }),

    /** 9. GET /terms/school/{schoolId}/years — distinct years */
    getTermYears: builder.query<YearsResponse, string>({
      query: (schoolId) => `/terms/school/${schoolId}/years`,
      providesTags: ['TermYears'],
    }),

    /** 10. GET /terms/school/{schoolId}/current/with-windows */
    getCurrentTermWithWindows: builder.query<TermWithWindowsResponse, string>({
      query: (schoolId) => `/terms/school/${schoolId}/current/with-windows`,
      providesTags: ['CurrentTerm', 'TermWindows'],
    }),

    /** 11. GET /terms/school/{schoolId}/by-status?status=active */
    getTermsByStatus: builder.query<
      TermsListResponse,
      { schoolId: string; status: TermStatus }
    >({
      query: ({ schoolId, status }) => ({
        url: `/terms/school/${schoolId}/by-status`,
        params: { status },
      }),
      providesTags: ['Terms'],
    }),

    /** 12. GET /terms/school/{schoolId}/count */
    countTermsBySchool: builder.query<CountResponse, string>({
      query: (schoolId) => `/terms/school/${schoolId}/count`,
      providesTags: ['Terms'],
    }),

    /** 13. GET /terms/school/{schoolId}/lookup?academicYear=&termName= */
    lookupTerm: builder.query<
      SingleTermResponse,
      { schoolId: string; academicYear: string; termName: string }
    >({
      query: ({ schoolId, academicYear, termName }) => ({
        url: `/terms/school/${schoolId}/lookup`,
        params: { academicYear, termName },
      }),
      providesTags: ['Terms'],
    }),

    /* ═══════════════════════════════════════════
       ACADEMIC TERM — STATE TRANSITIONS (14–18)
       ═══════════════════════════════════════════ */

    /** 14. POST /terms/school/{schoolId}/current — set current term */
    setCurrentTerm: builder.mutation<
      GenericResponse,
      { schoolId: string; termId: string }
    >({
      query: ({ schoolId, termId }) => ({
        url: `/terms/school/${schoolId}/current`,
        method: 'POST',
        body: { termId },
      }),
      invalidatesTags: ['Terms', 'CurrentTerm', 'TermDetail'],
    }),

    /** 15. DELETE /terms/school/{schoolId}/current — clear current term */
    clearCurrentTerm: builder.mutation<GenericResponse, string>({
      query: (schoolId) => ({
        url: `/terms/school/${schoolId}/current`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Terms', 'CurrentTerm'],
    }),

    /** 16. PATCH /terms/{termId}/status — change status */
    changeTermStatus: builder.mutation<
      SingleTermResponse,
      { termId: string; status: TermStatus }
    >({
      query: ({ termId, status }) => ({
        url: `/terms/${termId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_r, _e, { termId }) => [
        { type: 'TermDetail', id: termId },
        'Terms',
        'CurrentTerm',
      ],
    }),

    /** 17. POST /terms/{termId}/archive */
    archiveTerm: builder.mutation<SingleTermResponse, string>({
      query: (termId) => ({
        url: `/terms/${termId}/archive`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, termId) => [
        { type: 'TermDetail', id: termId },
        'Terms',
        'CurrentTerm',
      ],
    }),

    /** 18. GET /terms/{termId}/readiness */
    getTermReadiness: builder.query<ReadinessResponse, string>({
      query: (termId) => `/terms/${termId}/readiness`,
      providesTags: (_r, _e, termId) => [
        { type: 'TermReadiness', id: termId },
      ],
    }),

    /* ═══════════════════════════════════════════
       TERM WINDOWS — CRUD (19–26)
       ═══════════════════════════════════════════ */

    /** 19. POST /terms/windows — create a term window */
    createTermWindow: builder.mutation<SingleWindowResponse, CreateWindowInput>({
      query: (body) => ({ url: '/terms/windows', method: 'POST', body }),
      invalidatesTags: (_r, _e, { termId }) => [
        { type: 'TermWindows', id: termId },
        'TermWindows',
      ],
    }),

    /** 20. GET /terms/windows/{windowId} — single window */
    getTermWindowById: builder.query<SingleWindowResponse, string>({
      query: (windowId) => `/terms/windows/${windowId}`,
      providesTags: (_r, _e, windowId) => [
        { type: 'TermWindowDetail', id: windowId },
      ],
    }),

    /** 21. GET /terms/{termId}/windows — all windows for a term */
    getWindowsByTermId: builder.query<WindowsListResponse, string>({
      query: (termId) => `/terms/${termId}/windows`,
      providesTags: (_r, _e, termId) => [{ type: 'TermWindows', id: termId }],
    }),

    /** 22. GET /terms/{termId}/windows/by-type?windowType= */
    getWindowsByTermAndType: builder.query<
      WindowsListResponse,
      { termId: string; windowType: WindowType }
    >({
      query: ({ termId, windowType }) => ({
        url: `/terms/${termId}/windows/by-type`,
        params: { windowType },
      }),
      providesTags: (_r, _e, { termId }) => [{ type: 'TermWindows', id: termId }],
    }),

    /** 23. GET /terms/{termId}/windows/count */
    countWindowsByTerm: builder.query<CountResponse, string>({
      query: (termId) => `/terms/${termId}/windows/count`,
      providesTags: (_r, _e, termId) => [{ type: 'TermWindows', id: termId }],
    }),

    /** 24. PUT /terms/windows/{windowId} — update a window */
    updateTermWindow: builder.mutation<SingleWindowResponse, UpdateWindowInput>({
      query: ({ windowId, patch }) => ({
        url: `/terms/windows/${windowId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { windowId }) => [
        { type: 'TermWindowDetail', id: windowId },
        'TermWindows',
      ],
    }),

    /** 25. DELETE /terms/windows/{windowId} — delete single window */
    deleteTermWindow: builder.mutation<GenericResponse, string>({
      query: (windowId) => ({
        url: `/terms/windows/${windowId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, windowId) => [
        { type: 'TermWindowDetail', id: windowId },
        'TermWindows',
      ],
    }),

    /** 26. DELETE /terms/{termId}/windows — delete ALL windows for a term */
    deleteAllWindowsForTerm: builder.mutation<GenericResponse, string>({
      query: (termId) => ({
        url: `/terms/${termId}/windows`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, termId) => [
        { type: 'TermWindows', id: termId },
        'TermWindows',
      ],
    }),

    /* ═══════════════════════════════════════════
       TERM WINDOWS — ADVANCED (27–30)
       ═══════════════════════════════════════════ */

    /** 27. GET /terms/school/{schoolId}/windows/active?onDate= */
    getActiveWindowsForSchool: builder.query<
      WindowsListResponse,
      { schoolId: string; onDate: string }
    >({
      query: ({ schoolId, onDate }) => ({
        url: `/terms/school/${schoolId}/windows/active`,
        params: { onDate },
      }),
      providesTags: ['TermWindows'],
    }),

    /** 28. GET /terms/school/{schoolId}/windows/upcoming?daysAhead= */
    getUpcomingWindowsForSchool: builder.query<
      WindowsListResponse,
      { schoolId: string; daysAhead?: number }
    >({
      query: ({ schoolId, daysAhead = 30 }) => ({
        url: `/terms/school/${schoolId}/windows/upcoming`,
        params: { daysAhead },
      }),
      providesTags: ['TermWindows'],
    }),

    /** 29. POST /terms/windows/copy — copy windows between terms */
    copyTermWindows: builder.mutation<GenericResponse, CopyWindowsInput>({
      query: (body) => ({
        url: '/terms/windows/copy',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { sourceTermId, targetTermId }) => [
        { type: 'TermWindows', id: sourceTermId },
        { type: 'TermWindows', id: targetTermId },
        'TermWindows',
      ],
    }),

    /** 30. POST /terms/windows/bulk — bulk create windows */
    bulkCreateTermWindows: builder.mutation<
      WindowsListResponse,
      BulkCreateWindowsInput
    >({
      query: (body) => ({
        url: '/terms/windows/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { termId }) => [
        { type: 'TermWindows', id: termId },
        'TermWindows',
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT — ALL 30 ENDPOINTS
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── 1–6 : CRUD ── */
  useCreateTermMutation,
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
  useGetTermByIdQuery,
  useUpdateTermMutation,
  useDeleteTermMutation,

  /* ── 7–13 : Advanced reads ── */
  useGetTermWithWindowsQuery,
  useGetTermsByYearQuery,
  useGetTermYearsQuery,
  useGetCurrentTermWithWindowsQuery,
  useGetTermsByStatusQuery,
  useCountTermsBySchoolQuery,
  useLookupTermQuery,

  /* ── 14–18 : State transitions ── */
  useSetCurrentTermMutation,
  useClearCurrentTermMutation,
  useChangeTermStatusMutation,
  useArchiveTermMutation,
  useGetTermReadinessQuery,

  /* ── 19–26 : Windows CRUD ── */
  useCreateTermWindowMutation,
  useGetTermWindowByIdQuery,
  useGetWindowsByTermIdQuery,
  useGetWindowsByTermAndTypeQuery,
  useCountWindowsByTermQuery,
  useUpdateTermWindowMutation,
  useDeleteTermWindowMutation,
  useDeleteAllWindowsForTermMutation,

  /* ── 27–30 : Windows advanced ── */
  useGetActiveWindowsForSchoolQuery,
  useGetUpcomingWindowsForSchoolQuery,
  useCopyTermWindowsMutation,
  useBulkCreateTermWindowsMutation,
} = termApi;