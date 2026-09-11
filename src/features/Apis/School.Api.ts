import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export interface School {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  motto: string;
  registrationNumber: string;
  knecCode: string;
  schoolType: string;
  curriculumType: string;
  establishedYear: number;
  logoUrl: string | null;
  faviconUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string | null;
  gradientFrom: string | null;
  gradientTo: string | null;
  gradientDirection: string;
  address: string;
  county: string;
  subCounty: string;
  phone: string;
  alternativePhone: string | null;
  email: string;
  website: string;
  timezone: string;
  currency: string;
  principalName: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SchoolsListResponse {
  success: boolean;
  count: number;
  schools: School[];
}

interface SingleSchoolResponse {
  success: boolean;
  message: string;
  school: School;
}

export const schoolApi = createApi({
  reducerPath: 'schoolApi',
  baseQuery: fetchBaseQuery({
    baseUrl:`${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include', // CRITICAL: Automatically sends the HttpOnly cookie with every request
  }),
  tagTypes: ['Schools', 'SchoolDetail'],
  endpoints: (builder) => ({
    // 1. Create a new school (Super Admin)
    createSchool: builder.mutation<SingleSchoolResponse, Partial<School>>({
      query: (newSchool) => ({
        url: 'schools',
        method: 'POST',
        body: newSchool,
      }),
      invalidatesTags: ['Schools'],
    }),

    // 2. List all schools (Admin)
    getAllSchools: builder.query<SchoolsListResponse, void>({
      query: () => 'schools',
      providesTags: ['Schools'],
    }),

    // 3. Get school by ID (Admin)
    getSchoolById: builder.query<School, string>({
      query: (schoolId) => `schools/${schoolId}`,
      transformResponse: (response: SingleSchoolResponse) => response.school,
      providesTags: (_result, _error, schoolId) => [{ type: 'SchoolDetail', id: schoolId }, 'SchoolDetail'],
    }),

    // 4. Get school by slug (Public Portal)
    getSchoolBySlug: builder.query<School, string>({
      query: (slug) => `schools/slug/${slug}`,
      transformResponse: (response: SingleSchoolResponse) => response.school,
    }),

    // 5. Update school details (Super Admin)
    updateSchool: builder.mutation<SingleSchoolResponse, { schoolId: string; patch: Partial<School> }>({
      query: ({ schoolId, patch }) => ({
        url: `schools/${schoolId}`,
        method: 'PUT',
        body: patch,
      }),
      // Automatically invalidates caches to force RTK Query to refetch fresh data
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    // 6. Toggle school status (Super Admin)
    toggleSchoolStatus: builder.mutation<SingleSchoolResponse, { schoolId: string; isActive: boolean }>({
      query: ({ schoolId, isActive }) => ({
        url: `schools/${schoolId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    // 7. Update school branding (Admin)
    updateSchoolBranding: builder.mutation<SingleSchoolResponse, { schoolId: string; branding: { logoUrl?: string; primaryColor?: string; secondaryColor?: string } }>({
      query: ({ schoolId, branding }) => ({
        url: `schools/${schoolId}/branding`,
        method: 'PATCH',
        body: branding,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    // 8. Update school subscription (Super Admin)
    updateSchoolSubscription: builder.mutation<SingleSchoolResponse, { schoolId: string; subscription: any }>({
      query: ({ schoolId, subscription }) => ({
        url: `schools/${schoolId}/subscription`,
        method: 'PATCH',
        body: subscription,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    // 9. Update school settings (Admin)
    updateSchoolSettings: builder.mutation<SingleSchoolResponse, { schoolId: string; settings: any }>({
      query: ({ schoolId, settings }) => ({
        url: `schools/${schoolId}/settings`,
        method: 'PATCH',
        body: settings,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    // 10. Update school contact & location (Admin)
    updateSchoolContact: builder.mutation<SingleSchoolResponse, { schoolId: string; contact: any }>({
      query: ({ schoolId, contact }) => ({
        url: `schools/${schoolId}/contact`,
        method: 'PATCH',
        body: contact,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),
  }),
});

export const {
  useCreateSchoolMutation,
  useGetAllSchoolsQuery,
  useGetSchoolByIdQuery,
  useGetSchoolBySlugQuery,
  useUpdateSchoolMutation,
  useToggleSchoolStatusMutation,
  useUpdateSchoolBrandingMutation,
  useUpdateSchoolSubscriptionMutation,
  useUpdateSchoolSettingsMutation,
  useUpdateSchoolContactMutation,
} = schoolApi;