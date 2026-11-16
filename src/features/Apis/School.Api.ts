import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

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
  // Optional extended fields that the API may return
  maxStudents?: number | null;
  smsCredits?: number | null;
  deletedAt?: string | null;
  settings?: Record<string, any> | null;
  modules?: Record<string, boolean> | null;
}

/** Optional query parameters for the school list endpoint */
export interface SchoolsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  schoolType?: string;
  curriculumType?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  county?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ── Response shapes ──
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

interface GenericResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface PlatformStatsResponse {
  success: boolean;
  stats: {
    totalSchools: number;
    activeSchools: number;
    inactiveSchools: number;
    trashedSchools?: number;
    totalStudents?: number;
    subscriptionBreakdown?: Record<string, number>;
    [key: string]: any;
  };
}

interface CountyGroupResponse {
  success: boolean;
  count: number;
  counties: Array<{ county: string; count: number; schools?: School[] }>;
}

interface TrashResponse {
  success: boolean;
  count: number;
  schools: School[];
}

interface ExpiringSchoolsResponse {
  success: boolean;
  count: number;
  withinDays: number;
  schools: School[];
}

interface SlugCheckResponse {
  success: boolean;
  available: boolean;
  message?: string;
}

interface RegistrationCheckResponse {
  success: boolean;
  available: boolean;
  message?: string;
}

interface PublicBrandingResponse {
  success: boolean;
  branding: {
    name: string;
    slug: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    coverImageUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string | null;
    gradientFrom: string | null;
    gradientTo: string | null;
    gradientDirection: string;
  };
}

interface ModulesResponse {
  success: boolean;
  modules: Record<string, boolean>;
}

interface ModuleStatusResponse {
  success: boolean;
  moduleKey: string;
  enabled: boolean;
}

interface AccessResponse {
  success: boolean;
  hasAccess: boolean;
  reason?: string;
}

interface SchoolStatsResponse {
  success: boolean;
  stats: Record<string, any>;
}

interface SMSCreditsResponse {
  success: boolean;
  smsCredits: number;
}

interface StudentLimitResponse {
  success: boolean;
  canAdd: boolean;
  currentCount: number;
  maxStudents: number | null;
  toAdd: number;
  remaining?: number | null;
}

