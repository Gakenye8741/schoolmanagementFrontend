import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
     baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include', // CRITICAL: Ensures browser sends and receives HttpOnly cookies automatically
  }),
  tagTypes: ['Auth', 'User', 'SchoolUsers'],
  endpoints: (builder) => ({
    // 🏢 1. Register a Super Admin
    registerSuperAdmin: builder.mutation({
      query: (superAdminPayload) => ({
        url: 'auth/register/super-admin',
        method: 'POST',
        body: superAdminPayload,
      }),
    }),

    // 🏫 2. Register a School Admin
    registerSchoolAdmin: builder.mutation({
      query: (schoolAdminPayload) => ({
        url: 'auth/register/school-admin',
        method: 'POST',
        body: schoolAdminPayload,
      }),
    }),

    // 👥 3-6. Register a School Member (Teacher, Student, Bursar, Parent)
    registerSchoolMember: builder.mutation({
      query: (memberPayload) => ({
        url: 'auth/register/member',
        method: 'POST',
        body: memberPayload,
      }),
    }),

    // 🔑 7. Login User
    loginUser: builder.mutation({
      query: (loginCredentials) => ({
        url: 'auth/login',
        method: 'POST',
        body: loginCredentials,
      }),
    }),

    // 🚪 Logout User (Clears HttpOnly cookie on backend)
    logoutUser: builder.mutation({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),

    // ✉️ 8. Forgot Password
    forgotPassword: builder.mutation({
      query: (emailPayload) => ({
        url: 'auth/forgot-password',
        method: 'POST',
        body: emailPayload,
      }),
    }),

    // 🔐 9. Reset Password with Token
    resetPassword: builder.mutation({
      query: (resetPayload) => ({
        url: 'auth/reset-password',
        method: 'POST',
        body: resetPayload,
      }),
    }),

    // 🔄 10. Change Password (Authenticated via Cookie)
    changePassword: builder.mutation({
      query: (passwordPayload) => ({
        url: 'auth/change-password',
        method: 'POST',
        body: passwordPayload,
      }),
      invalidatesTags: ['User'],
    }),

    // 🔍 11. Get User Profile by ID
    getUserProfile: builder.query({
      query: (userId: string) => `auth/profile/${userId}`,
      providesTags: ['User'],
    }),

    // 🔁 12. Update User Profile
    updateUserProfile: builder.mutation({
      query: ({ userId, ...patch }) => ({
        url: `auth/profile/${userId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['User', 'SchoolUsers'],
    }),

    // 👨‍👩‍👧 13. Link Parent to Student
    linkParent: builder.mutation({
      query: (linkPayload) => ({
        url: 'auth/link-parent',
        method: 'POST',
        body: linkPayload,
      }),
    }),

    // 📋 14. List School Users (with optional role filter)
    getSchoolUsers: builder.query({
      query: ({ schoolId, role }: { schoolId: string; role?: string }) => ({
        url: `auth/schools/${schoolId}/users`,
        params: role ? { role } : undefined,
      }),
      providesTags: ['SchoolUsers'],
    }),

    // ⚡ 15. Toggle User Status (Activate / Deactivate)
    toggleUserStatus: builder.mutation({
      query: ({ userId, isActive }: { userId: string; isActive: boolean }) => ({
        url: `auth/users/${userId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['User', 'SchoolUsers'],
    }),
  }),
});

// ✅ Export Hooks
export const {
  useRegisterSuperAdminMutation,
  useRegisterSchoolAdminMutation,
  useRegisterSchoolMemberMutation,
  useLoginUserMutation,
  useLogoutUserMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useLinkParentMutation,
  useGetSchoolUsersQuery,
  useToggleUserStatusMutation,
} = authApi;