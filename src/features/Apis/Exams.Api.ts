import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   DOMAIN TYPES — mirrors the server's TSelect* schema shapes
   ═══════════════════════════════════════════════════════════════ */

/** Must match ExamCategory in exams.service.ts. */
export type ExamCategory =
  | 'Mid-Term'
  | 'End-Term'
  | 'Continuous Assessment'
  | 'Project'
  | 'Practical'
  | 'Opening'
  | 'Formative'
  | 'Summative'
  | 'Mock'
  | 'End of Year';

/** Mirrors TSelectTermExam — no `status`, no `isPublished`; `isLocked` is the only state flag. */
export interface Exam {
  id: string;
  schoolId: string;
  termId: string;
  examTitle: string;
  examCategory: ExamCategory;
  weighting: string | null;
  /** Total marks the exam is set out of (e.g. "100.00"). Pre-fills marks entry. */
  outOf: string | null;
  gradingScaleId: string | null;
  startDate: string | null;
  endDate: string | null;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  term?: Record<string, any>;
  gradingScale?: Record<string, any>;
  [key: string]: any;
}

/** Mirrors TSelectExamSchedule (one row per class + subject). */
export interface ExamSchedule {
  id: string;
  schoolId: string;
  examId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime: string | null;
  endTime: string | null;
  venue: string | null;
  invigilatorId: string | null;
  createdAt: string;
  updatedAt: string;
  exam?: Record<string, any>;
  class?: Record<string, any>;
  subject?: Record<string, any>;
  invigilator?: Record<string, any>;
  [key: string]: any;
}

/** Mirrors TSelectExamResult. */
export interface ExamMark {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  subjectId: string;
  classId: string | null;
  marks: string | null;
  outOf: string;
  isAbsent: boolean;
  grade: string | null;
  points: number | null;
  subjectPosition: number | null;
  remarks: string | null;
  enteredBy: string | null;
  createdAt: string;
  updatedAt: string;
  exam?: Record<string, any>;
  student?: Record<string, any>;
  subject?: Record<string, any>;
  class?: Record<string, any>;
  [key: string]: any;
}

/** Mirrors the `marksheet.rows[]` element. */
export interface MarksheetRow {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  marks: string | null;
  outOf: string;
  grade: string | null;
  points: number | null;
  isAbsent: boolean;
  remarks: string | null;
}

export interface RankingRow {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  totalMarks: string;
  totalOutOf: string;
  meanScore: string;
  meanGrade: string;
  position: number;
  subjectsCount: number;
}

export interface TranscriptEntry {
  examId: string;
  examTitle: string;
  termName: string;
  academicYear: string;
  results: ExamMark[];
}

export interface SubjectStat {
  subjectName: string;
  totalStudents: number;
  present: number;
  absent: number;
  mean: string;
  meanPercentage: string;
  passRate: string;
  distribution: Record<string, number>;
}

export interface ClassPerformanceStat {
  totalStudents: number;
  totalSubjects: number;
  totalResults: number;
  absent: number;
  mean: string;
}

export interface ExamStat {
  examTitle: string;
  isLocked: boolean;
  totalResults: number;
  absentCount: number;
  completed: number;
  mean: string;
  meanPercentage: string;
  uniqueStudents: number;
  uniqueSubjects: number;
  gradeDistribution: Record<string, number>;
}

/* ═══════════════════════════════════════════════════════════════
   REQUEST PAYLOADS
   ═══════════════════════════════════════════════════════════════ */

/* ── Exams (term-level — never tied to a class) ─────────── */

