import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface AcademicTerm {
  id: string;
  schoolId: string;
  academicYear: string;
  termName: string;
  startDate: string;
  endDate: string;
  status: string;
  isCurrentTerm: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TermWindow {
  id: string;
  termId: string;
  windowType: string;
  title: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface TermsListResponse {
  success: boolean;
  count: number;
  terms: AcademicTerm[];
}

interface SingleTermResponse {
  success: boolean;
  message: string;
  term: AcademicTerm;
}

interface WindowsListResponse {
  success: boolean;
  count: number;
  windows: TermWindow[];
}

interface SingleWindowResponse {
  success: boolean;
  message: string;
  window: TermWindow;
}

export const termApi = createApi({
  reducerPath: 'termApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include', // Automatically sends the HttpOnly cookie with every request
  }),
  tagTypes: ['Terms', 'TermDetail', 'TermWindows'],
  endpoints: (builder) => ({
    // 1. Create a new academic term (Admin / School Admin)
    createTerm: builder.mutation<SingleTermResponse, Partial<AcademicTerm>>({
      query: (newTerm) => ({
        url: 'terms',
        method: 'POST',
        body: newTerm,
      }),
      invalidatesTags: ['Terms'],
    }),

    // 2. List all academic terms for a school (Any Authenticated User)
    getTermsBySchoolId: builder.query<TermsListResponse, string>({
      query: (schoolId) => `terms/school/${schoolId}`,
      providesTags: ['Terms'],
    }),

    // 3. Get the current active academic term for a school (Any Authenticated User)
    getCurrentTermBySchoolId: builder.query<SingleTermResponse, string>({
      query: (schoolId) => `terms/school/${schoolId}/current`,
      providesTags: ['Terms'],
    }),

    // 4. Get a specific academic term by ID (Any Authenticated User)
    getTermById: builder.query<AcademicTerm, string>({
      query: (termId) => `terms/${termId}`,
      transformResponse: (response: SingleTermResponse) => response.term,
      providesTags: (_result, _error, termId) => [{ type: 'TermDetail', id: termId }, 'TermDetail'],
    }),

    // 5. Update an academic term (Admin / School Admin)
    updateTerm: builder.mutation<SingleTermResponse, { termId: string; patch: Partial<AcademicTerm> }>({
      query: ({ termId, patch }) => ({
        url: `terms/${termId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Terms', 'TermDetail'],
    }),

    // 6. Create a term window/sub-period e.g. Mid-Term Break (Admin / School Admin)
    createTermWindow: builder.mutation<SingleWindowResponse, Partial<TermWindow>>({
      query: (newWindow) => ({
        url: 'terms/windows',
        method: 'POST',
        body: newWindow,
      }),
      invalidatesTags: ['TermWindows'],
    }),

    // 7. List all windows for an academic term (Any Authenticated User)
    getWindowsByTermId: builder.query<WindowsListResponse, string>({
      query: (termId) => `terms/${termId}/windows`,
      providesTags: ['TermWindows'],
    }),

    // 8. Delete a term window (Admin / School Admin)
    deleteTermWindow: builder.mutation<{ success: boolean; message: string }, string>({
      query: (windowId) => ({
        url: `terms/windows/${windowId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['TermWindows'],
    }),

    // 9. Delete an academic term (Super Admin only)
    deleteTerm: builder.mutation<{ success: boolean; message: string }, string>({
      query: (termId) => ({
        url: `terms/${termId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Terms', 'TermDetail', 'TermWindows'],
    }),
  }),
});

export const {
  useCreateTermMutation,
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
  useGetTermByIdQuery,
  useUpdateTermMutation,
  useCreateTermWindowMutation,
  useGetWindowsByTermIdQuery,
  useDeleteTermWindowMutation,
  useDeleteTermMutation,
} = termApi;