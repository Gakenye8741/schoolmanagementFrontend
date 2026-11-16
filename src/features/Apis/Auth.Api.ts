import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include',
  }),
  tagTypes: ['Auth', 'User', 'Sessions'],
  endpoints: (builder) => ({
    /* ═══════════════════════════════════════════
       BOOTSTRAP REGISTRATION (super-admin only)
       ═══════════════════════════════════════════ */

    /** POST /auth/register/super-admin — bootstrap (works once, no auth required) */
    registerSuperAdmin: builder.mutation({
      query: (superAdminPayload) => ({
        url: 'auth/register/super-admin',
        method: 'POST',
        body: superAdminPayload,
      }),
    }),

    /** POST /auth/register/school-admin — requires super_admin token */
    registerSchoolAdmin: builder.mutation({
      query: (schoolAdminPayload) => ({
        url: 'auth/register/school-admin',
        method: 'POST',
        body: schoolAdminPayload,
      }),
      invalidatesTags: ['User'],
    }),

    /* ═══════════════════════════════════════════
       LOGIN / LOGOUT / SESSIONS
       ═══════════════════════════════════════════ */

    /** POST /auth/login */
    loginUser: builder.mutation({
      query: (loginCredentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: loginCredentials,
      }),
      invalidatesTags: ['Auth', 'User', 'Sessions'],
    }),

    /** POST /auth/logout — clears the HttpOnly cookie */
    logoutUser: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User', 'Sessions'],
    }),

    /** POST /auth/logout-all — kill every active session */
    logoutAllSessions: builder.mutation({
      query: () => ({
        url: 'auth/logout-all',
        method: 'POST',
      }),
      invalidatesTags: ['Auth', 'User', 'Sessions'],
    }),

    /** GET /auth/sessions — list my active sessions */
    getMySessions: builder.query({
      query: () => 'auth/sessions',
      providesTags: ['Sessions'],
    }),

    /* ═══════════════════════════════════════════
       PASSWORD MANAGEMENT
       ═══════════════════════════════════════════ */

    /** POST /auth/forgot-password */
    forgotPassword: builder.mutation({
      query: (emailPayload) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: emailPayload,
      }),
    }),

    /** POST /auth/reset-password */
    resetPassword: builder.mutation({
      query: (resetPayload) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body: resetPayload,
      }),
    }),

    /** POST /auth/change-password — authenticated via cookie */
    changePassword: builder.mutation({
      query: (passwordPayload) => ({
        url: 'auth/change-password',
        method: 'POST',
        body: passwordPayload,
      }),
      invalidatesTags: ['User', 'Sessions'],
    }),

    /* ═══════════════════════════════════════════
       PROFILE
       ═══════════════════════════════════════════ */

    /** GET /auth/profile — current user's own profile */
    getMyProfile: builder.query({
      query: () => 'auth/profile',
      providesTags: ['User'],
    }),

    /** GET /auth/profile/{userId} — admin viewing another user */
    getUserProfile: builder.query({
      query: (userId: string) => `auth/profile/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: 'User', id: userId }, 'User'],
    }),

    /** PUT /auth/profile — update current user's own profile */
    updateMyProfile: builder.mutation({
      query: (patch) => ({
        url: 'auth/profile',
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['User'],
    }),

    /** PUT /auth/profile/{userId} — admin editing another user */
    updateUserProfile: builder.mutation({
      query: ({ userId, ...patch }) => ({
        url: `auth/profile/${userId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { userId }) => [{ type: 'User', id: userId }, 'User'],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  useRegisterSuperAdminMutation,
  useRegisterSchoolAdminMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useLogoutAllSessionsMutation,
  useGetMySessionsQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetMyProfileQuery,
  useGetUserProfileQuery,
  useUpdateMyProfileMutation,
  useUpdateUserProfileMutation,
} = authApi;