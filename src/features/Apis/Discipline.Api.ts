import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type IncidentType =
  | 'Merit'
  | 'Warning'
  | 'Detention'
  | 'Late-coming'
  | 'Suspension'
  | string;

export interface DisciplineIncident {
  id: string;
  schoolId: string;
  studentId: string;
  incidentType: IncidentType;
  description: string;
  actionTaken?: string | null;
  parentNotified?: boolean;
  notifiedAt?: string | null;
  recordedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  // Optional expanded relations when backend includes them
  student?: any;
  class?: any;
  [key: string]: any;
}

/* ── Request payloads ─────────────────────────────────────────── */

export interface CreateIncidentInput {
  schoolId: string;
  studentId: string;
  incidentType: IncidentType;
  description: string;
  actionTaken?: string;
  notify?: boolean;
}

export interface BulkCreateIncidentsInput {
  schoolId: string;
  notify?: boolean;
  incidents: Array<{
    studentId: string;
    incidentType: IncidentType;
    description: string;
    actionTaken?: string;
  }>;
}

export interface UpdateIncidentInput {
  incidentId: string;
  patch: Partial<{
    incidentType: IncidentType;
    description: string;
    actionTaken: string;
  }>;
}

export interface StudentIncidentsParams {
  studentId: string;
  fromDate?: string;
  toDate?: string;
  type?: IncidentType;
}

export interface ClassIncidentsParams {
  classId: string;
  fromDate?: string;
  toDate?: string;
}

