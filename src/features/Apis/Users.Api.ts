import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  roles?: string[];
  schoolId?: string | null;
  phone?: string;
  tscNumber?: string;
  avatarUrl?: string;
  isActive?: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  [key: string]: any;
}

interface UsersResponse {
  data?: User[];
  students?: User[];
  users?: User[];
  total?: number;
  page?: number;
  limit?: number;
  [key: string]: any;
}

interface BulkStatusRequest {
  schoolId: string;
  userIds: string[];
  isActive: boolean;
}

interface UpdateUserRequest {
  userId: string;
  body: Partial<User>;
}

interface UpdateStatusRequest {
  userId: string;
  isActive: boolean;
}

/** Params for the school-scoped user list */
interface SchoolUsersQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean | string;
  includeStudents?: boolean | string;
  search?: string;
}

/** Params for the super-admin admin/users list */
interface AdminUsersQueryParams {
  page?: number;
  limit?: number;
  schoolId?: string;
  role?: string;
  isActive?: boolean | string;
  search?: string;
}

interface SchoolUserStatsResponse {
  success: boolean;
  stats: {
    total: number;
    active: number;
    inactive: number;
    byRole?: Record<string, number>;
    neverLoggedIn?: number;
    mustChangePassword?: number;
    [key: string]: any;
  };
}

interface UserSessionsResponse {
  success: boolean;
  sessions: Array<{
    id: string;
    createdAt: string;
    lastUsedAt?: string | null;
    userAgent?: string;
    ipAddress?: string;
    isActive: boolean;
    revokedAt?: string | null;
    [key: string]: any;
  }>;
}

