import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const classesApi = createApi({
  reducerPath: 'classesApi',
  baseQuery: fetchBaseQuery({ 
     baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include', // Automatically sends HTTP-only cookies with requests
  }),
  tagTypes: ['Class'],
  endpoints: (builder) => ({
    getClassesBySchoolId: builder.query<any, { schoolId: string; academicYear?: string }>({
      query: ({ schoolId, academicYear }) => ({
        url: `classes/school/${schoolId}`,
        params: academicYear ? { academicYear } : undefined,
      }),
      providesTags: ['Class'],
    }),

    getClassById: builder.query<any, string>({
      query: (classId) => `classes/${classId}`,
      providesTags: (_result, _error, id) => [{ type: 'Class', id }],
    }),

    createClass: builder.mutation<any, any>({
      query: (newClass) => ({
        url: 'classes',
        method: 'POST',
        body: newClass,
      }),
      invalidatesTags: ['Class'],
    }),

    updateClass: builder.mutation<any, { classId: string; patch: any }>({
      query: ({ classId, patch }) => ({
        url: `classes/${classId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (_result, _error, { classId }) => [{ type: 'Class', id: classId }, 'Class'],
    }),

    updateClassTeacher: builder.mutation<any, { classId: string; classTeacherId: string }>({
      query: ({ classId, classTeacherId }) => ({
        url: `classes/${classId}/teacher`,
        method: 'PATCH',
        body: { classTeacherId },
      }),
      invalidatesTags: (_result, _error, { classId }) => [{ type: 'Class', id: classId }, 'Class'],
    }),

    deleteClass: builder.mutation<any, string>({
      query: (classId) => ({
        url: `classes/${classId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Class'],
    }),
  }),
});

export const {
  useGetClassesBySchoolIdQuery,
  useGetClassByIdQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useUpdateClassTeacherMutation,
  useDeleteClassMutation,
} = classesApi;