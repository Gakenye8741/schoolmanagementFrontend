import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export interface Strand {
  id: string;
  schoolId: string;
  subjectId: string;
  gradeLevelId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  subStrands?: SubStrand[];
  [key: string]: any;
}

export interface SubStrand {
  id: string;
  schoolId: string;
  strandId: string;
  name: string;
  learningOutcomes?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface CurriculumTreeNode extends Strand {
  subStrands: SubStrand[];
}

/* ── Request payloads ──────────────────────────────────────── */

export interface CreateStrandInput {
  schoolId: string;
  subjectId: string;
  gradeLevelId: string;
  name: string;
}

export interface BulkCreateStrandsInput {
  schoolId: string;
  subjectId: string;
  gradeLevelId: string;
  strands: Array<{ name: string; [key: string]: any }>;
}

export interface BulkCreateSubStrandsInput {
  schoolId: string;
  strandId: string;
  subStrands: Array<{
    name: string;
    learningOutcomes?: string;
    [key: string]: any;
  }>;
}

export interface CurriculumTreeParams {
  schoolId: string;
  subjectId: string;
  gradeLevelId: string;
}

export interface SubStrandSearchParams {
  schoolId: string;
  q: string;
}

export interface CurriculumCoverageParams {
  schoolId: string;
  subjectId: string;
  gradeLevelId: string;
  termId: string;
}

/* ── Response shapes ───────────────────────────────────────── */

export interface SingleStrandResponse {
  success: boolean;
  message?: string;
  strand: Strand;
  [key: string]: any;
}

export interface StrandListResponse {
  success: boolean;
  count?: number;
  strands: Strand[];
  [key: string]: any;
}

export interface SingleSubStrandResponse {
  success: boolean;
  message?: string;
  subStrand: SubStrand;
  [key: string]: any;
}

export interface SubStrandListResponse {
  success: boolean;
  count?: number;
  subStrands: SubStrand[];
  [key: string]: any;
}

export interface CurriculumTreeResponse {
  success: boolean;
  strands?: CurriculumTreeNode[];
  tree?: CurriculumTreeNode[];
  [key: string]: any;
}

export interface CurriculumStatsResponse {
  success: boolean;
  stats: {
    strandCount?: number;
    subStrandCount?: number;
    subjectsCovered?: number;
    gradeLevelsCovered?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CurriculumCoverageResponse {
  success: boolean;
  coverage: {
    percentage?: number;
    totalSubStrands?: number;
    coveredSubStrands?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

/* ═══════════════════════════════════════════════════════════════
   API
   ═══════════════════════════════════════════════════════════════ */

export const curriculumApi = createApi({
  reducerPath: 'curriculumApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/curriculum`,
    credentials: 'include',
  }),
  tagTypes: [
    'Strands',
    'StrandDetail',
    'SubStrands',
    'SubStrandDetail',
    'CurriculumTree',
    'CurriculumStats',
    'CurriculumCoverage',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════
       1. Create a strand
       POST /curriculum/schools/{schoolId}/strands
       ═══════════════════════════════════════════ */
    createStrand: builder.mutation<SingleStrandResponse, CreateStrandInput>({
      query: ({ schoolId, ...body }) => ({
        url: `/schools/${schoolId}/strands`,
        method: 'POST',
        body: { schoolId, ...body },
      }),
      invalidatesTags: [
        'Strands',
        'CurriculumTree',
        'CurriculumStats',
        'CurriculumCoverage',
      ],
    }),

    /* ═══════════════════════════════════════════
       2. Bulk-create strands
       POST /curriculum/schools/{schoolId}/strands/bulk
       ═══════════════════════════════════════════ */
    bulkCreateStrands: builder.mutation<StrandListResponse, BulkCreateStrandsInput>({
      query: ({ schoolId, ...body }) => ({
        url: `/schools/${schoolId}/strands/bulk`,
        method: 'POST',
        body: { schoolId, ...body },
      }),
      invalidatesTags: [
        'Strands',
        'CurriculumTree',
        'CurriculumStats',
        'CurriculumCoverage',
      ],
    }),

    /* ═══════════════════════════════════════════
       3. Bulk-create sub-strands
       POST /curriculum/schools/{schoolId}/sub-strands/bulk
       ═══════════════════════════════════════════ */
    bulkCreateSubStrands: builder.mutation<
      SubStrandListResponse,
      BulkCreateSubStrandsInput
    >({
      query: ({ schoolId, ...body }) => ({
        url: `/schools/${schoolId}/sub-strands/bulk`,
        method: 'POST',
        body: { schoolId, ...body },
      }),
      invalidatesTags: (_r, _e, { strandId }) => [
        { type: 'SubStrands', id: strandId },
        'SubStrands',
        'Strands',
        'CurriculumTree',
        'CurriculumStats',
      ],
    }),

    /* ═══════════════════════════════════════════
       4. Get the full curriculum tree
       GET /curriculum/schools/{schoolId}/tree?subjectId=&gradeLevelId=
       ═══════════════════════════════════════════ */
    getCurriculumTree: builder.query<CurriculumTreeResponse, CurriculumTreeParams>({
      query: ({ schoolId, subjectId, gradeLevelId }) => ({
        url: `/schools/${schoolId}/tree`,
        params: { subjectId, gradeLevelId },
      }),
      providesTags: (_r, _e, { schoolId, subjectId, gradeLevelId }) => [
        {
          type: 'CurriculumTree',
          id: `${schoolId}::${subjectId}::${gradeLevelId}`,
        },
      ],
    }),

    /* ═══════════════════════════════════════════
       5. Search sub-strands
       GET /curriculum/schools/{schoolId}/sub-strands/search?q=
       ═══════════════════════════════════════════ */
    searchSubStrands: builder.query<SubStrandListResponse, SubStrandSearchParams>({
      query: ({ schoolId, q }) => ({
        url: `/schools/${schoolId}/sub-strands/search`,
        params: { q },
      }),
      providesTags: ['SubStrands'],
    }),

    /* ═══════════════════════════════════════════
       6. Curriculum stats
       GET /curriculum/schools/{schoolId}/stats
       ═══════════════════════════════════════════ */
    getCurriculumStats: builder.query<CurriculumStatsResponse, string>({
      query: (schoolId) => `/schools/${schoolId}/stats`,
      providesTags: ['CurriculumStats'],
    }),

    /* ═══════════════════════════════════════════
       7. Coverage
       GET /curriculum/schools/{schoolId}/coverage?subjectId=&gradeLevelId=&termId=
       ═══════════════════════════════════════════ */
    getCurriculumCoverage: builder.query<
      CurriculumCoverageResponse,
      CurriculumCoverageParams
    >({
      query: ({ schoolId, subjectId, gradeLevelId, termId }) => ({
        url: `/schools/${schoolId}/coverage`,
        params: { subjectId, gradeLevelId, termId },
      }),
      providesTags: (_r, _e, { schoolId, subjectId, gradeLevelId, termId }) => [
        {
          type: 'CurriculumCoverage',
          id: `${schoolId}::${subjectId}::${gradeLevelId}::${termId}`,
        },
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  useCreateStrandMutation,
  useBulkCreateStrandsMutation,
  useBulkCreateSubStrandsMutation,
  useGetCurriculumTreeQuery,
  useSearchSubStrandsQuery,
  useGetCurriculumStatsQuery,
  useGetCurriculumCoverageQuery,
} = curriculumApi;