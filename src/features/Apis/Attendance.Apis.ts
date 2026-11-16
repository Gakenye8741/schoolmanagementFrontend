import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════ DOMAIN TYPES ═══════════════ */

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
  student?: Record<string, any>;
  class?: Record<string, any>;
  [key: string]: any;
}

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string | null;
}

export interface AttendanceImportRow {
  admissionNumber: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
}

export interface StatusCounts {
  Present: number;
  Absent: number;
  Late: number;
  Excused: number;
  [key: string]: number;
}

export interface AttendanceSummary {
  total: number;
  counts: StatusCounts;
  rate?: string | number;
  [key: string]: any;
}

export interface StudentAttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: string | number;
  [key: string]: any;
}

export interface ChronicAbsentee {
  studentId: string;
  admissionNumber?: string;
  firstName?: string;
  lastName?: string;
  classId?: string;
  attendanceRate: string | number;
  [key: string]: any;
}

export interface AuditEntry {
  id: string;
  attendanceId?: string;
  action: string;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  changedBy?: string | null;
  createdAt: string;
  [key: string]: any;
}

export interface AttendanceSettings {
  [key: string]: any;
}

/* ═══════════════ REQUEST PAYLOADS ═══════════════ */

export interface MarkAttendanceInput {
  schoolId: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
}

export interface BulkMarkInput {
  schoolId: string;
  classId: string;
  date: string;
  entries: AttendanceEntry[];
}

export type UpsertAttendanceInput = BulkMarkInput;

export interface UpdateAttendanceInput {
  attendanceId: string;
  patch: Partial<{ status: AttendanceStatus; remarks: string | null }>;
}

export interface AutoAbsentParams { classId: string; date: string }
export interface CopyAttendanceInput { schoolId: string; classId: string; fromDate: string; toDate: string }
export interface ImportAttendanceInput { schoolId: string; classId: string; rows: AttendanceImportRow[] }
export interface StudentDateParams { studentId: string; date: string }
export interface StudentHistoryParams { studentId: string; fromDate?: string; toDate?: string; status?: AttendanceStatus }
export interface ClassDateParams { classId: string; date: string }
export interface SchoolDateParams { schoolId: string; date: string }
export interface MonthlyRegisterParams { classId: string; year: number; month: number }
export interface ChronicAbsenteesParams { schoolId: string; threshold?: number }
export interface ClassRateParams { classId: string; fromDate?: string; toDate?: string }
export interface ClassTrendParams { classId: string; days?: number }
export interface ByStatusParams { schoolId: string; date?: string }
export interface ValidateDateParams { schoolId: string; date: string }
export interface CanMarkParams { userId: string; classId: string }

/* ═══════════════ RESPONSE TYPES ═══════════════ */

export interface AttendanceResponse {
  success: boolean;
  message: string;
  attendance?: AttendanceRecord;
  records?: AttendanceRecord[];
  summary?: AttendanceSummary;
  stats?: Record<string, any>;
  statistics?: Record<string, any>;
  count?: number;
  issues?: string[];
  [key: string]: any;
}

export type SingleAttendanceResponse = AttendanceResponse & { attendance: AttendanceRecord };
export type AttendanceListResponse = AttendanceResponse & { records: AttendanceRecord[]; count: number };
export type BulkAttendanceResponse = AttendanceResponse & { records: AttendanceRecord[]; count: number };
export type AttendanceSummaryResponse = AttendanceResponse & { summary: AttendanceSummary };
export type StudentStatsResponse = AttendanceResponse & { stats: StudentAttendanceStats };
export type MonthlyRegisterResponse = AttendanceResponse & { register: Array<Record<string, any>> };
export type ChronicAbsenteesResponse = AttendanceResponse & { students: ChronicAbsentee[]; count: number; threshold: number };
export type NotMarkedResponse = AttendanceResponse & { students: Array<Record<string, any>>; count: number };
export type AuditTrailResponse = AttendanceResponse & { audit: AuditEntry[]; count: number };
export type RateResponse = AttendanceResponse & { rate: string | number };
export type ByStatusResponse = AttendanceResponse & { counts: StatusCounts };
export type TrendResponse = AttendanceResponse & { trend: Array<{ date: string; rate: string | number; [key: string]: any }> };
export type ByGenderResponse = AttendanceResponse & { statistics: Record<string, any> };
export type ComparisonResponse = AttendanceResponse & { statistics: Record<string, any> };
export type ValidateDateResponse = AttendanceResponse & { valid: boolean };
export type CanMarkResponse = AttendanceResponse & { canMark: boolean; reason?: string };
export type SettingsResponse = AttendanceResponse & { settings: AttendanceSettings };
export type GenericResponse = AttendanceResponse;

/* ═══════════════ NORMALIZERS (backend shape -> UI shape) ═══════════════ */

