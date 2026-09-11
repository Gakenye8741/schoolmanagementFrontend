import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  schoolId?: string | null;
  phone?: string;
  isActive?: boolean;
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

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({
     baseUrl: `${import.meta.env.VITE_API_URL}/api/users`,
    credentials: 'include', // Ensures cookies are automatically sent with every request
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse | User[], Record<string, any> | void>({
      query: (params) => ({
        url: '',
        params: params || {},
      }),
      providesTags: ['User'],
    }),

    createUser: builder.mutation<User, Partial<User>>({
      query: (body) => ({
        url: '',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    
    getUserByEmail: builder.query<User, { email: string; schoolId?: string }>({
      query: ({ email, schoolId }) => ({
        url: '/email',
        params: { email, ...(schoolId && { schoolId }) },
      }),
      providesTags: ['User'],
    }),

    getTeachersBySchool: builder.query<User[] | UsersResponse, string | void>({
      query: (schoolId) => ({
        url: '/teachers',
        params: schoolId ? { schoolId } : {},
      }),
      providesTags: ['User'],
    }),

    getStudentsBySchool: builder.query<User[] | UsersResponse, string | void>({
      query: (schoolId) => ({
        url: '/students',
        params: schoolId ? { schoolId } : {},
      }),
      providesTags: ['User'],
    }),

    getStudentsByClassId: builder.query<User[] | UsersResponse, string>({
      query: (classId) => `/students/class/${classId}`,
      providesTags: ['User'],
    }),

    checkAdmissionNumber: builder.query<{ available: boolean; [key: string]: any }, { admissionNumber: string; schoolId: string }>({
      query: ({ admissionNumber, schoolId }) => ({
        url: '/check-admission',
        params: { admissionNumber, schoolId },
      }),
    }),

    bulkUpdateUserStatus: builder.mutation<any, BulkStatusRequest>({
      query: ({ schoolId, ...body }) => ({
        url: `/status/bulk?schoolId=${schoolId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    getUserCountByRole: builder.query<{ count: number }, { role: string; schoolId: string }>({
      query: ({ role, schoolId }) => ({
        url: `/role/${role}/count`,
        params: { schoolId },
      }),
    }),

    getUserById: builder.query<User, string>({
      query: (userId) => `/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),

    updateUser: builder.mutation<User, UpdateUserRequest>({
      query: ({ userId, body }) => ({
        url: `/${userId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'User'],
    }),

    deleteUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),

    updateUserStatus: builder.mutation<User, UpdateStatusRequest>({
      query: ({ userId, isActive }) => ({
        url: `/${userId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: (_result, _error, { userId }) => [{ type: 'User', id: userId }, 'User'],
    }),

    getStudentProfileByUserId: builder.query<any, string>({
      query: (userId) => `/${userId}/student-profile`,
      providesTags: (_result, _error, userId) => [{ type: 'User', id: userId }],
    }),
  }),
});

export const {
  useGetUsersQuery,
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
} = usersApi;