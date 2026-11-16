import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ================================================================
// SHARED BASE QUERY
// ================================================================
const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_API_URL}/api/`,
  credentials: 'include',
});

// ================================================================
// GENERIC RESPONSE HELPERS
// ================================================================
type ListResponse<T> = {
  success: boolean;
  count?: number;
  data?: T[];
  [key: string]: any;
};

type ItemResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
};

type ActionResult = {
  success: boolean;
  message?: string;
  [key: string]: any;
};

// ================================================================
// TERM TYPES (unchanged)
// ================================================================
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

// ================================================================
// ACADEMIC STRUCTURE TYPES
// ================================================================
export interface GradeLevel {
  id: string;
  schoolId: string;
  name: string;
  sortOrder: number;
  educationStage: string;
  nextGradeLevelId: string | null;
  isFinalGrade: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEntity {
  id: string;
  schoolId: string;
  gradeLevelId: string;
  stream: string;
  academicYear: string;
  classTeacherId: string | null;
  capacity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSubjectLink {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ================================================================
// TERM API (unchanged)
// ================================================================
export const termApi = createApi({
  reducerPath: 'termApi',
  baseQuery,
  tagTypes: ['Terms', 'TermDetail', 'TermWindows'],
  endpoints: (builder) => ({
    createTerm: builder.mutation<ItemResponse<AcademicTerm>, Partial<AcademicTerm>>({
      query: (newTerm) => ({ url: 'terms', method: 'POST', body: newTerm }),
      invalidatesTags: ['Terms'],
    }),

    getTermsBySchoolId: builder.query<ListResponse<AcademicTerm>, string>({
      query: (schoolId) => `terms/school/${schoolId}`,
      providesTags: ['Terms'],
    }),

    getCurrentTermBySchoolId: builder.query<ItemResponse<AcademicTerm>, string>({
      query: (schoolId) => `terms/school/${schoolId}/current`,
      providesTags: ['Terms'],
    }),

    getTermById: builder.query<AcademicTerm, string>({
      query: (termId) => `terms/${termId}`,
      transformResponse: (response: ItemResponse<AcademicTerm>) => response.data as AcademicTerm,
      providesTags: (_r, _e, id) => [{ type: 'TermDetail', id }, 'TermDetail'],
    }),

    updateTerm: builder.mutation<ItemResponse<AcademicTerm>, { termId: string; patch: Partial<AcademicTerm> }>({
      query: ({ termId, patch }) => ({ url: `terms/${termId}`, method: 'PUT', body: patch }),
      invalidatesTags: ['Terms', 'TermDetail'],
    }),

    createTermWindow: builder.mutation<ItemResponse<TermWindow>, Partial<TermWindow>>({
      query: (newWindow) => ({ url: 'terms/windows', method: 'POST', body: newWindow }),
      invalidatesTags: ['TermWindows'],
    }),

    getWindowsByTermId: builder.query<ListResponse<TermWindow>, string>({
      query: (termId) => `terms/${termId}/windows`,
      providesTags: ['TermWindows'],
    }),

    deleteTermWindow: builder.mutation<ActionResult, string>({
      query: (windowId) => ({ url: `terms/windows/${windowId}`, method: 'DELETE' }),
      invalidatesTags: ['TermWindows'],
    }),

    deleteTerm: builder.mutation<ActionResult, string>({
      query: (termId) => ({ url: `terms/${termId}`, method: 'DELETE' }),
      invalidatesTags: ['Terms', 'TermDetail', 'TermWindows'],
    }),
  }),
});

// ================================================================
// ACADEMIC STRUCTURE API
// ================================================================
export const academicStructureApi = createApi({
  reducerPath: 'academicStructureApi',
  baseQuery,
  tagTypes: [
    'GradeLevels',
    'GradeLevelDetail',
    'Subjects',
    'SubjectDetail',
    'Classes',
    'ClassDetail',
    'ClassSubjects',
    'StudentLinks',
  ],
  endpoints: (builder) => ({
    // ------------------------------------------------------------
    // GRADE LEVELS (1–20)
    // ------------------------------------------------------------
    createGradeLevel: builder.mutation<ItemResponse<GradeLevel>, Partial<GradeLevel>>({
      query: (body) => ({ url: 'academic-structure/grade-levels', method: 'POST', body }),
      invalidatesTags: ['GradeLevels'],
    }),

    getGradeLevelById: builder.query<ItemResponse<GradeLevel>, string>({
      query: (id) => `academic-structure/grade-levels/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'GradeLevelDetail', id }, 'GradeLevelDetail'],
    }),

    getGradeLevelWithClasses: builder.query<ItemResponse<GradeLevel & { classes: ClassEntity[] }>, string>({
      query: (id) => `academic-structure/grade-levels/${id}/with-classes`,
      providesTags: (_r, _e, id) => [{ type: 'GradeLevelDetail', id }, 'GradeLevelDetail'],
    }),

    getGradeLevelsBySchool: builder.query<ListResponse<GradeLevel>, string>({
      query: (schoolId) => `academic-structure/grade-levels/school/${schoolId}`,
      providesTags: ['GradeLevels'],
    }),

    getGradeLevelsByStage: builder.query<ListResponse<GradeLevel>, { schoolId: string; stage: string }>({
      query: ({ schoolId, stage }) =>
        `academic-structure/grade-levels/school/${schoolId}/by-stage?stage=${encodeURIComponent(stage)}`,
      providesTags: ['GradeLevels'],
    }),

    updateGradeLevel: builder.mutation<ItemResponse<GradeLevel>, { id: string; patch: Partial<GradeLevel> }>({
      query: ({ id, patch }) => ({ url: `academic-structure/grade-levels/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: ['GradeLevels', 'GradeLevelDetail'],
    }),

    deleteGradeLevel: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `academic-structure/grade-levels/${id}`, method: 'DELETE' }),
      invalidatesTags: ['GradeLevels', 'GradeLevelDetail'],
    }),

    setNextGradeLevel: builder.mutation<ActionResult, { id: string; nextGradeLevelId: string | null }>({
      query: ({ id, nextGradeLevelId }) => ({
        url: `academic-structure/grade-levels/${id}/next`,
        method: 'PUT',
        body: { nextGradeLevelId },
      }),
      invalidatesTags: ['GradeLevels', 'GradeLevelDetail'],
    }),

    markGradeLevelFinal: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `academic-structure/grade-levels/${id}/mark-final`, method: 'POST' }),
      invalidatesTags: ['GradeLevels', 'GradeLevelDetail'],
    }),

    getFinalGradeLevel: builder.query<ItemResponse<GradeLevel>, string>({
      query: (schoolId) => `academic-structure/grade-levels/school/${schoolId}/final`,
      providesTags: ['GradeLevels'],
    }),

    getPromotionChain: builder.query<ListResponse<GradeLevel>, string>({
      query: (id) => `academic-structure/grade-levels/${id}/chain`,
      providesTags: ['GradeLevels'],
    }),

    getPreviousGradeLevel: builder.query<ItemResponse<GradeLevel>, string>({
      query: (id) => `academic-structure/grade-levels/${id}/previous`,
      providesTags: ['GradeLevels'],
    }),

    countGradeLevels: builder.query<{ success: boolean; count: number }, string>({
      query: (schoolId) => `academic-structure/grade-levels/school/${schoolId}/count`,
      providesTags: ['GradeLevels'],
    }),

    bulkCreateGradeLevels: builder.mutation<ListResponse<GradeLevel>, { schoolId: string; levels: Partial<GradeLevel>[] }>({
      query: (body) => ({ url: 'academic-structure/grade-levels/bulk', method: 'POST', body }),
      invalidatesTags: ['GradeLevels'],
    }),

    reorderGradeLevels: builder.mutation<ActionResult, { schoolId: string; orderedIds: string[] }>({
      query: (body) => ({ url: 'academic-structure/grade-levels/reorder', method: 'PUT', body }),
      invalidatesTags: ['GradeLevels'],
    }),

    validatePromotionLadder: builder.query<ActionResult, string>({
      query: (schoolId) => `academic-structure/grade-levels/school/${schoolId}/validate-ladder`,
      providesTags: ['GradeLevels'],
    }),

    getGradeLevelByName: builder.query<ItemResponse<GradeLevel>, { schoolId: string; name: string }>({
      query: ({ schoolId, name }) =>
        `academic-structure/grade-levels/school/${schoolId}/lookup?name=${encodeURIComponent(name)}`,
      providesTags: ['GradeLevels'],
    }),

    searchGradeLevels: builder.query<ListResponse<GradeLevel>, { schoolId: string; query: string }>({
      query: ({ schoolId, query }) =>
        `academic-structure/grade-levels/school/${schoolId}/search?query=${encodeURIComponent(query)}`,
      providesTags: ['GradeLevels'],
    }),

    getRootGradeLevels: builder.query<ListResponse<GradeLevel>, string>({
      query: (schoolId) => `academic-structure/grade-levels/school/${schoolId}/root`,
      providesTags: ['GradeLevels'],
    }),

    getPromotionSummary: builder.query<ActionResult, string>({
      query: (schoolId) => `academic-structure/grade-levels/school/${schoolId}/promotion-summary`,
      providesTags: ['GradeLevels'],
    }),

    // ------------------------------------------------------------
    // SUBJECTS (21–38)
    // ------------------------------------------------------------
    createSubject: builder.mutation<ItemResponse<Subject>, Partial<Subject>>({
      query: (body) => ({ url: 'academic-structure/subjects', method: 'POST', body }),
      invalidatesTags: ['Subjects'],
    }),

    getSubjectById: builder.query<ItemResponse<Subject>, string>({
      query: (id) => `academic-structure/subjects/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'SubjectDetail', id }, 'SubjectDetail'],
    }),

    getSubjectByCode: builder.query<ItemResponse<Subject>, { schoolId: string; code: string }>({
      query: ({ schoolId, code }) =>
        `academic-structure/subjects/school/${schoolId}/by-code?code=${encodeURIComponent(code)}`,
      providesTags: ['Subjects'],
    }),

    getSubjectsBySchool: builder.query<ListResponse<Subject>, string>({
      query: (schoolId) => `academic-structure/subjects/school/${schoolId}`,
      providesTags: ['Subjects'],
    }),

    getSubjectsByCategory: builder.query<ListResponse<Subject>, { schoolId: string; category: string }>({
      query: ({ schoolId, category }) =>
        `academic-structure/subjects/school/${schoolId}/by-category?category=${encodeURIComponent(category)}`,
      providesTags: ['Subjects'],
    }),

    updateSubject: builder.mutation<ItemResponse<Subject>, { id: string; patch: Partial<Subject> }>({
      query: ({ id, patch }) => ({ url: `academic-structure/subjects/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: ['Subjects', 'SubjectDetail'],
    }),

    deleteSubject: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `academic-structure/subjects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Subjects', 'SubjectDetail'],
    }),

    countSubjects: builder.query<{ success: boolean; count: number }, string>({
      query: (schoolId) => `academic-structure/subjects/school/${schoolId}/count`,
      providesTags: ['Subjects'],
    }),

    bulkCreateSubjects: builder.mutation<ListResponse<Subject>, { schoolId: string; subjects: Partial<Subject>[] }>({
      query: (body) => ({ url: 'academic-structure/subjects/bulk', method: 'POST', body }),
      invalidatesTags: ['Subjects'],
    }),

    searchSubjects: builder.query<ListResponse<Subject>, { schoolId: string; query: string }>({
      query: ({ schoolId, query }) =>
        `academic-structure/subjects/school/${schoolId}/search?query=${encodeURIComponent(query)}`,
      providesTags: ['Subjects'],
    }),

    getSubjectsByClass: builder.query<ListResponse<Subject>, string>({
      query: (classId) => `academic-structure/subjects/class/${classId}`,
      providesTags: ['Subjects', 'ClassSubjects'],
    }),

    getSubjectsByTeacher: builder.query<ListResponse<Subject>, string>({
      query: (teacherId) => `academic-structure/subjects/teacher/${teacherId}`,
      providesTags: ['Subjects'],
    }),

    duplicateSubject: builder.mutation<ItemResponse<Subject>, { id: string; newCode: string }>({
      query: ({ id, newCode }) => ({
        url: `academic-structure/subjects/${id}/duplicate`,
        method: 'POST',
        body: { newCode },
      }),
      invalidatesTags: ['Subjects'],
    }),

    getSubjectUsageCount: builder.query<{ success: boolean; count: number }, string>({
      query: (id) => `academic-structure/subjects/${id}/usage-count`,
      providesTags: ['Subjects'],
    }),

    getSubjectUsageSummary: builder.query<ActionResult, string>({
      query: (schoolId) => `academic-structure/subjects/school/${schoolId}/usage-summary`,
      providesTags: ['Subjects'],
    }),

    renameSubjectCode: builder.mutation<ItemResponse<Subject>, { id: string; newCode: string }>({
      query: ({ id, newCode }) => ({
        url: `academic-structure/subjects/${id}/code`,
        method: 'PUT',
        body: { newCode },
      }),
      invalidatesTags: ['Subjects', 'SubjectDetail'],
    }),

    verifySubject: builder.query<{ success: boolean; belongs: boolean }, { schoolId: string; subjectId: string }>({
      query: ({ schoolId, subjectId }) =>
        `academic-structure/subjects/verify?schoolId=${schoolId}&subjectId=${subjectId}`,
      providesTags: ['Subjects'],
    }),

    getCoreSubjects: builder.query<ListResponse<Subject>, string>({
      query: (schoolId) => `academic-structure/subjects/school/${schoolId}/core`,
      providesTags: ['Subjects'],
    }),

    // ------------------------------------------------------------
    // CLASSES (39–60)
    // ------------------------------------------------------------
    createClass: builder.mutation<ItemResponse<ClassEntity>, Partial<ClassEntity>>({
      query: (body) => ({ url: 'academic-structure/classes', method: 'POST', body }),
      invalidatesTags: ['Classes'],
    }),

    getClassById: builder.query<ItemResponse<ClassEntity>, string>({
      query: (id) => `academic-structure/classes/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'ClassDetail', id }, 'ClassDetail'],
    }),

    getClassWithRelations: builder.query<ActionResult, string>({
      query: (id) => `academic-structure/classes/${id}/with-relations`,
      providesTags: (_r, _e, id) => [{ type: 'ClassDetail', id }, 'ClassDetail'],
    }),

    getClassesBySchool: builder.query<ListResponse<ClassEntity>, string>({
      query: (schoolId) => `academic-structure/classes/school/${schoolId}`,
      providesTags: ['Classes'],
    }),

    getClassesByYear: builder.query<ListResponse<ClassEntity>, { schoolId: string; academicYear: string }>({
      query: ({ schoolId, academicYear }) =>
        `academic-structure/classes/school/${schoolId}/by-year?academicYear=${encodeURIComponent(academicYear)}`,
      providesTags: ['Classes'],
    }),

    getClassesByGradeLevel: builder.query<ListResponse<ClassEntity>, string>({
      query: (gradeLevelId) => `academic-structure/classes/grade-level/${gradeLevelId}`,
      providesTags: ['Classes'],
    }),

    getClassesByTeacher: builder.query<ListResponse<ClassEntity>, string>({
      query: (teacherId) => `academic-structure/classes/teacher/${teacherId}`,
      providesTags: ['Classes'],
    }),

    updateClass: builder.mutation<ItemResponse<ClassEntity>, { id: string; patch: Partial<ClassEntity> }>({
      query: ({ id, patch }) => ({ url: `academic-structure/classes/${id}`, method: 'PUT', body: patch }),
      invalidatesTags: ['Classes', 'ClassDetail'],
    }),

    deleteClass: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `academic-structure/classes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Classes', 'ClassDetail'],
    }),

    assignClassTeacher: builder.mutation<ActionResult, { id: string; teacherId: string }>({
      query: ({ id, teacherId }) => ({
        url: `academic-structure/classes/${id}/teacher`,
        method: 'PUT',
        body: { teacherId },
      }),
      invalidatesTags: ['Classes', 'ClassDetail'],
    }),

    addSubjectToClass: builder.mutation<ItemResponse<ClassSubjectLink>, Partial<ClassSubjectLink>>({
      query: ({ classId, ...body }) => ({
        url: `academic-structure/classes/${classId}/subjects`,
        method: 'POST',
        body: { classId, ...body },
      }),
      invalidatesTags: ['Classes', 'ClassSubjects', 'Subjects'],
    }),

    removeSubjectFromClass: builder.mutation<ActionResult, { classId: string; subjectId: string }>({
      query: ({ classId, subjectId }) => ({
        url: `academic-structure/classes/${classId}/subjects/${subjectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Classes', 'ClassSubjects', 'Subjects'],
    }),

    assignClassSubjectTeacher: builder.mutation<
      ActionResult,
      { classSubjectId: string; teacherId: string }
    >({
      query: ({ classSubjectId, teacherId }) => ({
        url: `academic-structure/class-subjects/${classSubjectId}/teacher`,
        method: 'PUT',
        body: { teacherId },
      }),
      invalidatesTags: ['ClassSubjects', 'Classes'],
    }),

    getClassStudents: builder.query<ListResponse<any>, string>({
      query: (classId) => `academic-structure/classes/${classId}/students`,
      providesTags: ['Classes'],
    }),

    countClassStudents: builder.query<{ success: boolean; count: number }, string>({
      query: (classId) => `academic-structure/classes/${classId}/students/count`,
      providesTags: ['Classes'],
    }),

    checkClassCapacity: builder.query<ActionResult, string>({
      query: (classId) => `academic-structure/classes/${classId}/capacity`,
      providesTags: ['Classes'],
    }),

    bulkCreateClasses: builder.mutation<ListResponse<ClassEntity>, { schoolId: string; classes: Partial<ClassEntity>[] }>({
      query: (body) => ({ url: 'academic-structure/classes/bulk', method: 'POST', body }),
      invalidatesTags: ['Classes'],
    }),

    rollClassesToYear: builder.mutation<ActionResult, { schoolId: string; fromYear: string; toYear: string }>({
      query: (body) => ({ url: 'academic-structure/classes/roll-to-year', method: 'POST', body }),
      invalidatesTags: ['Classes'],
    }),

    transferStudent: builder.mutation<ActionResult, { studentId: string; toClassId: string }>({
      query: (body) => ({ url: 'academic-structure/classes/transfer-student', method: 'POST', body }),
      invalidatesTags: ['Classes', 'StudentLinks'],
    }),

    getClassStatistics: builder.query<ActionResult, string>({
      query: (classId) => `academic-structure/classes/${classId}/statistics`,
      providesTags: ['Classes'],
    }),

    searchClasses: builder.query<ListResponse<ClassEntity>, { schoolId: string; query: string }>({
      query: ({ schoolId, query }) =>
        `academic-structure/classes/school/${schoolId}/search?query=${encodeURIComponent(query)}`,
      providesTags: ['Classes'],
    }),

    validateClassReadiness: builder.query<ActionResult, string>({
      query: (classId) => `academic-structure/classes/${classId}/readiness`,
      providesTags: ['Classes'],
    }),

    // ------------------------------------------------------------
    // STUDENT LINKING (61)
    // ------------------------------------------------------------
    linkStudent: builder.mutation<
      ActionResult,
      { studentId: string; classId: string; requireUnplaced?: boolean; termId?: string }
    >({
      query: (body) => ({ url: 'academic-structure/classes/link-student', method: 'POST', body }),
      invalidatesTags: ['Classes', 'ClassDetail', 'StudentLinks'],
    }),
  }),
});

// ================================================================
// HOOK EXPORTS — TERMS
// ================================================================
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

// ================================================================
// HOOK EXPORTS — ACADEMIC STRUCTURE
// ================================================================
export const {
  // Grade levels
  useCreateGradeLevelMutation,
  useGetGradeLevelByIdQuery,
  useGetGradeLevelWithClassesQuery,
  useGetGradeLevelsBySchoolQuery,
  useGetGradeLevelsByStageQuery,
  useUpdateGradeLevelMutation,
  useDeleteGradeLevelMutation,
  useSetNextGradeLevelMutation,
  useMarkGradeLevelFinalMutation,
  useGetFinalGradeLevelQuery,
  useGetPromotionChainQuery,
  useGetPreviousGradeLevelQuery,
  useCountGradeLevelsQuery,
  useBulkCreateGradeLevelsMutation,
  useReorderGradeLevelsMutation,
  useValidatePromotionLadderQuery,
  useGetGradeLevelByNameQuery,
  useSearchGradeLevelsQuery,
  useGetRootGradeLevelsQuery,
  useGetPromotionSummaryQuery,

  // Subjects
  useCreateSubjectMutation,
  useGetSubjectByIdQuery,
  useGetSubjectByCodeQuery,
  useGetSubjectsBySchoolQuery,
  useGetSubjectsByCategoryQuery,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useCountSubjectsQuery,
  useBulkCreateSubjectsMutation,
  useSearchSubjectsQuery,
  useGetSubjectsByClassQuery,
  useGetSubjectsByTeacherQuery,
  useDuplicateSubjectMutation,
  useGetSubjectUsageCountQuery,
  useGetSubjectUsageSummaryQuery,
  useRenameSubjectCodeMutation,
  useVerifySubjectQuery,
  useGetCoreSubjectsQuery,

  // Classes
  useCreateClassMutation,
  useGetClassByIdQuery,
  useGetClassWithRelationsQuery,
  useGetClassesBySchoolQuery,
  useGetClassesByYearQuery,
  useGetClassesByGradeLevelQuery,
  useGetClassesByTeacherQuery,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useAssignClassTeacherMutation,
  useAddSubjectToClassMutation,
  useRemoveSubjectFromClassMutation,
  useAssignClassSubjectTeacherMutation,
  useGetClassStudentsQuery,
  useCountClassStudentsQuery,
  useCheckClassCapacityQuery,
  useBulkCreateClassesMutation,
  useRollClassesToYearMutation,
  useTransferStudentMutation,
  useGetClassStatisticsQuery,
  useSearchClassesQuery,
  useValidateClassReadinessQuery,

  // Student linking
  useLinkStudentMutation,
} = academicStructureApi;