import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

/**
 * A single report card for a student in a specific term.
 *
 * Notes on backend validation rules (from negative tests §6):
 *  • `meanScore` must be between 0 and 100 (test 6.4 rejects "150.00").
 *  • `schoolId` must be a valid UUID (test 6.2 rejects "not-a-uuid").
 *  • Generation requires the term's exams to be published (test 6.1 → 400).
 */
export interface ReportCard {
  id: string;
  schoolId: string;
  studentId: string;
  termId: string;
  classId?: string | null;

  /* Academic results */
  meanScore?: number | string | null;
  totalMarks?: number | null;
  totalPoints?: number | null;
  grade?: string | null;
  position?: number | null;
  outOf?: number | null;

  /* Attendance */
  attendanceDays?: number | null;
  totalSchoolDays?: number | null;

  /* Remarks */
  classTeacherRemarks?: string | null;
  principalRemarks?: string | null;

  /* Per-subject breakdown (shape depends on backend join) */
  subjectResults?: ReportCardSubjectResult[];

  /* Publication state */
  isPublished?: boolean;
  publishedAt?: string | null;
  generatedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  /* Optionally expanded relations */
  student?: any;
  class?: any;
  term?: any;
  [key: string]: any;
}

export interface ReportCardSubjectResult {
  subjectId: string;
  subjectName?: string;
  marks?: number | null;
  grade?: string | null;
  points?: number | null;
  remarks?: string | null;
  [key: string]: any;
}

/* ── Request payloads ────────────────────────────────────────── */

/** 1.1 / 1.2 — Preview without saving. Optional remarks can be echoed back. */
export interface PreviewReportCardInput {
  schoolId: string;
  studentId: string;
  termId: string;
  classTeacherRemarks?: string;
  principalRemarks?: string;
}

/** 2.1 — Generate for one student */
export interface GenerateReportCardInput {
  schoolId: string;
  studentId: string;
  termId: string;
}

/** 2.2 — Generate for a whole class */
export interface GenerateClassReportCardsInput {
  schoolId: string;
  classId: string;
  termId: string;
}

/** 2.3 — Generate for a whole school */
export interface GenerateSchoolReportCardsInput {
  schoolId: string;
  termId: string;
}

/** 4.1 — Update remarks only */
export interface UpdateReportCardRemarksInput {
  reportCardId: string;
  classTeacherRemarks?: string;
  principalRemarks?: string;
}

/**
 * 4.2 — Admin correction of computed fields.
 * `meanScore` must be a number or a numeric string in the range 0–100.
 * Extra keys are allowed so new overridable fields don't require a code change.
 */
export interface OverrideReportCardInput {
  reportCardId: string;
  meanScore?: number | string;
  attendanceDays?: number;
  totalMarks?: number;
  totalPoints?: number;
  grade?: string;
  position?: number;
  outOf?: number;
  [key: string]: any;
}

/** 5.2 — Publish all report cards for a class in a term */
export interface PublishClassReportCardsInput {
  schoolId: string;
  classId: string;
  termId: string;
}

/* ── Query params ────────────────────────────────────────────── */

/** 3.2 — Get by student + term */
export interface StudentTermParams {
  studentId: string;
  termId: string;
}

/** 3.3 — List all terms for a student */
export interface StudentAllTermsParams {
  schoolId: string;
  studentId: string;
}

/** 3.4 — List class report cards for a term */
export interface ClassTermParams {
  schoolId: string;
  classId: string;
  termId: string;
}

