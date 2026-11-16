import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type ScaleTemplate = 'KCSE' | 'CBC' | 'PERCENTAGE_A_E' | 'IGCSE_1_9' | string;

export interface GradingBand {
  id: string;
  scaleId: string;
  minScore: string;
  maxScore: string;
  grade: string;
  points?: number | null;
  descriptor?: string | null;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface GradingScale {
  id: string;
  schoolId: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  bands?: GradingBand[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/* ── Request payloads ────────────────────────────────────────── */

export interface SeedScaleInput {
  schoolId: string;
  template: ScaleTemplate;
}

export interface CreateScaleInput {
  schoolId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateScaleInput {
  scaleId: string;
  patch: Partial<Pick<CreateScaleInput, 'name' | 'description' | 'isDefault'>>;
}

export interface SetDefaultScaleInput {
  schoolId: string;
  scaleId: string;
}

export interface CopyScaleInput {
  schoolId: string;
  sourceScaleId: string;
  newName: string;
}

export interface SearchScalesParams {
  schoolId: string;
  query: string;
}

/* ── Bands ───────────────────────────────────────────────────── */

export interface CreateBandInput {
  scaleId: string;
  minScore: string | number;
  maxScore: string | number;
  grade: string;
  points?: number;
  descriptor?: string;
  remark?: string;
}

export interface BulkCreateBandsInput {
  scaleId: string;
  bands: Array<{
    minScore: string | number;
    maxScore: string | number;
    grade: string;
    points?: number;
    descriptor?: string;
    remark?: string;
  }>;
}

export interface UpdateBandInput {
  bandId: string;
  patch: Partial<{
    minScore: string | number;
    maxScore: string | number;
    grade: string;
    points: number;
    descriptor: string;
    remark: string;
  }>;
}

/* ── Resolve ─────────────────────────────────────────────────── */

export interface ResolveMarkInput {
  scaleId: string;
  mark: string | number;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface SingleScaleResponse {
  success: boolean;
  message?: string;
  scale: GradingScale;
  [key: string]: any;
}

export interface ScaleListResponse {
  success: boolean;
  count?: number;
  scales: GradingScale[];
  [key: string]: any;
}

export interface SingleBandResponse {
  success: boolean;
  message?: string;
  band: GradingBand;
  [key: string]: any;
}

export interface BandListResponse {
  success: boolean;
  count?: number;
  bands: GradingBand[];
  [key: string]: any;
}

export interface BulkCreateBandsResponse {
  success: boolean;
  message?: string;
  count?: number;
  bands: GradingBand[];
  [key: string]: any;
}

export interface ResolveMarkResponse {
  success: boolean;
  message?: string;
  result?: {
    grade?: string;
    points?: number | null;
    descriptor?: string | null;
    remark?: string | null;
    minScore?: string;
    maxScore?: string;
    band?: GradingBand | null;
    [key: string]: any;
  };
  grade?: string;
  band?: GradingBand | null;
  [key: string]: any;
}

export interface ValidateScaleResponse {
  success: boolean;
  valid: boolean;
  issues?: string[];
  warnings?: string[];
  [key: string]: any;
}

export interface GenericResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const gradingScalesApi = createApi({
  reducerPath: 'gradingScalesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/grading-scales`,
    credentials: 'include',
  }),
  tagTypes: [
    'Scales',
    'ScaleDetail',
    'DefaultScale',
    'Bands',
    'BandDetail',
    'ScaleValidation',
    'ResolveResult',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════════
       SCALES — SEED / CREATE / LIST / UPDATE (1.1 – 2.8)
       ═══════════════════════════════════════════════════════════ */

    /** 1.1–1.4 POST /grading-scales/scales/seed */
    seedScale: builder.mutation<SingleScaleResponse, SeedScaleInput>({
      query: (body: SeedScaleInput) => ({
        url: '/scales/seed',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scales', 'DefaultScale'],
    }),

    /** 2.1 POST /grading-scales/scales */
    createScale: builder.mutation<SingleScaleResponse, CreateScaleInput>({
      query: (body: CreateScaleInput) => ({
        url: '/scales',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scales', 'DefaultScale'],
    }),

    /** 2.2 GET /grading-scales/scales/school/{schoolId} */
    getScalesBySchool: builder.query<ScaleListResponse, string>({
      query: (schoolId: string) => `/scales/school/${schoolId}`,
      providesTags: ['Scales'],
    }),

    /** 2.3 GET /grading-scales/scales/school/{schoolId}/search?query= */
    searchScales: builder.query<ScaleListResponse, SearchScalesParams>({
      query: (arg: SearchScalesParams) => ({
        url: `/scales/school/${arg.schoolId}/search`,
        params: { query: arg.query },
      }),
      providesTags: ['Scales'],
    }),

    /** 2.4 GET /grading-scales/scales/{scaleId} (with bands) */
    getScaleById: builder.query<SingleScaleResponse, string>({
      query: (scaleId: string) => `/scales/${scaleId}`,
      providesTags: (_r, _e, scaleId: string) => [
        { type: 'ScaleDetail', id: scaleId },
      ],
    }),

    /** 2.5 PUT /grading-scales/scales/{scaleId} */
    updateScale: builder.mutation<SingleScaleResponse, UpdateScaleInput>({
      query: (arg: UpdateScaleInput) => ({
        url: `/scales/${arg.scaleId}`,
        method: 'PUT',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdateScaleInput) => [
        { type: 'ScaleDetail', id: arg.scaleId },
        'Scales',
        'DefaultScale',
      ],
    }),

    /** 2.6 POST /grading-scales/scales/school/{schoolId}/set-default */
    setDefaultScale: builder.mutation<SingleScaleResponse, SetDefaultScaleInput>({
      query: (arg: SetDefaultScaleInput) => ({
        url: `/scales/school/${arg.schoolId}/set-default`,
        method: 'POST',
        body: { scaleId: arg.scaleId },
      }),
      invalidatesTags: ['Scales', 'DefaultScale'],
    }),

    /** 2.7 GET /grading-scales/scales/school/{schoolId}/default */
    getDefaultScale: builder.query<SingleScaleResponse, string>({
      query: (schoolId: string) => `/scales/school/${schoolId}/default`,
      providesTags: ['DefaultScale'],
    }),

    /** 2.8 POST /grading-scales/scales/copy */
    copyScale: builder.mutation<SingleScaleResponse, CopyScaleInput>({
      query: (body: CopyScaleInput) => ({
        url: '/scales/copy',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Scales'],
    }),

    /* ═══════════════════════════════════════════════════════════
       BANDS — LIST / CREATE / BULK / UPDATE / DELETE (3.1 – 3.6)
       ═══════════════════════════════════════════════════════════ */

    /** 3.1 GET /grading-scales/scales/{scaleId}/bands */
    getBandsByScale: builder.query<BandListResponse, string>({
      query: (scaleId: string) => `/scales/${scaleId}/bands`,
      providesTags: (_r, _e, scaleId: string) => [
        { type: 'Bands', id: scaleId },
      ],
    }),

    /** 3.2 POST /grading-scales/scales/{scaleId}/bands */
    createBand: builder.mutation<SingleBandResponse, CreateBandInput>({
      query: (arg: CreateBandInput) => {
        const { scaleId, ...body } = arg;
        return {
          url: `/scales/${scaleId}/bands`,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: (_r, _e, arg: CreateBandInput) => [
        { type: 'Bands', id: arg.scaleId },
        { type: 'ScaleDetail', id: arg.scaleId },
        { type: 'ScaleValidation', id: arg.scaleId },
      ],
    }),

    /** 3.3 POST /grading-scales/scales/{scaleId}/bands/bulk */
    bulkCreateBands: builder.mutation<
      BulkCreateBandsResponse,
      BulkCreateBandsInput
    >({
      query: (arg: BulkCreateBandsInput) => ({
        url: `/scales/${arg.scaleId}/bands/bulk`,
        method: 'POST',
        body: { bands: arg.bands },
      }),
      invalidatesTags: (_r, _e, arg: BulkCreateBandsInput) => [
        { type: 'Bands', id: arg.scaleId },
        { type: 'ScaleDetail', id: arg.scaleId },
        { type: 'ScaleValidation', id: arg.scaleId },
      ],
    }),

    /** 3.4 PUT /grading-scales/bands/{bandId} */
    updateBand: builder.mutation<SingleBandResponse, UpdateBandInput>({
      query: (arg: UpdateBandInput) => ({
        url: `/bands/${arg.bandId}`,
        method: 'PUT',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdateBandInput) => [
        { type: 'BandDetail', id: arg.bandId },
        'Bands',
        'Scales',
        'ScaleValidation',
      ],
    }),

    /** 3.5 DELETE /grading-scales/bands/{bandId} */
    deleteBand: builder.mutation<GenericResponse, string>({
      query: (bandId: string) => ({
        url: `/bands/${bandId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, bandId: string) => [
        { type: 'BandDetail', id: bandId },
        'Bands',
        'Scales',
        'ScaleValidation',
      ],
    }),

    /** 3.6 DELETE /grading-scales/scales/{scaleId}/bands */
    deleteAllBands: builder.mutation<GenericResponse, string>({
      query: (scaleId: string) => ({
        url: `/scales/${scaleId}/bands`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, scaleId: string) => [
        { type: 'Bands', id: scaleId },
        { type: 'ScaleDetail', id: scaleId },
        { type: 'ScaleValidation', id: scaleId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       RESOLVE MARK → GRADE (4.1 – 4.5)
       ═══════════════════════════════════════════════════════════ */

    /** 4.1–4.5 POST /grading-scales/resolve */
    resolveMark: builder.mutation<ResolveMarkResponse, ResolveMarkInput>({
      query: (body: ResolveMarkInput) => ({
        url: '/resolve',
        method: 'POST',
        body,
      }),
      // No tag invalidation — pure computation, no side effects
    }),

    /* ═══════════════════════════════════════════════════════════
       VALIDATE SCALE (5.1 – 5.3)
       ═══════════════════════════════════════════════════════════ */

    /** 5.1–5.3 GET /grading-scales/scales/{scaleId}/validate */
    validateScale: builder.query<ValidateScaleResponse, string>({
      query: (scaleId: string) => `/scales/${scaleId}/validate`,
      providesTags: (_r, _e, scaleId: string) => [
        { type: 'ScaleValidation', id: scaleId },
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Scales ── */
  useSeedScaleMutation,
  useCreateScaleMutation,
  useGetScalesBySchoolQuery,
  useSearchScalesQuery,
  useGetScaleByIdQuery,
  useUpdateScaleMutation,
  useSetDefaultScaleMutation,
  useGetDefaultScaleQuery,
  useCopyScaleMutation,

  /* ── Bands ── */
  useGetBandsByScaleQuery,
  useCreateBandMutation,
  useBulkCreateBandsMutation,
  useUpdateBandMutation,
  useDeleteBandMutation,
  useDeleteAllBandsMutation,

  /* ── Resolve ── */
  useResolveMarkMutation,

  /* ── Validate ── */
  useValidateScaleQuery,
} = gradingScalesApi;