const pctOf = (good: number, total: number) =>
  total === 0 ? 0 : Math.round((good / total) * 10000) / 100;

/** Backend sends `attendanceRecords`; the UI reads `records`. */
const asRecords = (r: any, key = 'attendanceRecords') => ({
  ...r,
  records: (r?.[key] ?? r?.records ?? []) as AttendanceRecord[],
  count: r?.count ?? (r?.[key] ?? r?.records ?? []).length,
});

/** Tags every write should refresh. */
const COMMON_TAGS = [
  'ClassAttendance', 'SchoolAttendance', 'Register', 'Absentees', 'LateArrivals',
  'ChronicAbsentees', 'NotMarked', 'Analytics', 'Audit', 'StudentAttendance', 'StudentStats',
] as const;

/* ═══════════════ API ═══════════════ */

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/attendance`,
    credentials: 'include',
  }),
  tagTypes: [
    'Attendance', 'AttendanceDetail', 'StudentAttendance', 'StudentStats', 'ClassAttendance',
    'SchoolAttendance', 'Register', 'Absentees', 'LateArrivals', 'ChronicAbsentees',
    'NotMarked', 'Audit', 'Analytics', 'Settings',
  ],
  endpoints: (builder) => ({

    /* ───────── 1. MARKING ───────── */

    markAttendance: builder.mutation<SingleAttendanceResponse, MarkAttendanceInput>({
      query: (body) => ({ url: '', method: 'POST', body }),
      invalidatesTags: [...COMMON_TAGS],
    }),

    bulkMarkAttendance: builder.mutation<BulkAttendanceResponse, BulkMarkInput>({
      query: (body) => ({ url: '/bulk', method: 'POST', body }),
      transformResponse: (r: any) => asRecords(r) as BulkAttendanceResponse,
      invalidatesTags: [...COMMON_TAGS],
    }),

    upsertAttendance: builder.mutation<BulkAttendanceResponse, UpsertAttendanceInput>({
      query: (body) => ({ url: '/upsert', method: 'POST', body }),
      transformResponse: (r: any) => asRecords(r) as BulkAttendanceResponse,
      invalidatesTags: [...COMMON_TAGS],
    }),

    updateAttendance: builder.mutation<SingleAttendanceResponse, UpdateAttendanceInput>({
      query: ({ attendanceId, patch }) => ({ url: `/${attendanceId}`, method: 'PUT', body: patch }),
      invalidatesTags: (_r, _e, { attendanceId }) => [
        { type: 'AttendanceDetail', id: attendanceId },
        'Attendance',
        ...COMMON_TAGS,
      ],
    }),

    autoMarkAbsent: builder.mutation<BulkAttendanceResponse, AutoAbsentParams>({
      query: ({ classId, date }) => ({
        url: `/class/${classId}/date/${date}/auto-absent`,
        method: 'POST',
      }),
      transformResponse: (r: any) => asRecords(r) as BulkAttendanceResponse,
      invalidatesTags: [...COMMON_TAGS],
    }),

    copyAttendance: builder.mutation<BulkAttendanceResponse, CopyAttendanceInput>({
      query: (body) => ({ url: '/copy', method: 'POST', body }),
      transformResponse: (r: any) => asRecords(r) as BulkAttendanceResponse,
      invalidatesTags: [...COMMON_TAGS],
    }),

    importAttendance: builder.mutation<BulkAttendanceResponse, ImportAttendanceInput>({
      query: (body) => ({ url: '/import', method: 'POST', body }),
      transformResponse: (r: any) => asRecords(r) as BulkAttendanceResponse,
      invalidatesTags: ['Attendance', ...COMMON_TAGS],
    }),

    deleteAttendance: builder.mutation<GenericResponse, string>({
      query: (attendanceId) => ({ url: `/${attendanceId}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, attendanceId) => [
        { type: 'AttendanceDetail', id: attendanceId },
        'Attendance',
        ...COMMON_TAGS,
      ],
    }),

    /* ───────── 2. READS ───────── */

    getAttendanceById: builder.query<SingleAttendanceResponse, string>({
      query: (attendanceId) => `/${attendanceId}`,
      providesTags: (_r, _e, attendanceId) => [{ type: 'AttendanceDetail', id: attendanceId }],
    }),

    getStudentAttendanceByDate: builder.query<SingleAttendanceResponse, StudentDateParams>({
      query: ({ studentId, date }) => `/student/${studentId}/date/${date}`,
      providesTags: (_r, _e, { studentId }) => [{ type: 'StudentAttendance', id: studentId }],
    }),

    /** Student history — backend: attendanceRecords */
    getStudentHistory: builder.query<AttendanceListResponse, StudentHistoryParams>({
      query: ({ studentId, fromDate, toDate, status }) => ({
        url: `/student/${studentId}/history`,
        params: {
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
          ...(status ? { status } : {}),
        },
      }),
      transformResponse: (r: any) => asRecords(r) as AttendanceListResponse,
      providesTags: ['StudentAttendance'],
    }),

    getStudentStats: builder.query<StudentStatsResponse, string>({
      query: (studentId) => `/student/${studentId}/stats`,
      transformResponse: (r: any) => ({
        ...r,
        stats: { ...(r.stats ?? {}), totalDays: r.stats?.total ?? 0 },
      }),
      providesTags: ['StudentStats'],
    }),

    /** Class register for a day — backend: attendanceRecords (THE key fix) */
    getClassAttendanceByDate: builder.query<AttendanceListResponse, ClassDateParams>({
      query: ({ classId, date }) => `/class/${classId}/date/${date}`,
      transformResponse: (r: any) => asRecords(r) as AttendanceListResponse,
      providesTags: ['ClassAttendance'],
    }),

    getClassAttendanceSummary: builder.query<AttendanceSummaryResponse, ClassDateParams>({
      query: ({ classId, date }) => `/class/${classId}/date/${date}/summary`,
      transformResponse: (r: any) => {
        const s = r.summary ?? {};
        return {
          ...r,
          summary: {
            total: s.total ?? 0,
            counts: {
              Present: s.present ?? 0,
              Absent: s.absent ?? 0,
              Late: s.late ?? 0,
              Excused: s.excused ?? 0,
            },
            rate: s.attendanceRate,
          },
        } as AttendanceSummaryResponse;
      },
      providesTags: ['ClassAttendance'],
    }),

    getSchoolAttendanceByDate: builder.query<AttendanceListResponse, SchoolDateParams>({
      query: ({ schoolId, date }) => `/school/${schoolId}/date/${date}`,
      providesTags: ['SchoolAttendance'],
    }),

    getMonthlyRegister: builder.query<MonthlyRegisterResponse, MonthlyRegisterParams>({
      query: ({ classId, year, month }) => ({
        url: `/class/${classId}/register`,
        params: { year, month },
      }),
      transformResponse: (r: any) => ({
        ...r,
        register: (r.register ?? []).map((row: any) => {
          const list: Array<{ date: string; status: string }> = row.attendance ?? [];
          const days = Object.fromEntries(list.map((a) => [a.date, a.status]));
          const good = list.filter((a) => a.status === 'Present' || a.status === 'Late').length;
          return { ...row, days, attendanceRate: pctOf(good, list.length) };
        }),
      }),
      providesTags: ['Register'],
    }),

    getAbsentees: builder.query<AttendanceListResponse, SchoolDateParams>({
      query: ({ schoolId, date }) => ({ url: `/school/${schoolId}/absentees`, params: { date } }),
      transformResponse: (r: any) => asRecords(r, 'absentees') as AttendanceListResponse,
      providesTags: ['Absentees'],
    }),

    getLateArrivals: builder.query<AttendanceListResponse, SchoolDateParams>({
      query: ({ schoolId, date }) => ({ url: `/school/${schoolId}/late-arrivals`, params: { date } }),
      transformResponse: (r: any) => asRecords(r, 'lateArrivals') as AttendanceListResponse,
      providesTags: ['LateArrivals'],
    }),

    getChronicAbsentees: builder.query<ChronicAbsenteesResponse, ChronicAbsenteesParams>({
      query: ({ schoolId, threshold }) => ({
        url: `/school/${schoolId}/chronic-absentees`,
        params: threshold !== undefined ? { threshold } : {},
      }),
      transformResponse: (r: any) => ({
        ...r,
        threshold: r.stats?.threshold,
        students: (r.stats?.students ?? []).map((b: any) => ({ ...(b.student ?? {}), ...b })),
      }),
      providesTags: ['ChronicAbsentees'],
    }),

    getNotMarkedStudents: builder.query<NotMarkedResponse, ClassDateParams>({
      query: ({ classId, date }) => `/class/${classId}/date/${date}/not-marked`,
      transformResponse: (r: any) => ({
        ...r,
        students: r.stats?.studentsNotMarked ?? [],
        count: r.count ?? 0,
      }),
      providesTags: ['NotMarked'],
    }),

    getAuditTrail: builder.query<AuditTrailResponse, ClassDateParams>({
      query: ({ classId, date }) => `/class/${classId}/date/${date}/audit`,
      transformResponse: (r: any) => ({
        ...r,
        audit: (r.attendanceRecords ?? []).map((a: any) => ({
          id: a.id,
          action: a.markedByUser?.name ? `Marked by ${a.markedByUser.name}` : 'Marked',
          createdAt: a.updatedAt ?? a.createdAt,
          newValue: { status: a.status },
        })),
      }),
      providesTags: ['Audit'],
    }),

    /* ───────── 3. ANALYTICS ───────── */

    getClassAttendanceRate: builder.query<RateResponse, ClassRateParams>({
      query: ({ classId, fromDate, toDate }) => ({
        url: `/class/${classId}/rate`,
        params: { ...(fromDate ? { fromDate } : {}), ...(toDate ? { toDate } : {}) },
      }),
      transformResponse: (r: any) => ({ ...r, rate: r.summary?.attendanceRate }),
      providesTags: ['Analytics'],
    }),

    getCountByStatus: builder.query<ByStatusResponse, ByStatusParams>({
      query: ({ schoolId, date }) => ({
        url: `/school/${schoolId}/by-status`,
        params: date ? { date } : {},
      }),
      transformResponse: (r: any) => ({ ...r, counts: r.breakdown ?? {} }),
      providesTags: ['Analytics'],
    }),

    getClassTrend: builder.query<TrendResponse, ClassTrendParams>({
      query: ({ classId, days }) => ({
        url: `/class/${classId}/trend`,
        params: days !== undefined ? { days } : {},
      }),
      transformResponse: (r: any) => ({
        ...r,
        trend: (r.trend ?? []).map((t: any) => {
          const total = t.present + t.absent + t.late + t.excused;
          return { ...t, rate: pctOf(t.present + t.late, total) };
        }),
      }),
      providesTags: ['Analytics'],
    }),

    getAttendanceByGender: builder.query<ByGenderResponse, string>({
      query: (schoolId) => `/school/${schoolId}/by-gender`,
      transformResponse: (r: any) => ({ ...r, statistics: r.stats?.breakdown ?? {} }),
      providesTags: ['Analytics'],
    }),

    getSchoolAttendanceStats: builder.query<AttendanceResponse, string>({
      query: (schoolId) => `/school/${schoolId}/stats`,
      transformResponse: (r: any) => ({ ...r, statistics: r.stats ?? {} }),
      providesTags: ['Analytics'],
    }),

    getAttendanceComparison: builder.query<ComparisonResponse, string>({
      query: (schoolId) => `/school/${schoolId}/comparison`,
      transformResponse: (r: any) => ({ ...r, statistics: r.stats ?? {} }),
      providesTags: ['Analytics'],
    }),

    /* ───────── 4. HELPERS ───────── */

    validateAttendanceDate: builder.query<ValidateDateResponse, ValidateDateParams>({
      query: ({ schoolId, date }) => ({
        url: `/school/${schoolId}/validate-date`,
        params: { date },
      }),
      // Backend returns 400 + success:false for invalid dates; the UI reads `valid`.
      transformResponse: (r: any) => ({ ...r, valid: r.success !== false }),
      transformErrorResponse: (res: any) => res,
    }),

    canUserMarkClass: builder.query<CanMarkResponse, CanMarkParams>({
      query: ({ userId, classId }) => `/user/${userId}/class/${classId}/can-mark`,
      // Handles both the old (success flag) and patched (canMark flag) backend.
      transformResponse: (r: any) => ({
        ...r,
        canMark: r.canMark ?? r.success !== false,
        reason: r.reason ?? (r.success === false ? r.message : undefined),
      }),
    }),

    getAttendanceSettings: builder.query<SettingsResponse, string>({
      query: (schoolId) => `/school/${schoolId}/settings`,
      transformResponse: (r: any) => ({ ...r, settings: r.stats ?? r.settings ?? {} }),
      providesTags: ['Settings'],
    }),
  }),
});