export interface CreateExamInput {
  schoolId: string;
  termId: string;
  examTitle: string;
  examCategory: ExamCategory;
  weighting?: string | number | null;
  /** Total marks for the exam. */
  outOf?: string | number | null;
  gradingScaleId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateExamInput {
  examId: string;
  patch: Partial<Omit<CreateExamInput, 'schoolId' | 'termId'>>;
}

export interface ExamsByCategoryParams {
  schoolId: string;
  category: ExamCategory;
}

export interface ExamsByTermParams {
  schoolId: string;
  termId: string;
}

/* ── Schedules ──────────────────────────────────────────── */

/**
 * Who sits the paper. Send exactly ONE of:
 *   classId       → a single class
 *   gradeLevelId  → every stream in that grade
 *   allClasses    → every class in the school
 */
export interface ScheduleTarget {
  classId?: string | null;
  gradeLevelId?: string | null;
  allClasses?: boolean;
}

export interface CreateScheduleInput extends ScheduleTarget {
  schoolId: string;
  examId: string;
  subjectId: string;
  examDate: string;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  invigilatorId?: string | null;
}

export interface BulkScheduleEntry extends ScheduleTarget {
  subjectId: string;
  examDate: string;
  startTime?: string | null;
  endTime?: string | null;
  venue?: string | null;
  invigilatorId?: string | null;
}

export interface BulkCreateSchedulesInput {
  schoolId: string;
  examId: string;
  schedules: BulkScheduleEntry[];
}

export interface UpdateScheduleInput {
  scheduleId: string;
  patch: Partial<{
    examDate: string;
    startTime: string | null;
    endTime: string | null;
    venue: string | null;
    invigilatorId: string | null;
  }>;
}

export interface ClassSchedulesParams {
  schoolId: string;
  classId: string;
}

export interface SchedulesByDateParams {
  schoolId: string;
  examDate: string;
}

/* ── Marks ──────────────────────────────────────────────── */

export interface EnterMarkInput {
  schoolId: string;
  examId: string;
  studentId: string;
  subjectId: string;
  classId?: string | null;
  marks?: string | number | null;
  outOf?: string | number;
  isAbsent?: boolean;
  remarks?: string | null;
}

export interface MarkAbsentInput {
  schoolId: string;
  examId: string;
  studentId: string;
  subjectId: string;
}

export interface UpdateMarkInput {
  markId: string;
  patch: Partial<{
    marks: string | number | null;
    outOf: string | number;
    isAbsent: boolean;
    remarks: string | null;
  }>;
}

export interface BulkEnterMarksInput {
  schoolId: string;
  examId: string;
  subjectId: string;
  entries: Array<{
    studentId: string;
    classId?: string | null;
    marks?: string | number | null;
    outOf?: string | number;
    isAbsent?: boolean;
    remarks?: string | null;
  }>;
}

/* ── Marksheet / Transcript ─────────────────────────────── */

export interface MarksheetParams {
  examId: string;
  classId: string;
  subjectId: string;
}

export interface SubjectMarksParams {
  examId: string;
  subjectId: string;
}

export interface StudentExamMarksParams {
  examId: string;
  studentId: string;
}

/* ═══════════════════════════════════════════════════════════════
   RESPONSE ENVELOPE
   ═══════════════════════════════════════════════════════════════ */

export interface ExamResponse {
  success: boolean;
  message: string;
  exam?: Exam;
  exams?: Exam[];
  schedule?: ExamSchedule;
  schedules?: ExamSchedule[];
  result?: ExamMark;
  results?: ExamMark[];
  marksheet?: {
    examId: string;
    subjectId: string;
    classId: string;
    scaleId: string | null;
    rows: MarksheetRow[];
  };
  ranking?: RankingRow[];
  statistics?: Record<string, any>;
  transcript?: TranscriptEntry[];
  count?: number;
  issues?: string[];
}

export type SingleExamResponse = ExamResponse & { exam: Exam };
export type ExamListResponse = ExamResponse & { exams: Exam[]; count: number };

export type SingleScheduleResponse = ExamResponse & { schedule: ExamSchedule };
/** Creating a schedule for a grade / all classes returns one row per class. */
export type CreateScheduleResponse = ExamResponse & {
  schedule: ExamSchedule;
  schedules: ExamSchedule[];
  count: number;
};
export type ScheduleListResponse = ExamResponse & { schedules: ExamSchedule[]; count: number };
export type BulkCreateSchedulesResponse = ExamResponse & { schedules: ExamSchedule[]; count: number };

export type SingleMarkResponse = ExamResponse & { result: ExamMark };
export type MarkListResponse = ExamResponse & { results: ExamMark[]; count: number };
export type BulkEnterMarksResponse = ExamResponse & { results: ExamMark[]; count: number };

export type MarksheetResponse = ExamResponse & {
  marksheet: NonNullable<ExamResponse['marksheet']>;
  count: number;
};

export type TranscriptResponse = ExamResponse & { transcript: TranscriptEntry[]; count: number };
export type ExamStatisticsResponse = ExamResponse & { statistics: ExamStat; exam: Exam };
export type SubjectStatisticsResponse = ExamResponse & { statistics: Record<string, SubjectStat> };
export type ClassPerformanceResponse = ExamResponse & { statistics: Record<string, ClassPerformanceStat> };

export type ExamReportResponse = ExamResponse & {
  exam: Exam;
  statistics: {
    summary: ExamStat;
    bySubject: Record<string, SubjectStat>;
    byClass: Record<string, ClassPerformanceStat>;
  };
};

export type ComputeResponse = ExamResponse & { count?: number; ranking?: RankingRow[] };
export type GenericResponse = ExamResponse;

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const examsApi = createApi({
  reducerPath: 'examsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/exams`,
    credentials: 'include',
  }),
  tagTypes: [
    'Exams',
    'ExamDetail',
    'ExamStatistics',
    'Schedules',
    'ScheduleDetail',
    'Marks',
    'MarkDetail',
    'Marksheet',
    'StudentExamMarks',
    'Transcript',
    'SubjectStatistics',
    'ClassPerformance',
    'ExamReport',
  ],
  endpoints: (builder) => ({

    /* ───────── EXAMS ───────── */

    createExam: builder.mutation<SingleExamResponse, CreateExamInput>({
      query: (body) => ({ url: '', method: 'POST', body }),
      invalidatesTags: ['Exams', 'ExamStatistics'],
    }),

    getExamsByTerm: builder.query<ExamListResponse, ExamsByTermParams>({
      query: ({ schoolId, termId }) => `/school/${schoolId}/term/${termId}`,
      providesTags: ['Exams'],
    }),

    getExamsBySchool: builder.query<ExamListResponse, string>({
      query: (schoolId) => `/school/${schoolId}`,
      providesTags: ['Exams'],
    }),

    getExamsByCategory: builder.query<ExamListResponse, ExamsByCategoryParams>({
      query: ({ schoolId, category }) => ({
        url: `/school/${schoolId}/by-category`,
        params: { category },
      }),
      providesTags: ['Exams'],
    }),

    getExamById: builder.query<SingleExamResponse, string>({
      query: (examId) => `/${examId}`,
      providesTags: (_r, _e, examId) => [{ type: 'ExamDetail', id: examId }],
    }),

    updateExam: builder.mutation<SingleExamResponse, UpdateExamInput>({
      query: ({ examId, patch }) => ({ url: `/${examId}`, method: 'PUT', body: patch }),
      invalidatesTags: (_r, _e, { examId }) => [
        { type: 'ExamDetail', id: examId },
        { type: 'ExamStatistics', id: examId },
        'Exams',
      ],
    }),

    /** Backend field is `statistics`. */
    getExamStatistics: builder.query<ExamStatisticsResponse, string>({
      query: (examId) => `/${examId}/statistics`,
      providesTags: (_r, _e, examId) => [{ type: 'ExamStatistics', id: examId }],
    }),

    /** Blocked when locked (400). Route requires a super admin. */
    deleteExam: builder.mutation<GenericResponse, string>({
      query: (examId) => ({ url: `/${examId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, examId) => [
        { type: 'ExamDetail', id: examId },
        { type: 'ExamStatistics', id: examId },
        'Exams',
        'Schedules',
        'Marks',
      ],
    }),

    /* ───────── SCHEDULES ───────── */

    /** POST /exams/schedules — one class, a whole grade, or all classes. */
    createSchedule: builder.mutation<CreateScheduleResponse, CreateScheduleInput>({
      query: (body) => ({ url: '/schedules', method: 'POST', body }),
      invalidatesTags: (_r, _e, { examId }) => ['Schedules', { type: 'ExamDetail', id: examId }],
    }),

    /** POST /exams/schedules/bulk — each entry targets a class, a grade, or all classes. */
    bulkCreateSchedules: builder.mutation<BulkCreateSchedulesResponse, BulkCreateSchedulesInput>({
      query: ({ schoolId, examId, schedules }) => ({
        url: '/schedules/bulk',
        method: 'POST',
        body: { schoolId, examId, schedules },
      }),
      invalidatesTags: (_r, _e, { examId }) => ['Schedules', { type: 'ExamDetail', id: examId }],
    }),

    getSchedulesByExam: builder.query<ScheduleListResponse, string>({
      query: (examId) => `/${examId}/schedules`,
      providesTags: (_r, _e, examId) => [{ type: 'Schedules', id: `exam::${examId}` }],
    }),

    getSchedulesByClass: builder.query<ScheduleListResponse, ClassSchedulesParams>({
      query: ({ schoolId, classId }) => `/school/${schoolId}/class/${classId}/schedules`,
      providesTags: (_r, _e, { classId }) => [{ type: 'Schedules', id: `class::${classId}` }],
    }),

    getSchedulesByDate: builder.query<ScheduleListResponse, SchedulesByDateParams>({
      query: ({ schoolId, examDate }) => ({
        url: `/school/${schoolId}/schedules/by-date`,
        params: { examDate },
      }),
      providesTags: ['Schedules'],
    }),

    getScheduleById: builder.query<SingleScheduleResponse, string>({
      query: (scheduleId) => `/schedules/${scheduleId}`,
      providesTags: (_r, _e, scheduleId) => [{ type: 'ScheduleDetail', id: scheduleId }],
    }),

    updateSchedule: builder.mutation<SingleScheduleResponse, UpdateScheduleInput>({
      query: ({ scheduleId, patch }) => ({
        url: `/schedules/${scheduleId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { scheduleId }) => [
        { type: 'ScheduleDetail', id: scheduleId },
        'Schedules',
      ],
    }),

    deleteSchedule: builder.mutation<GenericResponse, string>({
      query: (scheduleId) => ({ url: `/schedules/${scheduleId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, scheduleId) => [
        { type: 'ScheduleDetail', id: scheduleId },
        'Schedules',
      ],
    }),

    /* ───────── MARKS — single ───────── */

    enterMark: builder.mutation<SingleMarkResponse, EnterMarkInput>({
      query: (body) => ({ url: '/marks', method: 'POST', body }),
      invalidatesTags: (_r, _e, { examId, subjectId, studentId }) => [
        { type: 'Marks', id: `subject::${examId}::${subjectId}` },
        { type: 'StudentExamMarks', id: `${examId}::${studentId}` },
        'Marksheet',
        { type: 'ExamStatistics', id: examId },
      ],
    }),

    markStudentAbsent: builder.mutation<SingleMarkResponse, MarkAbsentInput>({
      query: (body) => ({ url: '/marks/absent', method: 'POST', body }),
      invalidatesTags: (_r, _e, { examId, subjectId, studentId }) => [
        { type: 'Marks', id: `subject::${examId}::${subjectId}` },
        { type: 'StudentExamMarks', id: `${examId}::${studentId}` },
        'Marksheet',
        { type: 'ExamStatistics', id: examId },
      ],
    }),

    getMarkById: builder.query<SingleMarkResponse, string>({
      query: (markId) => `/marks/${markId}`,
      providesTags: (_r, _e, markId) => [{ type: 'MarkDetail', id: markId }],
    }),

    updateMark: builder.mutation<SingleMarkResponse, UpdateMarkInput>({
      query: ({ markId, patch }) => ({ url: `/marks/${markId}`, method: 'PUT', body: patch }),
      invalidatesTags: (_r, _e, { markId }) => [
        { type: 'MarkDetail', id: markId },
        'Marks',
        'Marksheet',
        'ExamStatistics',
      ],
    }),

    deleteMark: builder.mutation<GenericResponse, string>({
      query: (markId) => ({ url: `/marks/${markId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, markId) => [
        { type: 'MarkDetail', id: markId },
        'Marks',
        'Marksheet',
        'ExamStatistics',
      ],
    }),

    /* ───────── MARKS — bulk ───────── */

    bulkEnterMarks: builder.mutation<BulkEnterMarksResponse, BulkEnterMarksInput>({
      query: (body) => ({ url: '/marks/bulk', method: 'POST', body }),
      invalidatesTags: (_r, _e, { examId, subjectId, entries }) => [
        { type: 'Marks', id: `subject::${examId}::${subjectId}` },
        'Marksheet',
        'ExamStatistics',
        'SubjectStatistics',
        'ClassPerformance',
        ...entries.map((e) => ({
          type: 'StudentExamMarks' as const,
          id: `${examId}::${e.studentId}`,
        })),
      ],
    }),

    /* ───────── MARKSHEET ───────── */

    getMarksheet: builder.query<MarksheetResponse, MarksheetParams>({
      query: ({ examId, classId, subjectId }) => `/${examId}/marksheet/${classId}/${subjectId}`,
      providesTags: (_r, _e, { examId, classId, subjectId }) => [
        { type: 'Marksheet', id: `${examId}::${classId}::${subjectId}` },
      ],
    }),

    getSubjectMarks: builder.query<MarkListResponse, SubjectMarksParams>({
      query: ({ examId, subjectId }) => `/${examId}/subject/${subjectId}/marks`,
      providesTags: (_r, _e, { examId, subjectId }) => [
        { type: 'Marks', id: `subject::${examId}::${subjectId}` },
      ],
    }),

    /* ───────── STUDENT MARKS & TRANSCRIPT ───────── */

    getStudentExamMarks: builder.query<MarkListResponse, StudentExamMarksParams>({
      query: ({ examId, studentId }) => `/${examId}/student/${studentId}/marks`,
      providesTags: (_r, _e, { examId, studentId }) => [
        { type: 'StudentExamMarks', id: `${examId}::${studentId}` },
      ],
    }),

    getStudentTranscript: builder.query<TranscriptResponse, string>({
      query: (studentId) => `/student/${studentId}/transcript`,
      providesTags: (_r, _e, studentId) => [{ type: 'Transcript', id: studentId }],
    }),

    /* ───────── COMPUTATION ───────── */

    computeGrades: builder.mutation<ComputeResponse, string>({
      query: (examId) => ({ url: `/${examId}/compute-grades`, method: 'POST' }),
      invalidatesTags: (_r, _e, examId) => [
        'Marks',
        'Marksheet',
        { type: 'ExamStatistics', id: examId },
        { type: 'SubjectStatistics', id: examId },
      ],
    }),

    computeSubjectPositions: builder.mutation<ComputeResponse, string>({
      query: (examId) => ({ url: `/${examId}/compute-subject-positions`, method: 'POST' }),
      invalidatesTags: (_r, _e, examId) => [
        'Marks',
        'Marksheet',
        { type: 'SubjectStatistics', id: examId },
      ],
    }),

    computeClassRanking: builder.mutation<ComputeResponse, string>({
      query: (examId) => ({ url: `/${examId}/compute-class-ranking`, method: 'POST' }),
      invalidatesTags: (_r, _e, examId) => [
        'Marks',
        'Marksheet',
        { type: 'ClassPerformance', id: examId },
      ],
    }),

    /** `statistics` is a Record<subjectId, SubjectStat>. */
    getSubjectStatistics: builder.query<SubjectStatisticsResponse, string>({
      query: (examId) => `/${examId}/subject-statistics`,
      providesTags: (_r, _e, examId) => [{ type: 'SubjectStatistics', id: examId }],
    }),

    /** `statistics` is a Record<classId, ClassPerformanceStat>. */
    getClassPerformance: builder.query<ClassPerformanceResponse, string>({
      query: (examId) => `/${examId}/class-performance`,
      providesTags: (_r, _e, examId) => [{ type: 'ClassPerformance', id: examId }],
    }),

    /* ───────── REPORT ───────── */

    getExamReport: builder.query<ExamReportResponse, string>({
      query: (examId) => `/${examId}/report`,
      providesTags: (_r, _e, examId) => [{ type: 'ExamReport', id: examId }],
    }),

    /* ───────── PUBLISH & LOCK ───────── */

    publishExam: builder.mutation<SingleExamResponse, string>({
      query: (examId) => ({ url: `/${examId}/publish`, method: 'POST' }),
      invalidatesTags: (_r, _e, examId) => [
        { type: 'ExamDetail', id: examId },
        { type: 'ExamStatistics', id: examId },
        { type: 'SubjectStatistics', id: examId },
        { type: 'ClassPerformance', id: examId },
        'Exams',
        'Marks',
        'Marksheet',
      ],
    }),

    unlockExam: builder.mutation<SingleExamResponse, string>({
      query: (examId) => ({ url: `/${examId}/unlock`, method: 'POST' }),
      invalidatesTags: (_r, _e, examId) => [{ type: 'ExamDetail', id: examId }, 'Exams'],
    }),

    lockExam: builder.mutation<SingleExamResponse, string>({
      query: (examId) => ({ url: `/${examId}/lock`, method: 'POST' }),
      invalidatesTags: (_r, _e, examId) => [{ type: 'ExamDetail', id: examId }, 'Exams'],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  useCreateExamMutation,
  useGetExamsByTermQuery,
  useGetExamsBySchoolQuery,
  useGetExamsByCategoryQuery,
  useGetExamByIdQuery,
  useUpdateExamMutation,
  useDeleteExamMutation,
  useGetExamStatisticsQuery,

  useCreateScheduleMutation,
  useBulkCreateSchedulesMutation,
  useGetSchedulesByExamQuery,
  useGetSchedulesByClassQuery,
  useGetSchedulesByDateQuery,
  useGetScheduleByIdQuery,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,

  useEnterMarkMutation,
  useMarkStudentAbsentMutation,
  useGetMarkByIdQuery,
  useUpdateMarkMutation,
  useDeleteMarkMutation,

  useBulkEnterMarksMutation,

  useGetMarksheetQuery,
  useGetSubjectMarksQuery,

  useGetStudentExamMarksQuery,
  useGetStudentTranscriptQuery,

  useComputeGradesMutation,
  useComputeSubjectPositionsMutation,
  useComputeClassRankingMutation,
  useGetSubjectStatisticsQuery,
  useGetClassPerformanceQuery,

  useGetExamReportQuery,

  usePublishExamMutation,
  useUnlockExamMutation,
  useLockExamMutation,
} = examsApi;