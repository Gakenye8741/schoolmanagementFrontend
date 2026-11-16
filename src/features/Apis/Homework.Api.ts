import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type SubmissionStatus =
  | 'Pending'
  | 'Submitted'
  | 'Late'
  | 'Graded'
  | 'Returned'
  | string;

export interface Assignment {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string | null;
  maxScore: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  subject?: Record<string, any>;
  class?: Record<string, any>;
  teacher?: Record<string, any>;
  [key: string]: any;
}

export interface Submission {
  id: string;
  schoolId: string;
  assignmentId: string;
  studentId: string;
  submissionText: string | null;
  attachmentUrl: string | null;
  submittedAt: string | null;
  status: SubmissionStatus;
  gradeScore: string | null;
  teacherFeedback: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignment?: Assignment;
  student?: Record<string, any>;
  [key: string]: any;
}

export interface PendingSubmissionRow {
  studentId: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export interface AssignmentSummary {
  assignmentId?: string;
  totalStudents?: number;
  submitted?: number;
  graded?: number;
  pending?: number;
  late?: number;
  averageScore?: string | number;
  completionRate?: string | number;
  [key: string]: any;
}

export interface StudentHomeworkSummary {
  totalAssignments?: number;
  submitted?: number;
  graded?: number;
  pending?: number;
  late?: number;
  averageScore?: string | number;
  averagePercentage?: string | number;
  bySubject?: Array<{
    subjectId: string;
    subjectName?: string;
    total?: number;
    graded?: number;
    averageScore?: string | number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface CompletionRateRow {
  classId: string;
  className?: string;
  completionRate: string | number;
  totalAssignments?: number;
  [key: string]: any;
}

export interface ClassRankingRow {
  classId: string;
  className?: string;
  completionRate: string | number;
  position?: number;
  [key: string]: any;
}

export interface SubjectHomeworkSummary {
  subjectId?: string;
  subjectName?: string;
  totalAssignments?: number;
  totalSubmissions?: number;
  averageScore?: string | number;
  completionRate?: string | number;
  [key: string]: any;
}

export interface TeacherWorkloadRow {
  teacherId: string;
  teacherName?: string;
  totalAssignments?: number;
  totalSubmissions?: number;
  ungraded?: number;
  [key: string]: any;
}

export interface SchoolHomeworkOverview {
  totalAssignments?: number;
  totalSubmissions?: number;
  averageScore?: string | number;
  completionRate?: string | number;
  byClass?: Array<Record<string, any>>;
  bySubject?: Array<Record<string, any>>;
  [key: string]: any;
}

/* ── Request payloads ─────────────────────────────────────── */

export interface CreateAssignmentInput {
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  maxScore?: string | number;
  dueDate: string;
  notify?: boolean;
}

export interface UpdateAssignmentInput {
  assignmentId: string;
  patch: Partial<{
    title: string;
    description: string;
    maxScore: string | number;
    dueDate: string;
  }>;
}

export interface SubmitHomeworkInput {
  schoolId: string;
  assignmentId: string;
  studentId: string;
  submissionText?: string;
  attachmentUrl?: string | null;
}

export interface GradeSubmissionInput {
  submissionId: string;
  gradeScore: string | number;
  teacherFeedback?: string;
}

export interface BulkGradeItem {
  submissionId: string;
  gradeScore: string | number;
  teacherFeedback?: string;
}

export interface BulkGradeInput {
  items: BulkGradeItem[];
}

export interface ReturnSubmissionInput {
  submissionId: string;
  feedback: string;
}

export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export interface AssignmentByClassParams extends DateRangeParams {
  classId: string;
}

export interface SubmissionListParams {
  assignmentId: string;
  status?: SubmissionStatus;
}

export interface StudentSummaryParams extends DateRangeParams {
  studentId: string;
}

/* ── Response envelopes ───────────────────────────────────── */

export interface HomeworkResponse {
  success: boolean;
  message?: string;
  assignment?: Assignment;
  assignments?: Assignment[];
  submission?: Submission;
  submissions?: Submission[];
  students?: PendingSubmissionRow[];
  summary?: Record<string, any>;
  stats?: Record<string, any>;
  completionRate?: string | number;
  overview?: Record<string, any>;
  workload?: TeacherWorkloadRow[];
  ranking?: ClassRankingRow[];
  count?: number;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const homeworkApi = createApi({
  reducerPath: 'homeworkApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/homework`,
    credentials: 'include',
  }),
  tagTypes: [
    'Assignments',
    'AssignmentDetail',
    'Submissions',
    'SubmissionDetail',
    'StudentSubmissions',
    'StudentSummary',
    'Summary',
    'Pending',
    'UngradedCount',
    'CompletionRate',
    'Ranking',
    'SubjectSummary',
    'TeacherWorkload',
    'SchoolOverview',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════
       1. ASSIGNMENTS
       ═══════════════════════════════════════════════════════ */

    createAssignment: builder.mutation<HomeworkResponse, CreateAssignmentInput>({
      query: (body) => ({ url: '', method: 'POST', body }),
      invalidatesTags: ['Assignments'],
    }),

    getAssignmentById: builder.query<HomeworkResponse, string>({
      query: (assignmentId) => `/${assignmentId}`,
      providesTags: (_r, _e, assignmentId) => [
        { type: 'AssignmentDetail', id: assignmentId },
      ],
    }),

    getAssignmentsByClass: builder.query<
      HomeworkResponse,
      AssignmentByClassParams
    >({
      query: ({ classId, fromDate, toDate }) => ({
        url: `/class/${classId}`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: ['Assignments'],
    }),

    getUpcomingAssignmentsByClass: builder.query<HomeworkResponse, string>({
      query: (classId) => `/class/${classId}/upcoming`,
      providesTags: ['Assignments'],
    }),

    countAssignmentsByClass: builder.query<HomeworkResponse, string>({
      query: (classId) => `/class/${classId}/count`,
      providesTags: ['Assignments'],
    }),

    getAssignmentsBySubject: builder.query<HomeworkResponse, string>({
      query: (subjectId) => `/subject/${subjectId}`,
      providesTags: ['Assignments'],
    }),

    getAssignmentsByTeacher: builder.query<HomeworkResponse, string>({
      query: (teacherId) => `/teacher/${teacherId}`,
      providesTags: ['Assignments'],
    }),

    getAssignmentsBySchool: builder.query<HomeworkResponse, string>({
      query: (schoolId) => `/school/${schoolId}`,
      providesTags: ['Assignments'],
    }),

    updateAssignment: builder.mutation<HomeworkResponse, UpdateAssignmentInput>({
      query: ({ assignmentId, patch }) => ({
        url: `/${assignmentId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { assignmentId }) => [
        { type: 'AssignmentDetail', id: assignmentId },
        'Assignments',
      ],
    }),

    /* ═══════════════════════════════════════════════════════
       2. SUBMISSIONS
       ═══════════════════════════════════════════════════════ */

    submitHomework: builder.mutation<HomeworkResponse, SubmitHomeworkInput>({
      query: (body) => ({ url: '/submissions', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [
        'Submissions',
        'Assignments',
        { type: 'StudentSubmissions', id: arg.studentId },
        { type: 'StudentSummary', id: arg.studentId },
        { type: 'SubmissionDetail', id: arg.assignmentId },
        'Pending',
        'Summary',
      ],
    }),

    getSubmissionById: builder.query<HomeworkResponse, string>({
      query: (submissionId) => `/submissions/${submissionId}`,
      providesTags: (_r, _e, submissionId) => [
        { type: 'SubmissionDetail', id: submissionId },
      ],
    }),

    getStudentSubmissionForAssignment: builder.query<
      HomeworkResponse,
      { assignmentId: string; studentId: string }
    >({
      query: ({ assignmentId, studentId }) =>
        `/assignments/${assignmentId}/student/${studentId}/submission`,
      providesTags: (_r, _e, { assignmentId, studentId }) => [
        { type: 'SubmissionDetail', id: `${assignmentId}::${studentId}` },
      ],
    }),

    getSubmissionsByAssignment: builder.query<HomeworkResponse, SubmissionListParams>({
      query: ({ assignmentId, status }) => ({
        url: `/${assignmentId}/submissions`,
        params: status ? { status } : {},
      }),
      providesTags: ['Submissions'],
    }),

    getSubmissionsByStudent: builder.query<HomeworkResponse, string>({
      query: (studentId) => `/student/${studentId}/submissions`,
      providesTags: (_r, _e, studentId) => [
        { type: 'StudentSubmissions', id: studentId },
      ],
    }),

    getPendingSubmissions: builder.query<HomeworkResponse, string>({
      query: (assignmentId) => `/${assignmentId}/pending`,
      providesTags: (_r, _e, assignmentId) => [
        { type: 'Pending', id: assignmentId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════
       3. GRADING (teacher)
       ═══════════════════════════════════════════════════════ */

    gradeSubmission: builder.mutation<HomeworkResponse, GradeSubmissionInput>({
      query: ({ submissionId, ...body }) => ({
        url: `/submissions/${submissionId}/grade`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { submissionId }) => [
        { type: 'SubmissionDetail', id: submissionId },
        'Submissions',
        'StudentSubmissions',
        'StudentSummary',
        'UngradedCount',
      ],
    }),

    ungradeSubmission: builder.mutation<HomeworkResponse, string>({
      query: (submissionId) => ({
        url: `/submissions/${submissionId}/ungrade`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, submissionId) => [
        { type: 'SubmissionDetail', id: submissionId },
        'Submissions',
        'StudentSubmissions',
        'UngradedCount',
      ],
    }),

    returnSubmission: builder.mutation<HomeworkResponse, ReturnSubmissionInput>({
      query: ({ submissionId, feedback }) => ({
        url: `/submissions/${submissionId}/return`,
        method: 'POST',
        body: { feedback },
      }),
      invalidatesTags: (_r, _e, { submissionId }) => [
        { type: 'SubmissionDetail', id: submissionId },
        'Submissions',
        'StudentSubmissions',
      ],
    }),

    bulkGradeSubmissions: builder.mutation<HomeworkResponse, BulkGradeInput>({
      query: (body) => ({ url: '/submissions/bulk-grade', method: 'POST', body }),
      invalidatesTags: [
        'Submissions',
        'StudentSubmissions',
        'StudentSummary',
        'UngradedCount',
      ],
    }),

    countUngradedByAssignment: builder.query<HomeworkResponse, string>({
      query: (assignmentId) => `/${assignmentId}/ungraded-count`,
      providesTags: ['UngradedCount'],
    }),

    countUngradedByTeacher: builder.query<HomeworkResponse, string>({
      query: (teacherId) => `/teacher/${teacherId}/ungraded-count`,
      providesTags: ['UngradedCount'],
    }),

    getAssignmentSummary: builder.query<HomeworkResponse, string>({
      query: (assignmentId) => `/${assignmentId}/summary`,
      providesTags: (_r, _e, assignmentId) => [
        { type: 'Summary', id: assignmentId },
      ],
    }),

    getGradingQueueItem: builder.query<HomeworkResponse, string>({
      query: (submissionId) => `/grading-queue/${submissionId}`,
      providesTags: (_r, _e, submissionId) => [
        { type: 'SubmissionDetail', id: submissionId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════
       4. STUDENT VIEWS
       ═══════════════════════════════════════════════════════ */

    getStudentHomeworkSummary: builder.query<
      HomeworkResponse,
      StudentSummaryParams
    >({
      query: ({ studentId, fromDate, toDate }) => ({
        url: `/student/${studentId}/summary`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: (_r, _e, { studentId }) => [
        { type: 'StudentSummary', id: studentId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════
       5. REPORTS
       ═══════════════════════════════════════════════════════ */

    getClassCompletionRate: builder.query<
      HomeworkResponse,
      AssignmentByClassParams
    >({
      query: ({ classId, fromDate, toDate }) => ({
        url: `/class/${classId}/completion-rate`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: ['CompletionRate'],
    }),

    getClassRanking: builder.query<HomeworkResponse, string>({
      query: (classId) => `/class/${classId}/ranking`,
      providesTags: ['Ranking'],
    }),

    getSubjectHomeworkSummary: builder.query<HomeworkResponse, string>({
      query: (subjectId) => `/subject/${subjectId}/summary`,
      providesTags: ['SubjectSummary'],
    }),

    getTeacherWorkload: builder.query<HomeworkResponse, string>({
      query: (teacherId) => `/teacher/${teacherId}/workload`,
      providesTags: ['TeacherWorkload'],
    }),

    getSchoolHomeworkOverview: builder.query<HomeworkResponse, string>({
      query: (schoolId) => `/school/${schoolId}/overview`,
      providesTags: ['SchoolOverview'],
    }),

    /* ═══════════════════════════════════════════════════════
       6. HOUSEKEEPING
       ═══════════════════════════════════════════════════════ */

    markOverdueSubmissions: builder.mutation<HomeworkResponse, string>({
      query: (schoolId) => ({
        url: `/school/${schoolId}/mark-overdue`,
        method: 'POST',
      }),
      invalidatesTags: ['Submissions', 'StudentSubmissions', 'Assignments'],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Assignments ── */
  useCreateAssignmentMutation,
  useGetAssignmentByIdQuery,
  useGetAssignmentsByClassQuery,
  useGetUpcomingAssignmentsByClassQuery,
  useCountAssignmentsByClassQuery,
  useGetAssignmentsBySubjectQuery,
  useGetAssignmentsByTeacherQuery,
  useGetAssignmentsBySchoolQuery,
  useUpdateAssignmentMutation,

  /* ── Submissions ── */
  useSubmitHomeworkMutation,
  useGetSubmissionByIdQuery,
  useGetStudentSubmissionForAssignmentQuery,
  useGetSubmissionsByAssignmentQuery,
  useGetSubmissionsByStudentQuery,
  useGetPendingSubmissionsQuery,

  /* ── Grading ── */
  useGradeSubmissionMutation,
  useUngradeSubmissionMutation,
  useReturnSubmissionMutation,
  useBulkGradeSubmissionsMutation,
  useCountUngradedByAssignmentQuery,
  useCountUngradedByTeacherQuery,
  useGetAssignmentSummaryQuery,
  useGetGradingQueueItemQuery,

  /* ── Student views ── */
  useGetStudentHomeworkSummaryQuery,

  /* ── Reports ── */
  useGetClassCompletionRateQuery,
  useGetClassRankingQuery,
  useGetSubjectHomeworkSummaryQuery,
  useGetTeacherWorkloadQuery,
  useGetSchoolHomeworkOverviewQuery,

  /* ── Housekeeping ── */
  useMarkOverdueSubmissionsMutation,
} = homeworkApi;