/* ═══════════════ HOOKS ═══════════════ */

export const {
  useMarkAttendanceMutation,
  useBulkMarkAttendanceMutation,
  useUpsertAttendanceMutation,
  useUpdateAttendanceMutation,
  useAutoMarkAbsentMutation,
  useCopyAttendanceMutation,
  useImportAttendanceMutation,
  useDeleteAttendanceMutation,

  useGetAttendanceByIdQuery,
  useGetStudentAttendanceByDateQuery,
  useGetStudentHistoryQuery,
  useGetStudentStatsQuery,
  useGetClassAttendanceByDateQuery,
  useGetClassAttendanceSummaryQuery,
  useGetSchoolAttendanceByDateQuery,
  useGetMonthlyRegisterQuery,
  useGetAbsenteesQuery,
  useGetLateArrivalsQuery,
  useGetChronicAbsenteesQuery,
  useGetNotMarkedStudentsQuery,
  useGetAuditTrailQuery,

  useGetClassAttendanceRateQuery,
  useGetCountByStatusQuery,
  useGetClassTrendQuery,
  useGetAttendanceByGenderQuery,
  useGetSchoolAttendanceStatsQuery,
  useGetAttendanceComparisonQuery,

  useValidateAttendanceDateQuery,
  useLazyValidateAttendanceDateQuery,
  useCanUserMarkClassQuery,
  useGetAttendanceSettingsQuery,
} = attendanceApi;