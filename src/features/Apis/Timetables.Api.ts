import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday'
  | string;

export interface Period {
  id: string;
  schoolId: string;
  periodNumber: number;
  name: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface TimetableSlot {
  id: string;
  schoolId: string;
  classId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId?: string | null;
  teacherId?: string | null;
  room?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Expanded relations when backend includes them
  period?: Period;
  subject?: { id: string; name?: string; code?: string; [k: string]: any };
  teacher?: { id: string; name?: string; [k: string]: any };
  class?: { id: string; name?: string; stream?: string; [k: string]: any };
  [key: string]: any;
}

export interface ClassWorkloadItem {
  subjectId: string;
  subjectName?: string;
  lessonCount: number;
  [key: string]: any;
}

export interface TeacherWorkloadItem {
  subjectId?: string;
  subjectName?: string;
  classId?: string;
  className?: string;
  lessonCount: number;
  [key: string]: any;
}

export interface CoverageResponse {
  success: boolean;
  coverage: {
    totalSlots?: number;
    filledSlots?: number;
    emptySlots?: number;
    percentage?: number;
    byClass?: Array<{ classId: string; className?: string; filled?: number; total?: number; [k: string]: any }>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SubjectAllocationItem {
  subjectId: string;
  subjectName?: string;
  lessonCount?: number;
  hours?: number;
  [key: string]: any;
}

export interface ConflictItem {
  slotId?: string;
  classId?: string;
  teacherId?: string;
  room?: string;
  dayOfWeek?: DayOfWeek;
  periodId?: string;
  reason?: string;
  [key: string]: any;
}

/* ── 🆕 Generator types ─────────────────────────────────────── */

export interface GeneratorAllocation {
  classId: string;
  subjectId: string;
  lessonsPerWeek: number;
  requiresDouble: boolean;
  preferredTeacherIds: string[];
}

/**
 * Config accepted by the whole-school generator.
 *
 * The backend now supports additional scheduling constraints:
 *  • `spreadSubjects`      — same subject never sits back-to-back unless it's a chosen double
 *  • `maxDoublesPerDay`    — 0 = no doubles, 1 = at most one double/day (default)
 *  • `dailySubjectIds`     — subjects that MUST appear Mon–Fri
 *  • `maxPerSubjectPerDay` — per-subject daily cap; 0 blocks that subject entirely
 *  • `avoidAdjacentPairs`  — pairs of subjects that must NOT sit next to each other
 */
export interface GeneratorConfig {
  // Teacher load guards
  maxPerTeacherPerDay?: number;      // default 6
  maxPerTeacherPerWeek?: number;     // default 28

  // Subject placement / distribution
  morningHeavySubjectIds?: string[]; // placed in the first half of the day
  maxDoublesPerDay?: number;         // 0 = no doubles, 1 = at most one double/day (default)

  // Spread / clashing rules
  spreadSubjects?: boolean;          // don't put same subject back-to-back (unless it's a double)
  dailySubjectIds?: string[];        // subjects that MUST appear Mon–Fri
  maxPerSubjectPerDay?: Record<string, number>;      // { subjectId: cap }; 0 = BLOCKED
  avoidAdjacentPairs?: Array<[string, string]>;      // pairs that must NOT sit side-by-side

  // Determinism
  seed?: number;                     // reuse for identical layouts
}

export interface GenerateSchoolTimetableInput {
  schoolId: string;
  classIds: string[];
  allocations: GeneratorAllocation[];
  config?: GeneratorConfig;
  options?: {
    clearExisting?: boolean;
    dryRun?: boolean;
  };
}

export interface GeneratedSlot {
  classId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId: string;
  teacherId?: string | null;
  room?: string | null;
}

export interface GeneratorPerClassStat {
  classId: string;
  className: string;
  requested: number;
  placed: number;
  missing: number;
}

export interface GeneratorPerTeacherStat {
  teacherId: string;
  teacherName: string;
  totalLessons: number;
  byDay: Record<string, number>;
}

export interface GeneratorStats {
  perClass: GeneratorPerClassStat[];
  perTeacher: GeneratorPerTeacherStat[];
  coverage: {
    totalSlots: number;
    filledSlots: number;
    percentage: number;
  };
  seed?: number;
  generatedAt?: string;
  dryRun?: boolean;
  [key: string]: any;
}

export interface GenerateResultResponse {
  success: boolean;
  message: string;
  slots: TimetableSlot[];
  count?: number;
  warnings?: string[];
  unplaced?: Array<Record<string, any>>;
  /** Violations that survived generation (for tuning allocations) */
  issues?: Array<Record<string, any>>;
  stats?: GeneratorStats;
  [key: string]: any;
}

export interface DuplicateDayInput {
  schoolId: string;
  sourceDay: DayOfWeek;
  targetDay: DayOfWeek;
  classIds?: string[];
}

export interface AutoAssignTeachersInput {
  schoolId: string;
  maxPerTeacherPerDay?: number;
  maxPerTeacherPerWeek?: number;
  preferSubjectQualified?: boolean;
}

export interface AutoAssignTeachersResponse {
  success: boolean;
  message: string;
  count?: number;
  stats?: {
    considered?: number;
    assigned?: number;
    skipped?: number;
    skippedDetails?: Array<Record<string, any>>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface PerClassCoverageItem {
  classId: string;
  stream?: string;
  gradeLevelId?: string;
  filled: number;
  capacity: number;
  missing: number;
  percentage: number;
}

export interface PerClassCoverageResponse {
  success: boolean;
  message: string;
  coverage?: CoverageResponse['coverage'];
  stats?: {
    perClass?: PerClassCoverageItem[];
    [key: string]: any;
  };
  count?: number;
  [key: string]: any;
}

export interface PreferredTeacherItem {
  teacherId: string;
  teacherName?: string;
  teacherEmail?: string;
  subjectId?: string;
  subjectName?: string | null;
  currentLoad: number;
}

export interface PreferredTeachersResponse {
  success: boolean;
  message: string;
  ranked: PreferredTeacherItem[];
  count?: number;
  [key: string]: any;
}

export interface DetailedConflictItem {
  type: string;
  dayOfWeek: DayOfWeek;
  period?: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  teacher?: { id: string; name?: string; email?: string } | null;
  room?: string;
  conflicts?: Array<{
    slotId: string;
    class?: { id: string; stream?: string } | null;
    subject?: { id: string; name?: string } | null;
    teacher?: { id: string; name?: string } | null;
    room?: string | null;
  }>;
  reason: string;
}

export interface DetailedConflictsResponse {
  success: boolean;
  message: string;
  valid: boolean;
  conflicts: DetailedConflictItem[];
  count?: number;
  [key: string]: any;
}

/* ── Request payloads — Periods ─────────────────────────────── */

export interface BulkCreatePeriodsInput {
  schoolId: string;
  periods: Array<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
  }>;
}

export interface UpdatePeriodInput {
  periodId: string;
  patch: Partial<{
    periodNumber: number;
    name: string;
    startTime: string;
    endTime: string;
    isBreak: boolean;
  }>;
}

export interface ReorderPeriodsInput {
  schoolId: string;
  orderedIds: string[];
}

/* ── Request payloads — Slots ───────────────────────────────── */

export interface SlotInput {
  classId?: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
  subjectId?: string;
  teacherId?: string;
  room?: string;
}

export interface BulkCreateClassSlotsInput {
  schoolId: string;
  classId: string;
  slots: Array<Omit<SlotInput, 'classId'>>;
}

export interface BulkCreateSchoolSlotsInput {
  schoolId: string;
  slots: Array<Required<Pick<SlotInput, 'classId'>> & Omit<SlotInput, 'classId'>>;
}

export interface CreateSlotInput extends SlotInput {
  schoolId: string;
  classId: string;
}

export interface CloneClassSlotsInput {
  schoolId: string;
  sourceClassId: string;
  targetClassId: string;
}

export interface AssignSlotTeacherInput {
  slotId: string;
  teacherId: string | null;
}

export interface BulkUpdateSlotsInput {
  schoolId: string;
  slotIds: string[];
  teacherId?: string | null;
  room?: string | null;
}

export interface AssignSlotRoomInput {
  slotId: string;
  room: string | null;
}

export interface MoveSlotInput {
  slotId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
}

export interface SwapSlotsInput {
  slotAId: string;
  slotBId: string;
}

export interface UpdateSlotInput {
  slotId: string;
  patch: Partial<{
    dayOfWeek: DayOfWeek;
    periodId: string;
    subjectId: string;
    teacherId: string | null;
    room: string | null;
  }>;
}

export interface BulkDeleteSlotsInput {
  schoolId: string;
  slotIds: string[];
}

/* ── Query params ────────────────────────────────────────────── */

export interface PeriodByNumberParams {
  schoolId: string;
  number: number;
}

export interface ClassDayParams {
  classId: string;
  day: DayOfWeek;
}

export interface ClassDayPeriodParams {
  classId: string;
  day: DayOfWeek;
  periodId: string;
}

export interface TeacherDayParams {
  teacherId: string;
  day: DayOfWeek;
}

export interface TeacherUpcomingParams {
  teacherId: string;
  withinMinutes?: number;
}

export interface TeacherFreePeriodsParams {
  teacherId: string;
  dayOfWeek: DayOfWeek;
}

export interface TeacherConflictsParams {
  teacherId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
}

export interface RoomConflictsParams {
  schoolId: string;
  room: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
}

export interface ClassConflictsParams {
  classId: string;
  dayOfWeek: DayOfWeek;
  periodId: string;
}

export interface LeastLoadedTeacherParams {
  schoolId: string;
  subjectId: string;
}

export interface SubjectSlotsParams {
  schoolId: string;
  subjectId: string;
}

export interface TeacherSlotsParams {
  schoolId: string;
  teacherId: string;
}

export interface RoomSlotsParams {
  schoolId: string;
  room: string;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface PeriodListResponse {
  success: boolean;
  count?: number;
  periods: Period[];
  [key: string]: any;
}

export interface SinglePeriodResponse {
  success: boolean;
  message?: string;
  period: Period;
  [key: string]: any;
}

export interface SlotListResponse {
  success: boolean;
  count?: number;
  slots: TimetableSlot[];
  [key: string]: any;
}

export interface SingleSlotResponse {
  success: boolean;
  message?: string;
  slot: TimetableSlot;
  [key: string]: any;
}

export interface BulkSlotsResponse {
  success: boolean;
  message?: string;
  inserted?: number;
  skipped?: number;
  slots?: TimetableSlot[];
  [key: string]: any;
}

export interface ClassTimetableResponse {
  success: boolean;
  classId?: string;
  slots: TimetableSlot[];
  grid?: Record<string, Record<string, TimetableSlot | null>>;
  periods?: Period[];
  [key: string]: any;
}

export interface TodayTimetableResponse {
  success: boolean;
  date?: string;
  dayOfWeek?: DayOfWeek;
  slots: TimetableSlot[];
  [key: string]: any;
}

export interface CurrentLessonResponse {
  success: boolean;
  slot: TimetableSlot | null;
  message?: string;
  [key: string]: any;
}

export interface NextLessonResponse {
  success: boolean;
  slot: TimetableSlot | null;
  message?: string;
  [key: string]: any;
}

export interface FreeSlotsResponse {
  success: boolean;
  count?: number;
  freeSlots: Array<{
    dayOfWeek: DayOfWeek;
    periodId: string;
    period?: Period;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface SlotsPerDayResponse {
  success: boolean;
  slotsPerDay: Record<string, number>;
  [key: string]: any;
}

export interface ClassWorkloadResponse {
  success: boolean;
  workload: ClassWorkloadItem[];
  [key: string]: any;
}

export interface TeacherWorkloadResponse {
  success: boolean;
  workload: TeacherWorkloadItem[];
  [key: string]: any;
}

export interface TeacherAvailabilityResponse {
  success: boolean;
  availability: Record<string, Record<string, boolean>>;
  [key: string]: any;
}

export interface LeastLoadedTeacherResponse {
  success: boolean;
  teacher: { id: string; name?: string; lessonCount?: number; [k: string]: any } | null;
  [key: string]: any;
}

export interface ValidateTimetableResponse {
  success: boolean;
  valid: boolean;
  conflicts?: ConflictItem[];
  issues?: string[];
  [key: string]: any;
}

export interface ConflictCheckResponse {
  success: boolean;
  conflict: boolean;
  conflicts?: ConflictItem[];
  [key: string]: any;
}

export interface EmptyClassesResponse {
  success: boolean;
  count?: number;
  classes: Array<{ id: string; name?: string; stream?: string; [k: string]: any }>;
  [key: string]: any;
}

export interface UnassignedTeachersResponse {
  success: boolean;
  count?: number;
  slots: TimetableSlot[];
  [key: string]: any;
}

export interface WithoutRoomResponse {
  success: boolean;
  count?: number;
  slots: TimetableSlot[];
  [key: string]: any;
}

export interface SubjectAllocationResponse {
  success: boolean;
  allocation: SubjectAllocationItem[];
  [key: string]: any;
}

export interface MasterGridResponse {
  success: boolean;
  grid: Record<string, Record<string, Record<string, TimetableSlot | null>>>;
  periods?: Period[];
  classes?: Array<{ id: string; name?: string; [k: string]: any }>;
  [key: string]: any;
}

export interface ExportResponse {
  success: boolean;
  rows?: any[];
  csv?: string;
  [key: string]: any;
}

export interface ActivePeriodResponse {
  success: boolean;
  period: Period | null;
  [key: string]: any;
}

export interface CountResponse {
  success: boolean;
  count: number;
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

export const timetablesApi = createApi({
  reducerPath: 'timetablesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/timetables`,
    credentials: 'include',
  }),
  tagTypes: [
    'Periods',
    'PeriodDetail',
    'ActivePeriod',
    'Slots',
    'SlotDetail',
    'ClassTimetable',
    'ClassCurrentLesson',
    'ClassNextLesson',
    'ClassWorkload',
    'TeacherTimetable',
    'TeacherCurrentLesson',
    'TeacherUpcoming',
    'TeacherFreePeriods',
    'TeacherWorkload',
    'TeacherAvailability',
    'LeastLoadedTeacher',
    'TimetableValidation',
    'Conflicts',
    'Coverage',
    'EmptyClasses',
    'UnassignedTeachers',
    'WithoutRoom',
    'SubjectAllocation',
    'MasterGrid',
    'Export',
    // 🆕 Added for the newer endpoints
    'Generator',
    'PerClassCoverage',
    'PreferredTeachers',
    'DetailedConflicts',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════════
       PERIODS
       ═══════════════════════════════════════════════════════════ */

    /** Bulk create the school day */
    bulkCreatePeriods: builder.mutation<PeriodListResponse, BulkCreatePeriodsInput>({
      query: (body: BulkCreatePeriodsInput) => ({
        url: '/periods/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Periods', 'Slots', 'ClassTimetable', 'TeacherTimetable', 'MasterGrid'],
    }),

    /** 🆕 One-click seed of the standard 13-period Kenyan school day */
    seedStandardSchoolDay: builder.mutation<PeriodListResponse, string>({
      query: (schoolId: string) => ({
        url: `/schools/${schoolId}/periods/seed-standard`,
        method: 'POST',
      }),
      invalidatesTags: [
        'Periods',
        'ActivePeriod',
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'TimetableValidation',
      ],
    }),

    /** Validate period day (overlaps/gaps) */
    validatePeriods: builder.query<GenericResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/validate`,
      providesTags: ['Periods'],
    }),

    /** List teaching periods (isBreak=false) */
    listTeachingPeriods: builder.query<PeriodListResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/teaching`,
      providesTags: ['Periods'],
    }),

    /** List break periods */
    listBreakPeriods: builder.query<PeriodListResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/breaks`,
      providesTags: ['Periods'],
    }),

    /** Full day (all periods in order) */
    listAllPeriods: builder.query<PeriodListResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods`,
      providesTags: ['Periods'],
    }),

    /** Update a period */
    updatePeriod: builder.mutation<SinglePeriodResponse, UpdatePeriodInput>({
      query: (arg: UpdatePeriodInput) => ({
        url: `/periods/${arg.periodId}`,
        method: 'PATCH',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdatePeriodInput) => [
        { type: 'PeriodDetail', id: arg.periodId },
        'Periods',
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
      ],
    }),

    /** Reorder periods */
    reorderPeriods: builder.mutation<GenericResponse, ReorderPeriodsInput>({
      query: (arg: ReorderPeriodsInput) => ({
        url: `/schools/${arg.schoolId}/periods/reorder`,
        method: 'PUT',
        body: { orderedIds: arg.orderedIds },
      }),
      invalidatesTags: ['Periods', 'ClassTimetable', 'TeacherTimetable', 'MasterGrid'],
    }),

    /** Delete a period */
    deletePeriod: builder.mutation<GenericResponse, string>({
      query: (periodId: string) => ({
        url: `/periods/${periodId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, periodId: string) => [
        { type: 'PeriodDetail', id: periodId },
        'Periods',
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
      ],
    }),

    /** Count periods */
    countPeriods: builder.query<CountResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/count`,
      providesTags: ['Periods'],
    }),

    /** First period */
    getFirstPeriod: builder.query<SinglePeriodResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/first`,
      providesTags: ['Periods'],
    }),

    /** Last period */
    getLastPeriod: builder.query<SinglePeriodResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/last`,
      providesTags: ['Periods'],
    }),

    /** Get period by number */
    getPeriodByNumber: builder.query<SinglePeriodResponse, PeriodByNumberParams>({
      query: (arg: PeriodByNumberParams) =>
        `/schools/${arg.schoolId}/periods/number/${arg.number}`,
      providesTags: ['Periods'],
    }),

    /** Get period by id */
    getPeriodById: builder.query<SinglePeriodResponse, string>({
      query: (periodId: string) => `/periods/${periodId}`,
      providesTags: (_r, _e, periodId: string) => [
        { type: 'PeriodDetail', id: periodId },
      ],
    }),

    /** Currently active period */
    getActivePeriod: builder.query<ActivePeriodResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/periods/active`,
      providesTags: ['ActivePeriod'],
    }),

    /* ═══════════════════════════════════════════════════════════
       SLOTS — CREATE / UPDATE / MOVE / DELETE
       ═══════════════════════════════════════════════════════════ */

    /** Bulk create one class's timetable */
    bulkCreateClassSlots: builder.mutation<
      BulkSlotsResponse,
      BulkCreateClassSlotsInput
    >({
      query: (body: BulkCreateClassSlotsInput) => ({
        url: '/slots/bulk/class',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg: BulkCreateClassSlotsInput) => [
        'Slots',
        { type: 'ClassTimetable', id: arg.classId },
        { type: 'ClassWorkload', id: arg.classId },
        'TeacherTimetable',
        'Coverage',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Bulk create slots across multiple classes */
    bulkCreateSchoolSlots: builder.mutation<
      BulkSlotsResponse,
      BulkCreateSchoolSlotsInput
    >({
      query: (body: BulkCreateSchoolSlotsInput) => ({
        url: '/slots/bulk/school',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'ClassWorkload',
        'TeacherTimetable',
        'Coverage',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Create one slot */
    createSlot: builder.mutation<SingleSlotResponse, CreateSlotInput>({
      query: (body: CreateSlotInput) => ({
        url: '/slots',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg: CreateSlotInput) => [
        'Slots',
        { type: 'ClassTimetable', id: arg.classId },
        { type: 'ClassWorkload', id: arg.classId },
        'TeacherTimetable',
        'Coverage',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Clone one class's timetable into another */
    cloneClassSlots: builder.mutation<BulkSlotsResponse, CloneClassSlotsInput>({
      query: (body: CloneClassSlotsInput) => ({
        url: '/slots/clone',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg: CloneClassSlotsInput) => [
        'Slots',
        { type: 'ClassTimetable', id: arg.targetClassId },
        { type: 'ClassWorkload', id: arg.targetClassId },
        'TeacherTimetable',
        'Coverage',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Assign (or unassign) a teacher on a slot */
    assignSlotTeacher: builder.mutation<SingleSlotResponse, AssignSlotTeacherInput>({
      query: (arg: AssignSlotTeacherInput) => ({
        url: `/slots/${arg.slotId}/teacher`,
        method: 'PATCH',
        body: { teacherId: arg.teacherId },
      }),
      invalidatesTags: (_r, _e, arg: AssignSlotTeacherInput) => [
        { type: 'SlotDetail', id: arg.slotId },
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'TeacherWorkload',
        'UnassignedTeachers',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Bulk update teacher (and/or room) on many slots */
    bulkUpdateSlots: builder.mutation<BulkSlotsResponse, BulkUpdateSlotsInput>({
      query: (arg: BulkUpdateSlotsInput) => {
        const { schoolId, slotIds, ...patch } = arg;
        return {
          url: '/slots/bulk-update',
          method: 'PATCH',
          body: { schoolId, slotIds, ...patch },
        };
      },
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'TeacherWorkload',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Assign (or unassign) a room on a slot */
    assignSlotRoom: builder.mutation<SingleSlotResponse, AssignSlotRoomInput>({
      query: (arg: AssignSlotRoomInput) => ({
        url: `/slots/${arg.slotId}/room`,
        method: 'PATCH',
        body: { room: arg.room },
      }),
      invalidatesTags: (_r, _e, arg: AssignSlotRoomInput) => [
        { type: 'SlotDetail', id: arg.slotId },
        'Slots',
        'ClassTimetable',
        'MasterGrid',
        'WithoutRoom',
        'TimetableValidation',
      ],
    }),

    /** Move a slot to another day/period */
    moveSlot: builder.mutation<SingleSlotResponse, MoveSlotInput>({
      query: (arg: MoveSlotInput) => ({
        url: `/slots/${arg.slotId}/move`,
        method: 'PATCH',
        body: { dayOfWeek: arg.dayOfWeek, periodId: arg.periodId },
      }),
      invalidatesTags: (_r, _e, arg: MoveSlotInput) => [
        { type: 'SlotDetail', id: arg.slotId },
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Swap two slots of the same class */
    swapSlots: builder.mutation<GenericResponse, SwapSlotsInput>({
      query: (body: SwapSlotsInput) => ({
        url: '/slots/swap',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Update a slot (subject/teacher/room/day/period) */
    updateSlot: builder.mutation<SingleSlotResponse, UpdateSlotInput>({
      query: (arg: UpdateSlotInput) => ({
        url: `/slots/${arg.slotId}`,
        method: 'PATCH',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdateSlotInput) => [
        { type: 'SlotDetail', id: arg.slotId },
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'TimetableValidation',
      ],
    }),

    /** Get one slot by id */
    getSlotById: builder.query<SingleSlotResponse, string>({
      query: (slotId: string) => `/slots/${slotId}`,
      providesTags: (_r, _e, slotId: string) => [
        { type: 'SlotDetail', id: slotId },
      ],
    }),

    /** Delete one slot */
    deleteSlot: builder.mutation<GenericResponse, string>({
      query: (slotId: string) => ({
        url: `/slots/${slotId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, slotId: string) => [
        { type: 'SlotDetail', id: slotId },
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'TimetableValidation',
      ],
    }),

    /** Delete a slot by class + day + period */
    deleteSlotByKey: builder.mutation<
      GenericResponse,
      ClassDayPeriodParams
    >({
      query: (arg: ClassDayPeriodParams) =>
        `/classes/${arg.classId}/timetable/day/${arg.day}/period/${arg.periodId}`,
      invalidatesTags: (_r, _e, arg: ClassDayPeriodParams) => [
        { type: 'ClassTimetable', id: arg.classId },
        'Slots',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'TimetableValidation',
      ],
    }),

    /** Bulk delete slots */
    bulkDeleteSlots: builder.mutation<GenericResponse, BulkDeleteSlotsInput>({
      query: (body: BulkDeleteSlotsInput) => ({
        url: '/slots/bulk-delete',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'TimetableValidation',
      ],
    }),

    /** Clear one class's timetable */
    clearClassTimetable: builder.mutation<GenericResponse, string>({
      query: (classId: string) => ({
        url: `/classes/${classId}/timetable`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, classId: string) => [
        { type: 'ClassTimetable', id: classId },
        'Slots',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'TimetableValidation',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       🆕 WHOLE-SCHOOL GENERATOR
       ═══════════════════════════════════════════════════════════ */

    /**
     * Preview the generated timetable without writing to the DB.
     * Returns slots + per-class/per-teacher stats + `issues[]` so you can
     * tune allocations / config before committing.
     */
    previewSchoolTimetable: builder.mutation<GenerateResultResponse, GenerateSchoolTimetableInput>({
      query: (arg: GenerateSchoolTimetableInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/timetable/generate/preview`,
          method: 'POST',
          body: { schoolId, ...body, options: { ...body.options, dryRun: true } },
        };
      },
      invalidatesTags: ['Generator'],
    }),

    /** Generate + save the whole-school timetable */
    generateSchoolTimetable: builder.mutation<GenerateResultResponse, GenerateSchoolTimetableInput>({
      query: (arg: GenerateSchoolTimetableInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/timetable/generate`,
          method: 'POST',
          body: { schoolId, ...body },
        };
      },
      invalidatesTags: [
        'Generator',
        'Slots',
        'ClassTimetable',
        'ClassWorkload',
        'TeacherTimetable',
        'TeacherWorkload',
        'Coverage',
        'MasterGrid',
        'TimetableValidation',
        'Conflicts',
        'DetailedConflicts',
        'PerClassCoverage',
        'EmptyClasses',
        'UnassignedTeachers',
        'WithoutRoom',
        'SubjectAllocation',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       🆕 SETUP / RESET / BULK UTILITIES
       ═══════════════════════════════════════════════════════════ */

    /** Destructive — wipes ALL slots + periods. Requires `confirm: true` */
    resetSchoolSetup: builder.mutation<GenericResponse, { schoolId: string; confirm: boolean }>({
      query: (arg: { schoolId: string; confirm: boolean }) => ({
        url: `/schools/${arg.schoolId}/timetable/reset`,
        method: 'DELETE',
        params: { confirm: arg.confirm ? 'true' : 'false' },
      }),
      invalidatesTags: [
        'Periods',
        'PeriodDetail',
        'ActivePeriod',
        'Slots',
        'SlotDetail',
        'ClassTimetable',
        'ClassWorkload',
        'TeacherTimetable',
        'TeacherWorkload',
        'Coverage',
        'PerClassCoverage',
        'MasterGrid',
        'TimetableValidation',
        'Conflicts',
        'DetailedConflicts',
        'EmptyClasses',
        'UnassignedTeachers',
        'WithoutRoom',
        'SubjectAllocation',
      ],
    }),

    /** Duplicate all slots from one weekday to another */
    duplicateDay: builder.mutation<BulkSlotsResponse, DuplicateDayInput>({
      query: (arg: DuplicateDayInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/timetable/duplicate-day`,
          method: 'POST',
          body,
        };
      },
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'PerClassCoverage',
        'TimetableValidation',
        'Conflicts',
        'DetailedConflicts',
      ],
    }),

    /** Auto-assign least-loaded available teachers to unassigned slots */
    autoAssignMissingTeachers: builder.mutation<AutoAssignTeachersResponse, AutoAssignTeachersInput>({
      query: (arg: AutoAssignTeachersInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/timetable/auto-assign-teachers`,
          method: 'PATCH',
          body,
        };
      },
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'TeacherWorkload',
        'UnassignedTeachers',
        'MasterGrid',
        'TimetableValidation',
        'Conflicts',
        'DetailedConflicts',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       CLASS TIMETABLE — VIEW
       ═══════════════════════════════════════════════════════════ */

    /** Full weekly timetable for a class */
    getClassTimetable: builder.query<ClassTimetableResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassTimetable', id: classId },
      ],
    }),

    /** One day for a class */
    getClassTimetableByDay: builder.query<ClassTimetableResponse, ClassDayParams>({
      query: (arg: ClassDayParams) =>
        `/classes/${arg.classId}/timetable/day/${arg.day}`,
      providesTags: (_r, _e, arg: ClassDayParams) => [
        { type: 'ClassTimetable', id: `${arg.classId}::${arg.day}` },
      ],
    }),

    /** Today's lessons for a class */
    getClassTimetableToday: builder.query<TodayTimetableResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable/today`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassTimetable', id: `${classId}::today` },
      ],
    }),

    /** Current lesson for a class */
    getClassCurrentLesson: builder.query<CurrentLessonResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable/current`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassCurrentLesson', id: classId },
      ],
    }),

    /** Next lesson for a class */
    getClassNextLesson: builder.query<NextLessonResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable/next`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassNextLesson', id: classId },
      ],
    }),

    /** Specific lesson (class + day + period) */
    getClassLessonAt: builder.query<SingleSlotResponse, ClassDayPeriodParams>({
      query: (arg: ClassDayPeriodParams) =>
        `/classes/${arg.classId}/timetable/day/${arg.day}/period/${arg.periodId}`,
      providesTags: (_r, _e, arg: ClassDayPeriodParams) => [
        { type: 'ClassTimetable', id: `${arg.classId}::${arg.day}::${arg.periodId}` },
      ],
    }),

    /** Free/empty slots in a class's timetable */
    getClassFreeSlots: builder.query<FreeSlotsResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable/free-slots`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassTimetable', id: classId },
      ],
    }),

    /** Lesson count per day */
    getClassSlotsPerDay: builder.query<SlotsPerDayResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable/slots-per-day`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassTimetable', id: classId },
      ],
    }),

    /** Class workload (lessons per subject per week) */
    getClassWorkload: builder.query<ClassWorkloadResponse, string>({
      query: (classId: string) => `/classes/${classId}/workload`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassWorkload', id: classId },
      ],
    }),

    /** Count of slots for a class */
    getClassSlotCount: builder.query<CountResponse, string>({
      query: (classId: string) => `/classes/${classId}/timetable/count`,
      providesTags: (_r, _e, classId: string) => [
        { type: 'ClassTimetable', id: classId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       TEACHER TIMETABLE
       ═══════════════════════════════════════════════════════════ */

    /** Teacher's full timetable */
    getTeacherTimetable: builder.query<SlotListResponse, string>({
      query: (teacherId: string) => `/teachers/${teacherId}/timetable`,
      providesTags: (_r, _e, teacherId: string) => [
        { type: 'TeacherTimetable', id: teacherId },
      ],
    }),

    /** Teacher's week grouped by day */
    getTeacherWeeklyTimetable: builder.query<ClassTimetableResponse, string>({
      query: (teacherId: string) => `/teachers/${teacherId}/timetable/weekly`,
      providesTags: (_r, _e, teacherId: string) => [
        { type: 'TeacherTimetable', id: `${teacherId}::weekly` },
      ],
    }),

    /** Teacher's lessons for a day */
    getTeacherDayTimetable: builder.query<SlotListResponse, TeacherDayParams>({
      query: (arg: TeacherDayParams) =>
        `/teachers/${arg.teacherId}/timetable/day/${arg.day}`,
      providesTags: (_r, _e, arg: TeacherDayParams) => [
        { type: 'TeacherTimetable', id: `${arg.teacherId}::${arg.day}` },
      ],
    }),

    /** Teacher's current lesson */
    getTeacherCurrentLesson: builder.query<CurrentLessonResponse, string>({
      query: (teacherId: string) => `/teachers/${teacherId}/timetable/current`,
      providesTags: (_r, _e, teacherId: string) => [
        { type: 'TeacherCurrentLesson', id: teacherId },
      ],
    }),

    /** Teacher's upcoming lessons */
    getTeacherUpcomingLessons: builder.query<SlotListResponse, TeacherUpcomingParams>({
      query: (arg: TeacherUpcomingParams) => ({
        url: `/teachers/${arg.teacherId}/timetable/upcoming`,
        params: arg.withinMinutes !== undefined ? { withinMinutes: arg.withinMinutes } : {},
      }),
      providesTags: (_r, _e, arg: TeacherUpcomingParams) => [
        { type: 'TeacherUpcoming', id: arg.teacherId },
      ],
    }),

    /** Teacher's free periods on a day */
    getTeacherFreePeriods: builder.query<PeriodListResponse, TeacherFreePeriodsParams>({
      query: (arg: TeacherFreePeriodsParams) => ({
        url: `/teachers/${arg.teacherId}/free-periods`,
        params: { dayOfWeek: arg.dayOfWeek },
      }),
      providesTags: (_r, _e, arg: TeacherFreePeriodsParams) => [
        { type: 'TeacherFreePeriods', id: `${arg.teacherId}::${arg.dayOfWeek}` },
      ],
    }),

    /** Teacher workload */
    getTeacherWorkload: builder.query<TeacherWorkloadResponse, string>({
      query: (teacherId: string) => `/teachers/${teacherId}/workload`,
      providesTags: (_r, _e, teacherId: string) => [
        { type: 'TeacherWorkload', id: teacherId },
      ],
    }),

    /** Teacher availability matrix */
    getTeacherAvailability: builder.query<TeacherAvailabilityResponse, string>({
      query: (teacherId: string) => `/teachers/${teacherId}/availability`,
      providesTags: (_r, _e, teacherId: string) => [
        { type: 'TeacherAvailability', id: teacherId },
      ],
    }),

    /** Least loaded teacher for a subject */
    getLeastLoadedTeacher: builder.query<
      LeastLoadedTeacherResponse,
      LeastLoadedTeacherParams
    >({
      query: (arg: LeastLoadedTeacherParams) =>
        `/schools/${arg.schoolId}/subjects/${arg.subjectId}/least-loaded-teacher`,
      providesTags: (_r, _e, arg: LeastLoadedTeacherParams) => [
        { type: 'LeastLoadedTeacher', id: `${arg.schoolId}::${arg.subjectId}` },
      ],
    }),

    /** 🆕 Teachers qualified for a subject, sorted by current load */
    getPreferredTeachersForSubject: builder.query<
      PreferredTeachersResponse,
      LeastLoadedTeacherParams
    >({
      query: (arg: LeastLoadedTeacherParams) =>
        `/schools/${arg.schoolId}/subjects/${arg.subjectId}/preferred-teachers`,
      providesTags: (_r, _e, arg: LeastLoadedTeacherParams) => [
        { type: 'PreferredTeachers', id: `${arg.schoolId}::${arg.subjectId}` },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       CLASH CHECKS / VALIDATION
       ═══════════════════════════════════════════════════════════ */

    /** Validate whole-school timetable (teacher & room conflicts) */
    validateTimetable: builder.query<ValidateTimetableResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/validate`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'TimetableValidation', id: schoolId },
      ],
    }),

    /** Check teacher conflicts at a specific time */
    checkTeacherConflict: builder.query<ConflictCheckResponse, TeacherConflictsParams>({
      query: (arg: TeacherConflictsParams) => ({
        url: `/teachers/${arg.teacherId}/conflicts`,
        params: { dayOfWeek: arg.dayOfWeek, periodId: arg.periodId },
      }),
      providesTags: (_r, _e, arg: TeacherConflictsParams) => [
        { type: 'Conflicts', id: `teacher::${arg.teacherId}::${arg.dayOfWeek}::${arg.periodId}` },
      ],
    }),

    /** Check room conflicts at a specific time */
    checkRoomConflict: builder.query<ConflictCheckResponse, RoomConflictsParams>({
      query: (arg: RoomConflictsParams) => ({
        url: `/schools/${arg.schoolId}/rooms/conflicts`,
        params: { room: arg.room, dayOfWeek: arg.dayOfWeek, periodId: arg.periodId },
      }),
      providesTags: (_r, _e, arg: RoomConflictsParams) => [
        { type: 'Conflicts', id: `room::${arg.schoolId}::${arg.room}::${arg.dayOfWeek}::${arg.periodId}` },
      ],
    }),

    /** Check class conflicts at a specific time */
    checkClassConflict: builder.query<ConflictCheckResponse, ClassConflictsParams>({
      query: (arg: ClassConflictsParams) => ({
        url: `/classes/${arg.classId}/conflicts`,
        params: { dayOfWeek: arg.dayOfWeek, periodId: arg.periodId },
      }),
      providesTags: (_r, _e, arg: ClassConflictsParams) => [
        { type: 'Conflicts', id: `class::${arg.classId}::${arg.dayOfWeek}::${arg.periodId}` },
      ],
    }),

    /** Classes with no timetable */
    getEmptyClasses: builder.query<EmptyClassesResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/empty-classes`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'EmptyClasses', id: schoolId },
      ],
    }),

    /** Slots without teacher assigned */
    getUnassignedTeacherSlots: builder.query<UnassignedTeachersResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/unassigned-teachers`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'UnassignedTeachers', id: schoolId },
      ],
    }),

    /** Slots without a room assigned */
    getSlotsWithoutRoom: builder.query<WithoutRoomResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/without-room`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'WithoutRoom', id: schoolId },
      ],
    }),

    /** Coverage percentage */
    getCoverage: builder.query<CoverageResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/coverage`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'Coverage', id: schoolId },
      ],
    }),

    /** 🆕 Per-class coverage report — filled/capacity/missing/percentage per class */
    getPerClassCoverage: builder.query<PerClassCoverageResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/per-class-coverage`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'PerClassCoverage', id: schoolId },
      ],
    }),

    /** 🆕 Detailed conflicts with class/subject/teacher/period names resolved */
    getDetailedConflicts: builder.query<DetailedConflictsResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/conflicts-detailed`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'DetailedConflicts', id: schoolId },
      ],
    }),

    /** Subject allocation (lessons and hours per subject) */
    getSubjectAllocation: builder.query<SubjectAllocationResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/subject-allocation`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'SubjectAllocation', id: schoolId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       MASTER TIMETABLE VIEWS
       ═══════════════════════════════════════════════════════════ */

    /** Master grid — every class, every day */
    getMasterGrid: builder.query<MasterGridResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/grid`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'MasterGrid', id: schoolId },
      ],
    }),

    /** Flat export (CSV/PDF friendly) */
    getMasterExport: builder.query<ExportResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/export`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'Export', id: schoolId },
      ],
    }),

    /** Every slot in the school */
    getAllSlots: builder.query<SlotListResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/timetable/slots`,
      providesTags: (_r, _e, schoolId: string) => [
        { type: 'Slots', id: schoolId },
      ],
    }),

    /** Everywhere one subject is taught */
    getSubjectSlots: builder.query<SlotListResponse, SubjectSlotsParams>({
      query: (arg: SubjectSlotsParams) =>
        `/schools/${arg.schoolId}/timetable/subject/${arg.subjectId}`,
      providesTags: (_r, _e, arg: SubjectSlotsParams) => [
        { type: 'Slots', id: `subject::${arg.schoolId}::${arg.subjectId}` },
      ],
    }),

    /** Everything one teacher teaches */
    getTeacherSlots: builder.query<SlotListResponse, TeacherSlotsParams>({
      query: (arg: TeacherSlotsParams) =>
        `/schools/${arg.schoolId}/timetable/teacher/${arg.teacherId}`,
      providesTags: (_r, _e, arg: TeacherSlotsParams) => [
        { type: 'Slots', id: `teacher::${arg.schoolId}::${arg.teacherId}` },
      ],
    }),

    /** Everything happening in one room */
    getRoomSlots: builder.query<SlotListResponse, RoomSlotsParams>({
      query: (arg: RoomSlotsParams) =>
        `/schools/${arg.schoolId}/timetable/room/${encodeURIComponent(arg.room)}`,
      providesTags: (_r, _e, arg: RoomSlotsParams) => [
        { type: 'Slots', id: `room::${arg.schoolId}::${arg.room}` },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       CLEANUP
       ═══════════════════════════════════════════════════════════ */

    /** Clear an entire day across the school */
    clearSchoolDay: builder.mutation<
      GenericResponse,
      { schoolId: string; day: DayOfWeek }
    >({
      query: (arg: { schoolId: string; day: DayOfWeek }) =>
        `/schools/${arg.schoolId}/timetable/day/${arg.day}`,
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'PerClassCoverage',
        'TimetableValidation',
      ],
    }),

    /** Clear the entire school timetable */
    clearSchoolTimetable: builder.mutation<GenericResponse, string>({
      query: (schoolId: string) => ({
        url: `/schools/${schoolId}/timetable`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        'Slots',
        'ClassTimetable',
        'TeacherTimetable',
        'MasterGrid',
        'Coverage',
        'PerClassCoverage',
        'EmptyClasses',
        'UnassignedTeachers',
        'WithoutRoom',
        'TimetableValidation',
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Periods ── */
  useBulkCreatePeriodsMutation,
  useValidatePeriodsQuery,
  useListTeachingPeriodsQuery,
  useListBreakPeriodsQuery,
  useListAllPeriodsQuery,
  useUpdatePeriodMutation,
  useReorderPeriodsMutation,
  useDeletePeriodMutation,
  useCountPeriodsQuery,
  useGetFirstPeriodQuery,
  useGetLastPeriodQuery,
  useGetPeriodByNumberQuery,
  useGetPeriodByIdQuery,
  useGetActivePeriodQuery,
  // 🆕
  useSeedStandardSchoolDayMutation,

  /* ── Slots — create/update/delete ── */
  useBulkCreateClassSlotsMutation,
  useBulkCreateSchoolSlotsMutation,
  useCreateSlotMutation,
  useCloneClassSlotsMutation,
  useAssignSlotTeacherMutation,
  useBulkUpdateSlotsMutation,
  useAssignSlotRoomMutation,
  useMoveSlotMutation,
  useSwapSlotsMutation,
  useUpdateSlotMutation,
  useGetSlotByIdQuery,
  useDeleteSlotMutation,
  useDeleteSlotByKeyMutation,
  useBulkDeleteSlotsMutation,
  useClearClassTimetableMutation,

  /* ── 🆕 Generator ── */
  usePreviewSchoolTimetableMutation,
  useGenerateSchoolTimetableMutation,

  /* ── 🆕 Setup / Reset / Bulk utilities ── */
  useResetSchoolSetupMutation,
  useDuplicateDayMutation,
  useAutoAssignMissingTeachersMutation,

  /* ── Class timetable views ── */
  useGetClassTimetableQuery,
  useGetClassTimetableByDayQuery,
  useGetClassTimetableTodayQuery,
  useGetClassCurrentLessonQuery,
  useGetClassNextLessonQuery,
  useGetClassLessonAtQuery,
  useGetClassFreeSlotsQuery,
  useGetClassSlotsPerDayQuery,
  useGetClassWorkloadQuery,
  useGetClassSlotCountQuery,

  /* ── Teacher timetable ── */
  useGetTeacherTimetableQuery,
  useGetTeacherWeeklyTimetableQuery,
  useGetTeacherDayTimetableQuery,
  useGetTeacherCurrentLessonQuery,
  useGetTeacherUpcomingLessonsQuery,
  useGetTeacherFreePeriodsQuery,
  useGetTeacherWorkloadQuery,
  useGetTeacherAvailabilityQuery,
  useGetLeastLoadedTeacherQuery,
  // 🆕
  useGetPreferredTeachersForSubjectQuery,

  /* ── Validation / conflicts ── */
  useValidateTimetableQuery,
  useCheckTeacherConflictQuery,
  useCheckRoomConflictQuery,
  useCheckClassConflictQuery,
  useGetEmptyClassesQuery,
  useGetUnassignedTeacherSlotsQuery,
  useGetSlotsWithoutRoomQuery,
  useGetCoverageQuery,
  useGetSubjectAllocationQuery,
  // 🆕
  useGetPerClassCoverageQuery,
  useGetDetailedConflictsQuery,

  /* ── Master views ── */
  useGetMasterGridQuery,
  useGetMasterExportQuery,
  useGetAllSlotsQuery,
  useGetSubjectSlotsQuery,
  useGetTeacherSlotsQuery,
  useGetRoomSlotsQuery,

  /* ── Cleanup ── */
  useClearSchoolDayMutation,
  useClearSchoolTimetableMutation,
} = timetablesApi;