/** 3.5 — List all report cards for a term */
export interface SchoolTermParams {
  schoolId: string;
  termId: string;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface ReportCardResponse {
  success: boolean;
  message?: string;
  reportCard?: ReportCard;
  /** Some endpoints return `data` instead of `reportCard`. */
  data?: ReportCard;
  [key: string]: any;
}

export interface ReportCardListResponse {
  success: boolean;
  count?: number;
  reportCards?: ReportCard[];
  /** Alternate key names the backend may use. */
  cards?: ReportCard[];
  records?: ReportCard[];
  data?: ReportCard[];
  [key: string]: any;
}

/** Response of any of the `generate*` endpoints — could be a single card or many. */
export interface GenerateReportCardsResponse {
  success: boolean;
  message?: string;
  count?: number;
  reportCard?: ReportCard;
  reportCards?: ReportCard[];
  cards?: ReportCard[];
  [key: string]: any;
}

/**
 * 3.6 — Render-ready data (used to build the PDF).
 * Usually a report card plus denormalised school / class / student / term info.
 */
export interface ReportCardRenderDataResponse {
  success: boolean;
  data?: Record<string, any>;
  reportCard?: ReportCard;
  school?: Record<string, any>;
  student?: Record<string, any>;
  class?: Record<string, any>;
  term?: Record<string, any>;
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

export const reportCardsApi = createApi({
  reducerPath: 'reportCardsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/report-cards`,
    credentials: 'include',
  }),
  tagTypes: [
    'ReportCards',
    'ReportCardDetail',
    'StudentReportCards',
    'ClassReportCards',
    'TermReportCards',
    'ReportCardRenderData',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════════
       1. PREVIEW (no writes)
       ═══════════════════════════════════════════════════════════ */

    /** 1.1 / 1.2 — Preview a report card without saving */
    previewReportCard: builder.mutation<
      ReportCardResponse,
      PreviewReportCardInput
    >({
      query: (body) => ({
        url: '/preview',
        method: 'POST',
        body,
      }),
      // Preview doesn't touch persistent state.
    }),

    /* ═══════════════════════════════════════════════════════════
       2. GENERATE
       ═══════════════════════════════════════════════════════════ */

    /** 2.1 — Generate for one student */
    generateReportCard: builder.mutation<
      ReportCardResponse,
      GenerateReportCardInput
    >({
      query: (body) => ({
        url: '/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'ReportCards',
        { type: 'StudentReportCards', id: arg.studentId },
      ],
    }),

    /** 2.2 — Generate for a whole class */
    generateClassReportCards: builder.mutation<
      GenerateReportCardsResponse,
      GenerateClassReportCardsInput
    >({
      query: (body) => ({
        url: '/generate/class',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'ReportCards',
        'StudentReportCards',
        { type: 'ClassReportCards', id: `${arg.classId}::${arg.termId}` },
        { type: 'TermReportCards', id: `${arg.schoolId}::${arg.termId}` },
      ],
    }),

    /** 2.3 — Generate for the whole school */
    generateSchoolReportCards: builder.mutation<
      GenerateReportCardsResponse,
      GenerateSchoolReportCardsInput
    >({
      query: (body) => ({
        url: '/generate/school',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'ReportCards',
        'StudentReportCards',
        'ClassReportCards',
        { type: 'TermReportCards', id: `${arg.schoolId}::${arg.termId}` },
      ],
    }),

    /** 2.4 — Regenerate one report card from the latest data */
    regenerateReportCard: builder.mutation<ReportCardResponse, string>({
      query: (reportCardId) => ({
        url: `/${reportCardId}/regenerate`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, reportCardId) => [
        { type: 'ReportCardDetail', id: reportCardId },
        'ReportCards',
        'StudentReportCards',
        'ClassReportCards',
        'TermReportCards',
        { type: 'ReportCardRenderData', id: reportCardId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       3. READS
       ═══════════════════════════════════════════════════════════ */

    /** 3.1 — Get one report card by ID */
    getReportCardById: builder.query<ReportCardResponse, string>({
      query: (reportCardId) => `/${reportCardId}`,
      providesTags: (_r, _e, reportCardId) => [
        { type: 'ReportCardDetail', id: reportCardId },
      ],
    }),

    /** 3.2 — Get by student + term */
    getReportCardByStudentTerm: builder.query<
      ReportCardResponse,
      StudentTermParams
    >({
      query: ({ studentId, termId }) => `/student/${studentId}/term/${termId}`,
      providesTags: (_r, _e, { studentId, termId }) => [
        { type: 'StudentReportCards', id: `${studentId}::${termId}` },
      ],
    }),

    /** 3.3 — All report cards for a student (every term) */
    getStudentReportCards: builder.query<
      ReportCardListResponse,
      StudentAllTermsParams
    >({
      query: ({ schoolId, studentId }) =>
        `/school/${schoolId}/student/${studentId}`,
      providesTags: (_r, _e, { studentId }) => [
        { type: 'StudentReportCards', id: studentId },
      ],
    }),

    /** 3.4 — All report cards for a class in a term */
    getClassReportCards: builder.query<
      ReportCardListResponse,
      ClassTermParams
    >({
      query: ({ schoolId, classId, termId }) =>
        `/school/${schoolId}/class/${classId}/term/${termId}`,
      providesTags: (_r, _e, { classId, termId }) => [
        { type: 'ClassReportCards', id: `${classId}::${termId}` },
      ],
    }),

    /** 3.5 — All report cards for a term */
    getTermReportCards: builder.query<
      ReportCardListResponse,
      SchoolTermParams
    >({
      query: ({ schoolId, termId }) => `/school/${schoolId}/term/${termId}`,
      providesTags: (_r, _e, { schoolId, termId }) => [
        { type: 'TermReportCards', id: `${schoolId}::${termId}` },
      ],
    }),

    /** 3.6 — Full render-ready data (for PDF generation / print view) */
    getReportCardRenderData: builder.query<
      ReportCardRenderDataResponse,
      string
    >({
      query: (reportCardId) => `/${reportCardId}/data`,
      providesTags: (_r, _e, reportCardId) => [
        { type: 'ReportCardRenderData', id: reportCardId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       4. UPDATE
       ═══════════════════════════════════════════════════════════ */

    /** 4.1 — Update class-teacher / principal remarks */
    updateReportCardRemarks: builder.mutation<
      ReportCardResponse,
      UpdateReportCardRemarksInput
    >({
      query: ({ reportCardId, ...patch }) => ({
        url: `/${reportCardId}/remarks`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { reportCardId }) => [
        { type: 'ReportCardDetail', id: reportCardId },
        'ReportCards',
        'StudentReportCards',
        'ClassReportCards',
        'TermReportCards',
        { type: 'ReportCardRenderData', id: reportCardId },
      ],
    }),

    /**
     * 4.2 — Admin override of computed fields (e.g. correct a meanScore).
     * Backend enforces: `meanScore` must be 0–100 (test 6.4).
     */
    overrideReportCard: builder.mutation<
      ReportCardResponse,
      OverrideReportCardInput
    >({
      query: ({ reportCardId, ...patch }) => ({
        url: `/${reportCardId}/override`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { reportCardId }) => [
        { type: 'ReportCardDetail', id: reportCardId },
        'ReportCards',
        'StudentReportCards',
        'ClassReportCards',
        'TermReportCards',
        { type: 'ReportCardRenderData', id: reportCardId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       5. PUBLISH
       ═══════════════════════════════════════════════════════════ */

    /** 5.1 — Publish one report card */
    publishReportCard: builder.mutation<ReportCardResponse, string>({
      query: (reportCardId) => ({
        url: `/${reportCardId}/publish`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, reportCardId) => [
        { type: 'ReportCardDetail', id: reportCardId },
        'ReportCards',
        'StudentReportCards',
        'ClassReportCards',
        'TermReportCards',
      ],
    }),

    /** 5.2 — Publish every report card in a class for a term */
    publishClassReportCards: builder.mutation<
      GenericResponse,
      PublishClassReportCardsInput
    >({
      query: (body) => ({
        url: '/publish/class',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [
        'ReportCards',
        'StudentReportCards',
        { type: 'ClassReportCards', id: `${arg.classId}::${arg.termId}` },
        { type: 'TermReportCards', id: `${arg.schoolId}::${arg.termId}` },
      ],
    }),

    /** 5.3 — Unpublish one report card */
    unpublishReportCard: builder.mutation<ReportCardResponse, string>({
      query: (reportCardId) => ({
        url: `/${reportCardId}/unpublish`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, reportCardId) => [
        { type: 'ReportCardDetail', id: reportCardId },
        'ReportCards',
        'StudentReportCards',
        'ClassReportCards',
        'TermReportCards',
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Preview ── */
  usePreviewReportCardMutation,

  /* ── Generate ── */
  useGenerateReportCardMutation,
  useGenerateClassReportCardsMutation,
  useGenerateSchoolReportCardsMutation,
  useRegenerateReportCardMutation,

  /* ── Reads ── */
  useGetReportCardByIdQuery,
  useGetReportCardByStudentTermQuery,
  useGetStudentReportCardsQuery,
  useGetClassReportCardsQuery,
  useGetTermReportCardsQuery,
  useGetReportCardRenderDataQuery,

  /* ── Update ── */
  useUpdateReportCardRemarksMutation,
  useOverrideReportCardMutation,

  /* ── Publish ── */
  usePublishReportCardMutation,
  usePublishClassReportCardsMutation,
  useUnpublishReportCardMutation,
} = reportCardsApi;