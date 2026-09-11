import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const studentApi = createApi({
  reducerPath: 'studentApi',
  baseQuery: fetchBaseQuery({
     baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include', // Sends cookies automatically with requests
  }),
  tagTypes: ['Student', 'EnrollmentHistory'],
  endpoints: (builder) => ({
    createStudent: builder.mutation({
      query: (newStudentData) => ({
        url: '/',
        method: 'POST',
        body: newStudentData,
      }),
      invalidatesTags: ['Student'],
    }),
    getStudentsBySchool: builder.query({
      query: (schoolId) => `/school/${schoolId}`,
      providesTags: ['Student'],
    }),
    getStudentById: builder.query({
      query: (studentId) => `/${studentId}`,
      providesTags: (_result, _error, studentId) => [{ type: 'Student', id: studentId }],
    }),
    updateStudent: builder.mutation({
      query: ({ studentId, ...patchData }) => ({
        url: `/${studentId}`,
        method: 'PUT',
        body: patchData,
      }),
      invalidatesTags: (_result, _error, { studentId }) => [
        { type: 'Student', id: studentId },
        'Student',
      ],
    }),
    deleteStudent: builder.mutation({
      query: (studentId) => ({
        url: `/${studentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Student'],
    }),
    createEnrollmentHistory: builder.mutation({
      query: (historyData) => ({
        url: '/enrollment-history',
        method: 'POST',
        body: historyData,
      }),
      invalidatesTags: ['EnrollmentHistory'],
    }),
    getStudentEnrollmentHistory: builder.query({
      query: (studentId) => `/${studentId}/enrollment-history`,
      providesTags: (_result, _error, studentId) => [{ type: 'EnrollmentHistory', id: studentId }],
    }),
  }),
});

export const {
  useCreateStudentMutation,
  useGetStudentsBySchoolQuery,
  useGetStudentByIdQuery,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useCreateEnrollmentHistoryMutation,
  useGetStudentEnrollmentHistoryQuery,
} = studentApi;