interface SettingsJSONResponse {
  success: boolean;
  settings: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════════════════════

export const schoolApi = createApi({
  reducerPath: 'schoolApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
    credentials: 'include', // Automatically sends the HttpOnly cookie with every request
  }),
  tagTypes: [
    'Schools',
    'SchoolDetail',
    'PlatformStats',
    'Trash',
    'Modules',
    'SMSCredits',
    'Settings',
    'StudentLimit',
  ],
  endpoints: (builder) => ({
    // ═══════════════════════════════════════════════════════
    // 1. PUBLIC ROUTES (no token needed)
    // ═══════════════════════════════════════════════════════

    /** Get school by slug (Public Portal / subdomain) */
    getSchoolBySlug: builder.query<School, string>({
      query: (slug) => `schools/slug/${slug}`,
      transformResponse: (response: SingleSchoolResponse) => response.school,
    }),

    /** Get public branding (for login pages) */
    getPublicBranding: builder.query<PublicBrandingResponse, string>({
      query: (slug) => `schools/public/${slug}/branding`,
    }),

    // ═══════════════════════════════════════════════════════
    // 2. SUPER ADMIN: FIXED-WORD ROUTES
    // ═══════════════════════════════════════════════════════

    /** Platform statistics (dashboard) */
    getPlatformStats: builder.query<PlatformStatsResponse, void>({
      query: () => 'schools/platform-stats',
      providesTags: ['PlatformStats'],
    }),

    /** Schools grouped by county */
    getSchoolsByCounty: builder.query<CountyGroupResponse, void>({
      query: () => 'schools/by-county',
      providesTags: ['PlatformStats', 'Schools'],
    }),

    /** Trash: list deleted schools */
    getTrashedSchools: builder.query<TrashResponse, void>({
      query: () => 'schools/trash',
      providesTags: ['Trash'],
    }),

    /** Schools expiring in the next N days (default 14) */
    getExpiringSchools: builder.query<ExpiringSchoolsResponse, number | void>({
      query: (withinDays = 14) => ({
        url: 'schools/expiring',
        params: { withinDays },
      }),
      providesTags: ['Schools'],
    }),

    /** Run the subscription lifecycle job */
    runSubscriptionLifecycle: builder.mutation<GenericResponse, { graceDays?: number } | void>({
      query: (body = {}) => ({
        url: 'schools/subscriptions/run-lifecycle',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Schools', 'PlatformStats', 'SchoolDetail'],
    }),

    /** Check if a slug is free (optionally exclude one school) */
    checkSlugAvailability: builder.query<
      SlugCheckResponse,
      { slug: string; excludeSchoolId?: string }
    >({
      query: ({ slug, excludeSchoolId }) => ({
        url: 'schools/check-slug',
        params: { slug, ...(excludeSchoolId ? { excludeSchoolId } : {}) },
      }),
    }),

    /** Check if a registration number is free */
    checkRegistrationNumberAvailability: builder.query<
      RegistrationCheckResponse,
      string
    >({
      query: (registrationNumber) => ({
        url: 'schools/check-registration-number',
        params: { registrationNumber },
      }),
    }),

    /** Find school by registration number */
    getSchoolByRegistrationNumber: builder.query<SingleSchoolResponse, string>({
      query: (registrationNumber) => `schools/registration/${registrationNumber}`,
    }),

    /** Find school by KNEC code */
    getSchoolByKnecCode: builder.query<SingleSchoolResponse, string>({
      query: (knecCode) => `schools/knec/${knecCode}`,
    }),

    /** Bulk activate / deactivate schools */
    bulkUpdateSchoolStatus: builder.mutation<
      GenericResponse,
      { ids: string[]; isActive: boolean }
    >({
      query: (body) => ({
        url: 'schools/bulk/status',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Schools', 'PlatformStats'],
    }),

    // ═══════════════════════════════════════════════════════
    // 3. CREATE & LIST
    // ═══════════════════════════════════════════════════════

    /** Create a new school (Super Admin) */
    createSchool: builder.mutation<SingleSchoolResponse, Partial<School>>({
      query: (newSchool) => ({
        url: 'schools',
        method: 'POST',
        body: newSchool,
      }),
      invalidatesTags: ['Schools', 'PlatformStats'],
    }),

    /**
     * List all schools.
     * - `useGetAllSchoolsQuery()` → default list
     * - `useGetAllSchoolsQuery({ page: 1, search: 'green', ... })` → filtered
     */
    getAllSchools: builder.query<SchoolsListResponse, SchoolsQueryParams | void>({
      query: (params) => ({
        url: 'schools',
        params: params || {},
      }),
      providesTags: ['Schools'],
    }),

    // ═══════════════════════════════════════════════════════
    // 4. ONE SCHOOL
    // ═══════════════════════════════════════════════════════

    /** Get school by ID */
    getSchoolById: builder.query<School, string>({
      query: (schoolId) => `schools/${schoolId}`,
      transformResponse: (response: SingleSchoolResponse) => response.school,
      providesTags: (_result, _error, schoolId) => [
        { type: 'SchoolDetail', id: schoolId },
        'SchoolDetail',
      ],
    }),

    /** Update a school (PUT) */
    updateSchool: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; patch: Partial<School> }
    >({
      query: ({ schoolId, patch }) => ({
        url: `schools/${schoolId}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    /** Update a school (PATCH — same as PUT per backend) */
    patchSchool: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; patch: Partial<School> }
    >({
      query: ({ schoolId, patch }) => ({
        url: `schools/${schoolId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    /** Soft-delete a school (goes to trash) */
    deleteSchool: builder.mutation<GenericResponse, string>({
      query: (schoolId) => ({
        url: `schools/${schoolId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Schools', 'Trash', 'PlatformStats'],
    }),

    /** Restore a school from trash */
    restoreSchool: builder.mutation<GenericResponse, string>({
      query: (schoolId) => ({
        url: `schools/${schoolId}/restore`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Schools', 'Trash', 'PlatformStats', 'SchoolDetail'],
    }),

    /** Permanently delete a school (must be in trash first) */
    permanentlyDeleteSchool: builder.mutation<GenericResponse, string>({
      query: (schoolId) => ({
        url: `schools/${schoolId}/permanent`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Trash', 'PlatformStats'],
    }),

    /** Activate / deactivate a school */
    toggleSchoolStatus: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; isActive: boolean }
    >({
      query: ({ schoolId, isActive }) => ({
        url: `schools/${schoolId}/status`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    /** Change the school slug (changes its web address) */
    changeSchoolSlug: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; slug: string }
    >({
      query: ({ schoolId, slug }) => ({
        url: `schools/${schoolId}/slug`,
        method: 'PATCH',
        body: { slug },
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    // ═══════════════════════════════════════════════════════
    // 5. SUBSCRIPTION & BILLING
    // ═══════════════════════════════════════════════════════

    /** Update subscription directly (override) */
    updateSchoolSubscription: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; subscription: any }
    >({
      query: ({ schoolId, subscription }) => ({
        url: `schools/${schoolId}/subscription`,
        method: 'PATCH',
        body: subscription,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    /** Change plan (uses plan's default student limit) */
    changeSubscriptionPlan: builder.mutation<
      SingleSchoolResponse,
      {
        schoolId: string;
        plan: string;
        maxStudents?: number;
        keepExistingLimit?: boolean;
      }
    >({
      query: ({ schoolId, ...body }) => ({
        url: `schools/${schoolId}/subscription/plan`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    /** Extend subscription by N days */
    extendSubscription: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; days: number }
    >({
      query: ({ schoolId, days }) => ({
        url: `schools/${schoolId}/subscription/extend`,
        method: 'PATCH',
        body: { days },
      }),
      invalidatesTags: ['SchoolDetail', 'Schools'],
    }),

    /** Suspend subscription (optionally deactivate school too) */
    suspendSubscription: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; deactivate?: boolean }
    >({
      query: ({ schoolId, deactivate }) => ({
        url: `schools/${schoolId}/subscription/suspend`,
        method: 'PATCH',
        body: deactivate ? { deactivate: true } : {},
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    /** Reactivate subscription */
    reactivateSubscription: builder.mutation<SingleSchoolResponse, string>({
      query: (schoolId) => ({
        url: `schools/${schoolId}/subscription/reactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    /** Cancel subscription */
    cancelSubscription: builder.mutation<SingleSchoolResponse, string>({
      query: (schoolId) => ({
        url: `schools/${schoolId}/subscription/cancel`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Schools', 'SchoolDetail', 'PlatformStats'],
    }),

    // ═══════════════════════════════════════════════════════
    // 6. STUDENT LIMIT & SMS CREDITS
    // ═══════════════════════════════════════════════════════

    /** Set student limit (pass null for unlimited) */
    setStudentLimit: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; maxStudents: number | null }
    >({
      query: ({ schoolId, maxStudents }) => ({
        url: `schools/${schoolId}/max-students`,
        method: 'PATCH',
        body: { maxStudents },
      }),
      invalidatesTags: ['SchoolDetail', 'StudentLimit', 'Schools'],
    }),

    /** Add SMS credits */
    addSMSCredits: builder.mutation<
      SMSCreditsResponse,
      { schoolId: string; amount: number }
    >({
      query: ({ schoolId, amount }) => ({
        url: `schools/${schoolId}/sms-credits/add`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['SMSCredits', 'SchoolDetail'],
    }),

    /** Use (deduct) SMS credits */
    deductSMSCredits: builder.mutation<
      SMSCreditsResponse,
      { schoolId: string; amount: number }
    >({
      query: ({ schoolId, amount }) => ({
        url: `schools/${schoolId}/sms-credits/deduct`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: ['SMSCredits'],
    }),

    /** Get current SMS credit balance */
    getSMSCredits: builder.query<SMSCreditsResponse, string>({
      query: (schoolId) => `schools/${schoolId}/sms-credits`,
      providesTags: ['SMSCredits'],
    }),

    // ═══════════════════════════════════════════════════════
    // 7. BRANDING
    // ═══════════════════════════════════════════════════════

    /** Update full branding (colors, logo, favicon, cover, gradient) */
    updateSchoolBranding: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; branding: any }
    >({
      query: ({ schoolId, branding }) => ({
        url: `schools/${schoolId}/branding`,
        method: 'PATCH',
        body: branding,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    /** Update only the logo (pass null to remove) */
    updateSchoolLogo: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; logoUrl: string | null }
    >({
      query: ({ schoolId, logoUrl }) => ({
        url: `schools/${schoolId}/logo`,
        method: 'PATCH',
        body: { logoUrl },
      }),
      invalidatesTags: ['SchoolDetail', 'Schools'],
    }),

    /** Reset branding to default style */
    resetSchoolBranding: builder.mutation<SingleSchoolResponse, string>({
      query: (schoolId) => ({
        url: `schools/${schoolId}/branding/reset`,
        method: 'PATCH',
      }),
      invalidatesTags: ['SchoolDetail', 'Schools'],
    }),

    // ═══════════════════════════════════════════════════════
    // 8. SCHOOL DETAILS (identity / contact / localization / curriculum / principal)
    // ═══════════════════════════════════════════════════════

    /** Update school identity (name, shortName, motto, registration, KNEC, year, principal) */
    updateSchoolSettings: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; settings: any }
    >({
      query: ({ schoolId, settings }) => ({
        url: `schools/${schoolId}/settings`,
        method: 'PATCH',
        body: settings,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    /** Update contact & location */
    updateSchoolContact: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; contact: any }
    >({
      query: ({ schoolId, contact }) => ({
        url: `schools/${schoolId}/contact`,
        method: 'PATCH',
        body: contact,
      }),
      invalidatesTags: ['Schools', 'SchoolDetail'],
    }),

    /** Update timezone & currency */
    updateSchoolLocalization: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; localization: { timezone?: string; currency?: string } }
    >({
      query: ({ schoolId, localization }) => ({
        url: `schools/${schoolId}/localization`,
        method: 'PATCH',
        body: localization,
      }),
      invalidatesTags: ['SchoolDetail'],
    }),

    /** Update school type & curriculum */
    updateSchoolCurriculum: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; curriculum: { schoolType?: string; curriculumType?: string } }
    >({
      query: ({ schoolId, curriculum }) => ({
        url: `schools/${schoolId}/curriculum`,
        method: 'PATCH',
        body: curriculum,
      }),
      invalidatesTags: ['SchoolDetail'],
    }),

    /** Update (or clear) principal name */
    updateSchoolPrincipal: builder.mutation<
      SingleSchoolResponse,
      { schoolId: string; principalName: string | null }
    >({
      query: ({ schoolId, principalName }) => ({
        url: `schools/${schoolId}/principal`,
        method: 'PATCH',
        body: { principalName },
      }),
      invalidatesTags: ['SchoolDetail'],
    }),

    // ═══════════════════════════════════════════════════════
    // 9. ADVANCED SETTINGS & MODULES
    // ═══════════════════════════════════════════════════════

    /** Get all settings (JSON) */
    getSettingsJSON: builder.query<SettingsJSONResponse, string>({
      query: (schoolId) => `schools/${schoolId}/settings-json`,
      providesTags: (_r, _e, schoolId) => [
        { type: 'Settings', id: schoolId },
        'Settings',
      ],
    }),

    /** Save / merge settings JSON */
    updateSettingsJSON: builder.mutation<
      SettingsJSONResponse,
      { schoolId: string; settings: Record<string, any> }
    >({
      query: ({ schoolId, settings }) => ({
        url: `schools/${schoolId}/settings-json`,
        method: 'PATCH',
        body: { settings },
      }),
      invalidatesTags: ['Settings', 'SchoolDetail'],
    }),

    /** Turn a module ON or OFF */
    toggleModule: builder.mutation<
      ModuleStatusResponse,
      { schoolId: string; moduleKey: string; enabled: boolean }
    >({
      query: ({ schoolId, moduleKey, enabled }) => ({
        url: `schools/${schoolId}/modules`,
        method: 'PATCH',
        body: { moduleKey, enabled },
      }),
      invalidatesTags: ['Modules', 'SchoolDetail'],
    }),

    /** Get all module on/off flags */
    getSchoolModules: builder.query<ModulesResponse, string>({
      query: (schoolId) => `schools/${schoolId}/modules`,
      providesTags: (_r, _e, schoolId) => [
        { type: 'Modules', id: schoolId },
        'Modules',
      ],
    }),

    /** Check if a single module is on */
    getModuleStatus: builder.query<
      ModuleStatusResponse,
      { schoolId: string; moduleKey: string }
    >({
      query: ({ schoolId, moduleKey }) =>
        `schools/${schoolId}/modules/${moduleKey}`,
      providesTags: ['Modules'],
    }),

    // ═══════════════════════════════════════════════════════
    // 10. REPORTS & CHECKS
    // ═══════════════════════════════════════════════════════

    /** School statistics */
    getSchoolStats: builder.query<SchoolStatsResponse, string>({
      query: (schoolId) => `schools/${schoolId}/stats`,
      providesTags: ['SchoolDetail'],
    }),

    /** Can the school add N more students? (default 1) */
    checkStudentLimit: builder.query<
      StudentLimitResponse,
      { schoolId: string; toAdd?: number }
    >({
      query: ({ schoolId, toAdd = 1 }) => ({
        url: `schools/${schoolId}/student-limit`,
        params: { toAdd },
      }),
      providesTags: ['StudentLimit'],
    }),

    /** Can this school use the system right now? */
    getSchoolAccess: builder.query<AccessResponse, string>({
      query: (schoolId) => `schools/${schoolId}/access`,
    }),
  }),
});

// ═══════════════════════════════════════════════════════════════
// HOOKS EXPORT
// ═══════════════════════════════════════════════════════════════

export const {
  // ── Public ──
  useGetSchoolBySlugQuery,
  useGetPublicBrandingQuery,

  // ── Super Admin: fixed routes ──
  useGetPlatformStatsQuery,
  useGetSchoolsByCountyQuery,
  useGetTrashedSchoolsQuery,
  useGetExpiringSchoolsQuery,
  useRunSubscriptionLifecycleMutation,
  useCheckSlugAvailabilityQuery,
  useLazyCheckSlugAvailabilityQuery,
  useCheckRegistrationNumberAvailabilityQuery,
  useLazyCheckRegistrationNumberAvailabilityQuery,
  useGetSchoolByRegistrationNumberQuery,
  useGetSchoolByKnecCodeQuery,
  useBulkUpdateSchoolStatusMutation,

  // ── Create & list ──
  useCreateSchoolMutation,
  useGetAllSchoolsQuery,

  // ── One school ──
  useGetSchoolByIdQuery,
  useUpdateSchoolMutation,
  usePatchSchoolMutation,
  useDeleteSchoolMutation,
  useRestoreSchoolMutation,
  usePermanentlyDeleteSchoolMutation,
  useToggleSchoolStatusMutation,
  useChangeSchoolSlugMutation,

  // ── Subscription & billing ──
  useUpdateSchoolSubscriptionMutation,
  useChangeSubscriptionPlanMutation,
  useExtendSubscriptionMutation,
  useSuspendSubscriptionMutation,
  useReactivateSubscriptionMutation,
  useCancelSubscriptionMutation,

  // ── Student limit & SMS ──
  useSetStudentLimitMutation,
  useAddSMSCreditsMutation,
  useDeductSMSCreditsMutation,
  useGetSMSCreditsQuery,

  // ── Branding ──
  useUpdateSchoolBrandingMutation,
  useUpdateSchoolLogoMutation,
  useResetSchoolBrandingMutation,

  // ── School details ──
  useUpdateSchoolSettingsMutation,
  useUpdateSchoolContactMutation,
  useUpdateSchoolLocalizationMutation,
  useUpdateSchoolCurriculumMutation,
  useUpdateSchoolPrincipalMutation,

  // ── Advanced settings & modules ──
  useGetSettingsJSONQuery,
  useUpdateSettingsJSONMutation,
  useToggleModuleMutation,
  useGetSchoolModulesQuery,
  useGetModuleStatusQuery,

  // ── Reports & checks ──
  useGetSchoolStatsQuery,
  useCheckStudentLimitQuery,
  useGetSchoolAccessQuery,
} = schoolApi;