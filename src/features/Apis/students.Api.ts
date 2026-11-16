import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface Student {
  id: string;
  schoolId: string;
  userId?: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender: 'Male' | 'Female' | string;
  dateOfBirth?: string;
  upiNumber?: string;
  classId?: string | null;
  email?: string;
  status?: string;
  isEnrolled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  [key: string]: any;
}

export interface Guardian {
  guardianUserId: string;
  relationship?: string;
  isPrimary?: boolean;
  isFeePayer?: boolean;
  canPickup?: boolean;
  [key: string]: any;
}

export interface EnrollmentHistoryRecord {
  id: string;
  studentId: string;
  classId: string;
  action?: string;
  reason?: string;
  createdAt?: string;
  [key: string]: any;
}

interface GenericResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface SingleStudentResponse {
  success: boolean;
  message?: string;
  student: Student;
  [key: string]: any;
}

interface StudentListResponse {
  success: boolean;
  count?: number;
  students: Student[];
  [key: string]: any;
}

interface CountResponse {
  success: boolean;
  count: number;
  [key: string]: any;
}

interface GenderBreakdownResponse {
  success: boolean;
  male: number;
  female: number;
  other?: number;
  total?: number;
  [key: string]: any;
}

interface StudentStatsResponse {
  success: boolean;
  stats: Record<string, any>;
  [key: string]: any;
}

interface ValidateResponse {
  success: boolean;
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  [key: string]: any;
}

interface GuardianListResponse {
  success: boolean;
  guardians: Guardian[];
  [key: string]: any;
}

interface DocumentRecord {
  id: string;
  studentId: string;
  category: string;
  title: string;
  fileUrl: string;
  isVisibleToParent?: boolean;
  [key: string]: any;
}