export interface SchoolIncidentsParams {
  schoolId: string;
  type?: IncidentType;
  parentNotified?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface SchoolByTypeParams {
  schoolId: string;
  type: IncidentType;
}

export interface SchoolByDateRangeParams {
  schoolId: string;
  fromDate: string;
  toDate: string;
}

export interface SchoolStatsParams {
  schoolId: string;
  fromDate?: string;
  toDate?: string;
}

export interface SchoolTrendParams {
  schoolId: string;
  days?: number;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface SingleIncidentResponse {
  success: boolean;
  message?: string;
  record?: DisciplineIncident;
  incident?: DisciplineIncident;
  [key: string]: any;
}

export interface IncidentListResponse {
  success: boolean;
  count?: number;
  records?: DisciplineIncident[];
  incidents?: DisciplineIncident[];
  [key: string]: any;
}

export interface BulkCreateResponse {
  success: boolean;
  message?: string;
  count?: number;
  records?: DisciplineIncident[];
  [key: string]: any;
}

export interface StudentDisciplineSummaryResponse {
  success: boolean;
  summary: {
    studentId?: string;
    totalIncidents?: number;
    merits?: number;
    warnings?: number;
    detentions?: number;
    suspensions?: number;
    lateComings?: number;
    byType?: Record<string, number>;
    mostRecent?: DisciplineIncident;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ClassDisciplineSummaryResponse {
  success: boolean;
  summary: {
    classId?: string;
    totalIncidents?: number;
    topOffenders?: Array<{
      studentId: string;
      studentName?: string;
      count: number;
      [key: string]: any;
    }>;
    byType?: Record<string, number>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SchoolDisciplineStatsResponse {
  success: boolean;
  stats: {
    total?: number;
    byType?: Record<string, number>;
    notified?: number;
    notNotified?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface DisciplineTrendPoint {
  date: string;
  count: number;
  [key: string]: any;
}

export interface DisciplineTrendResponse {
  success: boolean;
  trend: DisciplineTrendPoint[];
  [key: string]: any;
}

export interface MeritStudentsResponse {
  success: boolean;
  count?: number;
  students?: Array<{
    studentId: string;
    studentName?: string;
    meritCount: number;
    [key: string]: any;
  }>;
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

export const disciplineApi = createApi({
  reducerPath: 'disciplineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/discipline`,
    credentials: 'include',
  }),
  tagTypes: [
    'Incidents',
    'IncidentDetail',
    'StudentIncidents',
    'ClassIncidents',
    'StudentSummary',
    'ClassSummary',
    'SchoolStats',
    'SchoolTrend',
    'MeritStudents',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════
       1. RECORD INCIDENTS
       ═══════════════════════════════════════════ */

    /** 1.1–1.5 POST /discipline — record a single incident */
    createIncident: builder.mutation<SingleIncidentResponse, CreateIncidentInput>({
      query: (body) => ({ url: '', method: 'POST', body }),
      invalidatesTags: (_r, _e, { studentId }) => [
        'Incidents',
        { type: 'StudentIncidents', id: studentId },
        { type: 'StudentSummary', id: studentId },
        'SchoolStats',
        'SchoolTrend',
        'MeritStudents',
      ],
    }),

    /** 1.6 POST /discipline/bulk — record multiple incidents */
    bulkCreateIncidents: builder.mutation<BulkCreateResponse, BulkCreateIncidentsInput>({
      query: (body) => ({ url: '/bulk', method: 'POST', body }),
      invalidatesTags: ['Incidents', 'StudentIncidents', 'StudentSummary', 'SchoolStats', 'SchoolTrend'],
    }),

    /* ═══════════════════════════════════════════
       2. READS
       ═══════════════════════════════════════════ */

    /** 2.1 GET /discipline/{incidentId} */
    getIncidentById: builder.query<SingleIncidentResponse, string>({
      query: (incidentId) => `/${incidentId}`,
      providesTags: (_r, _e, incidentId) => [{ type: 'IncidentDetail', id: incidentId }],
    }),

    /** 2.2–2.4 GET /discipline/student/{studentId}?fromDate=&toDate=&type= */
    getStudentIncidents: builder.query<IncidentListResponse, StudentIncidentsParams>({
      query: ({ studentId, fromDate, toDate, type }) => ({
        url: `/student/${studentId}`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
          ...(type ? { type } : {}),
        },
      }),
      providesTags: (_r, _e, { studentId }) => [
        { type: 'StudentIncidents', id: studentId },
      ],
    }),

    /** 2.5–2.6 GET /discipline/class/{classId}?fromDate=&toDate= */
    getClassIncidents: builder.query<IncidentListResponse, ClassIncidentsParams>({
      query: ({ classId, fromDate, toDate }) => ({
        url: `/class/${classId}`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: (_r, _e, { classId }) => [
        { type: 'ClassIncidents', id: classId },
      ],
    }),

    /** 2.7–2.9 GET /discipline/school/{schoolId}?type=&parentNotified=&fromDate=&toDate= */
    getSchoolIncidents: builder.query<IncidentListResponse, SchoolIncidentsParams>({
      query: ({ schoolId, type, parentNotified, fromDate, toDate }) => ({
        url: `/school/${schoolId}`,
        params: {
          ...(type ? { type } : {}),
          ...(parentNotified !== undefined ? { parentNotified } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: ['Incidents'],
    }),

    /** 2.10 GET /discipline/school/{schoolId}/by-type?type= */
    getSchoolIncidentsByType: builder.query<IncidentListResponse, SchoolByTypeParams>({
      query: ({ schoolId, type }) => ({
        url: `/school/${schoolId}/by-type`,
        params: { type },
      }),
      providesTags: ['Incidents'],
    }),

    /** 2.11 GET /discipline/school/{schoolId}/by-date-range?fromDate=&toDate= */
    getSchoolIncidentsByDateRange: builder.query<
      IncidentListResponse,
      SchoolByDateRangeParams
    >({
      query: ({ schoolId, fromDate, toDate }) => ({
        url: `/school/${schoolId}/by-date-range`,
        params: { fromDate, toDate },
      }),
      providesTags: ['Incidents'],
    }),

    /* ═══════════════════════════════════════════
       3. UPDATES
       ═══════════════════════════════════════════ */

    /** 3.1 & 3.3 PUT /discipline/{incidentId} — update incident */
    updateIncident: builder.mutation<SingleIncidentResponse, UpdateIncidentInput>({
      query: ({ incidentId, patch }) => ({
        url: `/${incidentId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { incidentId }) => [
        { type: 'IncidentDetail', id: incidentId },
        'Incidents',
        'StudentIncidents',
        'ClassIncidents',
        'StudentSummary',
        'SchoolStats',
        'SchoolTrend',
      ],
    }),

    /** 3.2 PATCH /discipline/{incidentId}/mark-notified */
    markIncidentNotified: builder.mutation<SingleIncidentResponse, string>({
      query: (incidentId) => ({
        url: `/${incidentId}/mark-notified`,
        method: 'PATCH',
      }),
      invalidatesTags: (_r, _e, incidentId) => [
        { type: 'IncidentDetail', id: incidentId },
        'Incidents',
        'StudentIncidents',
        'SchoolStats',
      ],
    }),

    /* ═══════════════════════════════════════════
       4. STUDENT SUMMARY
       ═══════════════════════════════════════════ */

    /** 4.1–4.2 GET /discipline/student/{studentId}/summary */
    getStudentDisciplineSummary: builder.query<StudentDisciplineSummaryResponse, string>({
      query: (studentId) => `/student/${studentId}/summary`,
      providesTags: (_r, _e, studentId) => [
        { type: 'StudentSummary', id: studentId },
      ],
    }),

    /* ═══════════════════════════════════════════
       5. CLASS & SCHOOL ANALYTICS
       ═══════════════════════════════════════════ */

    /** 5.1 GET /discipline/class/{classId}/summary */
    getClassDisciplineSummary: builder.query<ClassDisciplineSummaryResponse, string>({
      query: (classId) => `/class/${classId}/summary`,
      providesTags: (_r, _e, classId) => [
        { type: 'ClassSummary', id: classId },
        { type: 'ClassIncidents', id: classId },
      ],
    }),

    /** 5.2–5.3 GET /discipline/school/{schoolId}/stats?fromDate=&toDate= */
    getSchoolDisciplineStats: builder.query<
      SchoolDisciplineStatsResponse,
      SchoolStatsParams
    >({
      query: ({ schoolId, fromDate, toDate }) => ({
        url: `/school/${schoolId}/stats`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      }),
      providesTags: ['SchoolStats'],
    }),

    /** 5.4–5.5 GET /discipline/school/{schoolId}/trend?days= */
    getDisciplineTrend: builder.query<DisciplineTrendResponse, SchoolTrendParams>({
      query: ({ schoolId, days }) => ({
        url: `/school/${schoolId}/trend`,
        params: days ? { days } : {},
      }),
      providesTags: ['SchoolTrend'],
    }),

    /** 5.6 GET /discipline/school/{schoolId}/merits */
    getMeritStudents: builder.query<MeritStudentsResponse, string>({
      query: (schoolId) => `/school/${schoolId}/merits`,
      providesTags: ['MeritStudents'],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  // Records
  useCreateIncidentMutation,
  useBulkCreateIncidentsMutation,

  // Reads
  useGetIncidentByIdQuery,
  useGetStudentIncidentsQuery,
  useGetClassIncidentsQuery,
  useGetSchoolIncidentsQuery,
  useGetSchoolIncidentsByTypeQuery,
  useGetSchoolIncidentsByDateRangeQuery,

  // Updates
  useUpdateIncidentMutation,
  useMarkIncidentNotifiedMutation,

  // Student summary
  useGetStudentDisciplineSummaryQuery,

  // Analytics
  useGetClassDisciplineSummaryQuery,
  useGetSchoolDisciplineStatsQuery,
  useGetDisciplineTrendQuery,
  useGetMeritStudentsQuery,
} = disciplineApi;