interface GenericResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api`,
    credentials: 'include',
  }),
  tagTypes: ['User', 'UserSessions', 'UserStats'],
  endpoints: (builder) => ({

    /* ──────────────────────────────────────────────
       SUPER ADMIN — system-wide user view
       GET /admin/users
       Supports: page, limit, schoolId, role, isActive, search
       ────────────────────────────────────────────── */
    getAllUsersBySuperAdmin: builder.query<
      UsersResponse | User[],
      AdminUsersQueryParams | void
    >({
      query: (params) => ({
        url: '/admin/users',
        params: params || {},
      }),
      providesTags: ['User'],
    }),

    /* ──────────────────────────────────────────────
       SCHOOL ADMIN — create users
       POST /schools/{schoolId}/users
       ────────────────────────────────────────────── */
    createSchoolUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: `/schools/${body.schoolId}/users`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    /* POST /schools/{schoolId}/users/bulk */
    bulkCreateSchoolUsers: builder.mutation<
      { success: boolean; users: User[]; errors?: any[] },
      { schoolId: string; users: Array<Partial<User>> }
    >({
      query: ({ schoolId, users }) => ({
        url: `/schools/${schoolId}/users/bulk`,
        method: 'POST',
        body: { schoolId, users },
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    /* ──────────────────────────────────────────────
       READ — school-scoped
       GET /schools/{schoolId}/users
       Filters: page, limit, role, isActive, includeStudents, search
       ────────────────────────────────────────────── */
    getSchoolUsers: builder.query<
      UsersResponse | User[],
      { schoolId: string; params?: SchoolUsersQueryParams }
    >({
      query: ({ schoolId, params }) => ({
        url: `/schools/${schoolId}/users`,
        params: params || {},
      }),
      providesTags: ['User'],
    }),

    /* GET /schools/{schoolId}/users/by-role/{role} */
    getSchoolUsersByRole: builder.query<
      User[] | UsersResponse,
      { schoolId: string; role: string }
    >({
      query: ({ schoolId, role }) => `/schools/${schoolId}/users/by-role/${role}`,
      providesTags: ['User'],
    }),

    /* GET /schools/{schoolId}/users/search?q=...&role=... */
    searchSchoolUsers: builder.query<
      User[] | UsersResponse,
      { schoolId: string; q: string; role?: string }
    >({
      query: ({ schoolId, q, role }) => ({
        url: `/schools/${schoolId}/users/search`,
        params: { q, ...(role ? { role } : {}) },
      }),
      providesTags: ['User'],
    }),

    /* ──────────────────────────────────────────────
       UPDATE — profile (PATCH per .http)
       ────────────────────────────────────────────── */
    updateUserProfile: builder.mutation<
      User,
      { userId: string; body: Partial<User> }
    >({
      query: ({ userId, body }) => ({
        url: `/users/${userId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    /* ──────────────────────────────────────────────
       ROLES — primary + multi-role
       ────────────────────────────────────────────── */
    /* PATCH /users/{userId}/role — change primary */
    changePrimaryRole: builder.mutation<
      User,
      { userId: string; role: string }
    >({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    /* PUT /users/{userId}/roles — replace all */
    replaceUserRoles: builder.mutation<
      User,
      { userId: string; roles: string[]; primaryRole: string }
    >({
      query: ({ userId, roles, primaryRole }) => ({
        url: `/users/${userId}/roles`,
        method: 'PUT',
        body: { roles, primaryRole },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    /* POST /users/{userId}/roles/add */
    addUserRole: builder.mutation<User, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/roles/add`,
        method: 'POST',
        body: { role },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    /* POST /users/{userId}/roles/remove */
    removeUserRole: builder.mutation<User, { userId: string; role: string }>({
      query: ({ userId, role }) => ({
        url: `/users/${userId}/roles/remove`,
        method: 'POST',
        body: { role },
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    /* ──────────────────────────────────────────────
       STATUS — activate / deactivate (single + bulk)
       ────────────────────────────────────────────── */
    /* POST /users/{userId}/deactivate */
    deactivateUser: builder.mutation<GenericResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}/deactivate`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, userId) => [
        { type: 'User', id: userId },
        'User',
        'UserStats',
      ],
    }),

    /* POST /users/{userId}/activate */
    activateUser: builder.mutation<GenericResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}/activate`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, userId) => [
        { type: 'User', id: userId },
        'User',
        'UserStats',
      ],
    }),

    /* POST /users/bulk-deactivate */
    bulkDeactivateUsers: builder.mutation<
      GenericResponse,
      { userIds: string[] }
    >({
      query: (body) => ({
        url: '/users/bulk-deactivate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    /* POST /users/bulk-activate */
    bulkActivateUsers: builder.mutation<GenericResponse, { userIds: string[] }>({
      query: (body) => ({
        url: '/users/bulk-activate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    /* ──────────────────────────────────────────────
       PASSWORD
       ────────────────────────────────────────────── */
    /* POST /users/{userId}/reset-password */
    resetUserPassword: builder.mutation<
      GenericResponse,
      {
        userId: string;
        newPassword: string;
        mustChangePassword?: boolean;
        revokeSessions?: boolean;
      }
    >({
      query: ({ userId, ...body }) => ({
        url: `/users/${userId}/reset-password`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { userId }) => [
        { type: 'User', id: userId },
        'UserSessions',
      ],
    }),

    /* POST /users/{userId}/force-password-change */
    forcePasswordChange: builder.mutation<GenericResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}/force-password-change`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, userId) => [{ type: 'User', id: userId }, 'User'],
    }),

    /* POST /users/{userId}/clear-must-change-password */
    clearMustChangePassword: builder.mutation<GenericResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}/clear-must-change-password`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, userId) => [{ type: 'User', id: userId }, 'User'],
    }),

    /* ──────────────────────────────────────────────
       SESSIONS
       ────────────────────────────────────────────── */
    /* GET /users/{userId}/sessions?activeOnly=true|false */
    getUserSessions: builder.query<
      UserSessionsResponse,
      { userId: string; activeOnly?: boolean }
    >({
      query: ({ userId, activeOnly }) => ({
        url: `/users/${userId}/sessions`,
        params: activeOnly !== undefined ? { activeOnly } : {},
      }),
      providesTags: (_r, _e, { userId }) => [
        { type: 'UserSessions', id: userId },
      ],
    }),

    /* POST /users/{userId}/sessions/revoke-all */
    revokeAllUserSessions: builder.mutation<GenericResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}/sessions/revoke-all`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, userId) => [
        { type: 'UserSessions', id: userId },
      ],
    }),

    /* ──────────────────────────────────────────────
       STATS
       ────────────────────────────────────────────── */
    /* GET /schools/{schoolId}/users/stats */
    getSchoolUserStats: builder.query<SchoolUserStatsResponse, string>({
      query: (schoolId) => `/schools/${schoolId}/users/stats`,
      providesTags: ['UserStats'],
    }),

    /* GET /schools/{schoolId}/users/by-role/{role}/count */
    getSchoolUserCountByRole: builder.query<
      { count: number },
      { schoolId: string; role: string }
    >({
      query: ({ schoolId, role }) =>
        `/schools/${schoolId}/users/by-role/${role}/count`,
      providesTags: ['UserStats'],
    }),

    /* GET /schools/{schoolId}/users/recently-active?withinDays=7 */
    getRecentlyActiveUsers: builder.query<
      User[] | UsersResponse,
      { schoolId: string; withinDays?: number }
    >({
      query: ({ schoolId, withinDays = 7 }) => ({
        url: `/schools/${schoolId}/users/recently-active`,
        params: { withinDays },
      }),
      providesTags: ['User'],
    }),

    /* GET /schools/{schoolId}/users/never-logged-in */
    getNeverLoggedInUsers: builder.query<User[] | UsersResponse, string>({
      query: (schoolId) => `/schools/${schoolId}/users/never-logged-in`,
      providesTags: ['User'],
    }),

    /* GET /schools/{schoolId}/users/export (super admin only) */
    exportSchoolUsers: builder.query<any, string>({
      query: (schoolId) => `/schools/${schoolId}/users/export`,
    }),

    /* ──────────────────────────────────────────────
       DELETE / RESTORE
       ────────────────────────────────────────────── */
    /* POST /users/{userId}/restore */
    restoreUser: builder.mutation<GenericResponse, string>({
      query: (userId) => ({
        url: `/users/${userId}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    /* ══════════════════════════════════════════════════════
       EXISTING ENDPOINTS (preserved exactly — not changed)
       ══════════════════════════════════════════════════════ */

    getUsers: builder.query<UsersResponse | User[], Record<string, any> | void>({
      query: (params) => ({
        url: '/users',
        params: params || {},
      }),
      providesTags: ['User'],
    }),

    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    getUserByEmail: builder.query<User, { email: string; schoolId?: string }>({
      query: ({ email, schoolId }) => ({
        url: '/users/email',
        params: { email, ...(schoolId && { schoolId }) },
      }),
      providesTags: ['User'],
    }),

    getTeachersBySchool: builder.query<User[] | UsersResponse, string | void>({
      query: (schoolId) => ({
        url: '/users/teachers',
        params: schoolId ? { schoolId } : {},
      }),
      providesTags: ['User'],
    }),

    getStudentsBySchool: builder.query<User[] | UsersResponse, string | void>({
      query: (schoolId) => ({
        url: '/users/students',
        params: schoolId ? { schoolId } : {},
      }),
      providesTags: ['User'],
    }),

    getStudentsByClassId: builder.query<User[] | UsersResponse, string>({
      query: (classId) => `/users/students/class/${classId}`,
      providesTags: ['User'],
    }),

    checkAdmissionNumber: builder.query<
      { available: boolean; [key: string]: any },
      { admissionNumber: string; schoolId: string }
    >({
      query: ({ admissionNumber, schoolId }) => ({
        url: '/users/check-admission',
        params: { admissionNumber, schoolId },
      }),
    }),

    bulkUpdateUserStatus: builder.mutation<any, BulkStatusRequest>({
      query: ({ schoolId, ...body }) => ({
        url: `/users/status/bulk?schoolId=${schoolId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    getUserCountByRole: builder.query<
      { count: number },
      { role: string; schoolId: string }
    >({
      query: ({ role, schoolId }) => ({
        url: `/users/role/${role}/count`,
        params: { schoolId },
      }),
    }),

    getUserById: builder.query<User, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),

    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: ({ userId, body }) => ({
        url: `/users/${userId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    deleteUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User', 'UserStats'],
    }),

    updateUserStatus: builder.mutation<User, UpdateStatusRequest>({
      query: ({ userId, isActive }) => ({
        url: `/users/${userId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'User', id: userId },
        'User',
      ],
    }),

    getStudentProfileByUserId: builder.query<any, string>({
      query: (userId) => `/users/${userId}/student-profile`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Existing (unchanged) ── */
  useGetUsersQuery,
  useGetAllUsersBySuperAdminQuery,
  useCreateUserMutation,
  useGetUserByEmailQuery,
  useGetTeachersBySchoolQuery,
  useGetStudentsBySchoolQuery,
  useGetStudentsByClassIdQuery,
  useCheckAdmissionNumberQuery,
  useBulkUpdateUserStatusMutation,
  useGetUserCountByRoleQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useGetStudentProfileByUserIdQuery,

  /* ── NEW: Create (school-scoped) ── */
  useCreateSchoolUserMutation,
  useBulkCreateSchoolUsersMutation,

  /* ── NEW: Read (school-scoped) ── */
  useGetSchoolUsersQuery,
  useGetSchoolUsersByRoleQuery,
  useSearchSchoolUsersQuery,

  /* ── NEW: Update ── */
  useUpdateUserProfileMutation,

  /* ── NEW: Roles ── */
  useChangePrimaryRoleMutation,
  useReplaceUserRolesMutation,
  useAddUserRoleMutation,
  useRemoveUserRoleMutation,

  /* ── NEW: Status (single + bulk) ── */
  useDeactivateUserMutation,
  useActivateUserMutation,
  useBulkDeactivateUsersMutation,
  useBulkActivateUsersMutation,

  /* ── NEW: Password ── */
  useResetUserPasswordMutation,
  useForcePasswordChangeMutation,
  useClearMustChangePasswordMutation,

  /* ── NEW: Sessions ── */
  useGetUserSessionsQuery,
  useRevokeAllUserSessionsMutation,

  /* ── NEW: Stats ── */
  useGetSchoolUserStatsQuery,
  useGetSchoolUserCountByRoleQuery,
  useGetRecentlyActiveUsersQuery,
  useGetNeverLoggedInUsersQuery,
  useExportSchoolUsersQuery,

  /* ── NEW: Restore ── */
  useRestoreUserMutation,
} = usersApi;