interface HealthRecord {
  id: string;
  studentId: string;
  recordType: string;
  title: string;
  description?: string;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const studentApi = createApi({
  reducerPath: 'studentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/students`,
    credentials: 'include',
  }),
  tagTypes: [
    'Student',
    'EnrollmentHistory',
    'Guardian',
    'Document',
    'Health',
    'StudentStats',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════
       1. REGISTRATION
       ═══════════════════════════════════════════ */

    /** POST /students — register a new student (optionally with classId) */
    createStudent: builder.mutation<SingleStudentResponse, Partial<Student>>({
      query: (newStudentData) => ({
        url: '/',
        method: 'POST',
        body: newStudentData,
      }),
      invalidatesTags: ['Student', 'StudentStats'],
    }),

    /* ═══════════════════════════════════════════
       2. READS
       ═══════════════════════════════════════════ */

    /** GET /students/{studentId} */
    getStudentById: builder.query<Student, string>({
      query: (studentId) => `/${studentId}`,
      providesTags: (_r, _e, studentId) => [{ type: 'Student', id: studentId }],
    }),

    /** GET /students/{studentId}/with-relations — full record incl. class, guardians, etc. */
    getStudentWithRelations: builder.query<any, string>({
      query: (studentId) => `/${studentId}/with-relations`,
      providesTags: (_r, _e, studentId) => [{ type: 'Student', id: studentId }],
    }),

    /** GET /students/user/{userId} — find student by their User ID */
    getStudentByUserId: builder.query<Student, string>({
      query: (userId) => `/user/${userId}`,
      providesTags: ['Student'],
    }),

    /** GET /students/school/{schoolId}/admission?admissionNumber=… */
    getStudentByAdmissionNumber: builder.query<
      Student,
      { schoolId: string; admissionNumber: string }
    >({
      query: ({ schoolId, admissionNumber }) => ({
        url: `/school/${schoolId}/admission`,
        params: { admissionNumber },
      }),
      providesTags: ['Student'],
    }),

    /** GET /students/school/{schoolId} — list all students in a school */
    getStudentsBySchool: builder.query<StudentListResponse | Student[], string>({
      query: (schoolId) => `/school/${schoolId}`,
      providesTags: ['Student'],
    }),

    /** GET /students/class/{classId} — list all students in a class */
    getStudentsByClass: builder.query<StudentListResponse | Student[], string>({
      query: (classId) => `/class/${classId}`,
      providesTags: ['Student'],
    }),

    /** GET /students/school/{schoolId}/search?query=… */
    searchStudents: builder.query<
      StudentListResponse | Student[],
      { schoolId: string; query: string }
    >({
      query: ({ schoolId, query }) => ({
        url: `/school/${schoolId}/search`,
        params: { query },
      }),
      providesTags: ['Student'],
    }),

    /* ═══════════════════════════════════════════
       3. UPDATE / DELETE / RESTORE
       ═══════════════════════════════════════════ */

    /** PUT /students/{studentId} */
    updateStudent: builder.mutation<
      SingleStudentResponse,
      { studentId: string; [key: string]: any }
    >({
      query: ({ studentId, ...patchData }) => ({
        url: `/${studentId}`,
        method: 'PUT',
        body: patchData,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
      ],
    }),

    /** DELETE /students/{studentId} — soft delete */
    deleteStudent: builder.mutation<GenericResponse, string>({
      query: (studentId) => ({
        url: `/${studentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Student', 'StudentStats'],
    }),

    /** POST /students/{studentId}/restore */
    restoreStudent: builder.mutation<SingleStudentResponse, string>({
      query: (studentId) => ({
        url: `/${studentId}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Student', 'StudentStats'],
    }),

    /* ═══════════════════════════════════════════
       4. LIFECYCLE
       ═══════════════════════════════════════════ */

    /** POST /students/{studentId}/class — enroll unplaced student in a class */
    enrollStudentInClass: builder.mutation<
      SingleStudentResponse,
      { studentId: string; classId: string; requireUnplaced?: boolean }
    >({
      query: ({ studentId, classId, requireUnplaced = true }) => ({
        url: `/${studentId}/class`,
        method: 'POST',
        body: { classId, requireUnplaced },
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
      ],
    }),

    /** POST /students/{studentId}/withdraw */
    withdrawStudent: builder.mutation<
      SingleStudentResponse,
      { studentId: string; reason?: string }
    >({
      query: ({ studentId, reason }) => ({
        url: `/${studentId}/withdraw`,
        method: 'POST',
        body: reason ? { reason } : {},
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
        'StudentStats',
      ],
    }),

    /** POST /students/{studentId}/re-enroll */
    reEnrollStudent: builder.mutation<SingleStudentResponse, string>({
      query: (studentId) => ({
        url: `/${studentId}/re-enroll`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, studentId) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
      ],
    }),

    /** POST /students/{studentId}/promote */
    promoteStudent: builder.mutation<
      SingleStudentResponse,
      { studentId: string; [key: string]: any }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/promote`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
      ],
    }),

    /** POST /students/{studentId}/graduate — final grade only */
    graduateStudent: builder.mutation<
      SingleStudentResponse,
      { studentId: string; [key: string]: any }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/graduate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
        'StudentStats',
      ],
    }),

    /** POST /students/{studentId}/repeat */
    repeatGrade: builder.mutation<
      SingleStudentResponse,
      { studentId: string; [key: string]: any }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/repeat`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
      ],
    }),

    /** POST /students/{studentId}/transfer-out */
    transferOutStudent: builder.mutation<
      SingleStudentResponse,
      { studentId: string; toSchool: string; reason?: string }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/transfer-out`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
        'EnrollmentHistory',
        'StudentStats',
      ],
    }),

    /** POST /students/bulk-promote — promote an entire class */
    bulkPromoteClass: builder.mutation<
      GenericResponse,
      { schoolId: string; fromClassId: string; toClassId: string }
    >({
      query: (body) => ({
        url: '/bulk-promote',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Student', 'EnrollmentHistory', 'StudentStats'],
    }),

    /* ═══════════════════════════════════════════
       5. GUARDIANS
       ═══════════════════════════════════════════ */

    /** POST /students/{studentId}/guardians */
    addGuardian: builder.mutation<
      GenericResponse,
      { studentId: string; guardianUserId: string; relationship?: string; isPrimary?: boolean; isFeePayer?: boolean; canPickup?: boolean }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/guardians`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Guardian', id: studentId },
        { type: 'Student', id: studentId },
      ],
    }),

    /** GET /students/{studentId}/guardians */
    getStudentGuardians: builder.query<GuardianListResponse, string>({
      query: (studentId) => `/${studentId}/guardians`,
      providesTags: (_r, _e, studentId) => [{ type: 'Guardian', id: studentId }],
    }),

    /** PUT /students/{studentId}/guardians/primary */
    setPrimaryGuardian: builder.mutation<
      GenericResponse,
      { studentId: string; guardianUserId: string }
    >({
      query: ({ studentId, guardianUserId }) => ({
        url: `/${studentId}/guardians/primary`,
        method: 'PUT',
        body: { guardianUserId },
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Guardian', id: studentId },
      ],
    }),

    /** PUT /students/{studentId}/guardians/{guardianUserId} */
    updateGuardian: builder.mutation<
      GenericResponse,
      { studentId: string; guardianUserId: string; [key: string]: any }
    >({
      query: ({ studentId, guardianUserId, ...body }) => ({
        url: `/${studentId}/guardians/${guardianUserId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Guardian', id: studentId },
      ],
    }),

    /** GET /students/guardian/{guardianUserId} — all students for one guardian */
    getStudentsByGuardian: builder.query<StudentListResponse | Student[], string>({
      query: (guardianUserId) => `/guardian/${guardianUserId}`,
      providesTags: ['Student', 'Guardian'],
    }),

    /** DELETE /students/{studentId}/guardians */
    removeGuardian: builder.mutation<
      GenericResponse,
      { studentId: string; guardianUserId: string }
    >({
      query: ({ studentId, guardianUserId }) => ({
        url: `/${studentId}/guardians`,
        method: 'DELETE',
        body: { guardianUserId },
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Guardian', id: studentId },
      ],
    }),

    /* ═══════════════════════════════════════════
       6. ENROLLMENT HISTORY
       ═══════════════════════════════════════════ */

    /** POST /students/enrollment-history — manual history entry (existing endpoint) */
    createEnrollmentHistory: builder.mutation<
      GenericResponse,
      Partial<EnrollmentHistoryRecord>
    >({
      query: (historyData) => ({
        url: '/enrollment-history',
        method: 'POST',
        body: historyData,
      }),
      invalidatesTags: ['EnrollmentHistory'],
    }),

    /** GET /students/{studentId}/enrollment-history (existing endpoint) */
    getStudentEnrollmentHistory: builder.query<
      EnrollmentHistoryRecord[] | { history: EnrollmentHistoryRecord[] },
      string
    >({
      query: (studentId) => `/${studentId}/enrollment-history`,
      providesTags: (_r, _e, studentId) => [
        { type: 'EnrollmentHistory', id: studentId },
      ],
    }),

    /** GET /students/{studentId}/enrollments — full enrollment history */
    getStudentEnrollments: builder.query<
      EnrollmentHistoryRecord[] | { enrollments: EnrollmentHistoryRecord[] },
      string
    >({
      query: (studentId) => `/${studentId}/enrollments`,
      providesTags: (_r, _e, studentId) => [
        { type: 'EnrollmentHistory', id: studentId },
      ],
    }),

    /** GET /students/{studentId}/enrollments/current */
    getCurrentEnrollment: builder.query<
      EnrollmentHistoryRecord | null,
      string
    >({
      query: (studentId) => `/${studentId}/enrollments/current`,
      providesTags: (_r, _e, studentId) => [
        { type: 'EnrollmentHistory', id: studentId },
      ],
    }),

    /* ═══════════════════════════════════════════
       7. DOCUMENTS
       ═══════════════════════════════════════════ */

    /** POST /students/{studentId}/documents */
    addStudentDocument: builder.mutation<
      GenericResponse,
      {
        studentId: string;
        schoolId: string;
        category: string;
        title: string;
        fileUrl: string;
        isVisibleToParent?: boolean;
        [key: string]: any;
      }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/documents`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Document', id: studentId },
      ],
    }),

    /** GET /students/{studentId}/documents */
    getStudentDocuments: builder.query<
      DocumentRecord[] | { documents: DocumentRecord[] },
      string
    >({
      query: (studentId) => `/${studentId}/documents`,
      providesTags: (_r, _e, studentId) => [{ type: 'Document', id: studentId }],
    }),

    /* ═══════════════════════════════════════════
       8. HEALTH RECORDS
       ═══════════════════════════════════════════ */

    /** POST /students/{studentId}/health */
    addHealthRecord: builder.mutation<
      GenericResponse,
      {
        studentId: string;
        schoolId: string;
        recordType: string;
        title: string;
        description?: string;
        [key: string]: any;
      }
    >({
      query: ({ studentId, ...body }) => ({
        url: `/${studentId}/health`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { studentId }) => [
        { type: 'Health', id: studentId },
      ],
    }),

    /** GET /students/{studentId}/health */
    getStudentHealthRecords: builder.query<
      HealthRecord[] | { records: HealthRecord[] },
      string
    >({
      query: (studentId) => `/${studentId}/health`,
      providesTags: (_r, _e, studentId) => [{ type: 'Health', id: studentId }],
    }),

    /* ═══════════════════════════════════════════
       9. STATS
       ═══════════════════════════════════════════ */

    /** GET /students/school/{schoolId}/count */
    getStudentCountBySchool: builder.query<CountResponse, string>({
      query: (schoolId) => `/school/${schoolId}/count`,
      providesTags: ['StudentStats'],
    }),

    /** GET /students/class/{classId}/count */
    getStudentCountByClass: builder.query<CountResponse, string>({
      query: (classId) => `/class/${classId}/count`,
      providesTags: ['StudentStats'],
    }),

    /** GET /students/school/{schoolId}/by-gender */
    getGenderBreakdown: builder.query<GenderBreakdownResponse, string>({
      query: (schoolId) => `/school/${schoolId}/by-gender`,
      providesTags: ['StudentStats'],
    }),

    /** GET /students/{studentId}/statistics */
    getStudentStatistics: builder.query<StudentStatsResponse, string>({
      query: (studentId) => `/${studentId}/statistics`,
      providesTags: (_r, _e, studentId) => [
        { type: 'StudentStats', id: studentId },
      ],
    }),

    /** GET /students/{studentId}/validate — sanity-check record integrity */
    validateStudent: builder.query<ValidateResponse, string>({
      query: (studentId) => `/${studentId}/validate`,
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Existing (unchanged) ── */
  useCreateStudentMutation,
  useGetStudentsBySchoolQuery,
  useGetStudentByIdQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useCreateEnrollmentHistoryMutation,
  useGetStudentEnrollmentHistoryQuery,

  /* ── NEW: Reads ── */
  useGetStudentWithRelationsQuery,
  useGetStudentByUserIdQuery,
  useGetStudentByAdmissionNumberQuery,
  useGetStudentsByClassQuery,
  useSearchStudentsQuery,

  /* ── NEW: Restore ── */
  useRestoreStudentMutation,

  /* ── NEW: Lifecycle ── */
  useEnrollStudentInClassMutation,
  useWithdrawStudentMutation,
  useReEnrollStudentMutation,
  usePromoteStudentMutation,
  useGraduateStudentMutation,
  useRepeatGradeMutation,
  useTransferOutStudentMutation,
  useBulkPromoteClassMutation,

  /* ── NEW: Guardians ── */
  useAddGuardianMutation,
  useGetStudentGuardiansQuery,
  useSetPrimaryGuardianMutation,
  useUpdateGuardianMutation,
  useGetStudentsByGuardianQuery,
  useRemoveGuardianMutation,

  /* ── NEW: Enrollments ── */
  useGetStudentEnrollmentsQuery,
  useGetCurrentEnrollmentQuery,

  /* ── NEW: Documents ── */
  useAddStudentDocumentMutation,
  useGetStudentDocumentsQuery,

  /* ── NEW: Health ── */
  useAddHealthRecordMutation,
  useGetStudentHealthRecordsQuery,

  /* ── NEW: Stats ── */
  useGetStudentCountBySchoolQuery,
  useGetStudentCountByClassQuery,
  useGetGenderBreakdownQuery,
  useGetStudentStatisticsQuery,
  useValidateStudentQuery,
} = studentApi;