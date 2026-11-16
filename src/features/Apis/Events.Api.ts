import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

export type EventCategory =
  | 'Academic'
  | 'Sports'
  | 'Meeting'
  | 'Cultural'
  | 'General'
  | string;

export type ActivityCategory =
  | 'Sports'
  | 'Academic'
  | 'Clubs'
  | 'Arts'
  | 'Cultural'
  | string;

export interface SchoolEvent {
  id: string;
  schoolId: string;
  title: string;
  description?: string | null;
  category: EventCategory;
  location?: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface CoCurricularActivity {
  id: string;
  schoolId: string;
  name: string;
  category: ActivityCategory;
  patronTeacherId?: string | null;
  patron?: { id: string; name?: string; email?: string; [k: string]: any } | null;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface ActivityMembership {
  id: string;
  schoolId: string;
  activityId: string;
  studentId: string;
  termId: string;
  performanceRole?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: any;
  activity?: CoCurricularActivity;
  [key: string]: any;
}

/* ── Request payloads — Events ───────────────────────────────── */

export interface CreateEventInput {
  schoolId: string;
  title: string;
  description?: string;
  category: EventCategory;
  location?: string;
  startDate: string;
  endDate: string;
}

export interface BulkCreateEventsInput {
  schoolId: string;
  events: Array<Omit<CreateEventInput, 'schoolId'>>;
}

export interface UpdateEventInput {
  eventId: string;
  patch: Partial<Omit<CreateEventInput, 'schoolId'>>;
}

export interface ListEventsParams {
  schoolId: string;
  page?: number;
  limit?: number;
  category?: EventCategory;
  upcomingOnly?: boolean;
}

export interface UpcomingEventsParams {
  schoolId: string;
  withinDays?: number;
  limit?: number;
}

export interface EventRangeParams {
  schoolId: string;
  from: string;
  to: string;
}

export interface EventCalendarParams {
  schoolId: string;
  from?: string;
  to?: string;
}

export interface EventsByCategoryParams {
  schoolId: string;
  category: EventCategory;
}

/* ── Request payloads — Activities ───────────────────────────── */

export interface CreateActivityInput {
  schoolId: string;
  name: string;
  category: ActivityCategory;
  patronTeacherId?: string | null;
}

export interface UpdateActivityInput {
  activityId: string;
  patch: Partial<Pick<CreateActivityInput, 'name' | 'category'>>;
}

export interface AssignPatronInput {
  activityId: string;
  patronTeacherId: string | null;
}

export interface ActivitiesForSchoolParams {
  schoolId: string;
  category?: ActivityCategory;
}

/* ── Request payloads — Memberships ──────────────────────────── */

export interface AddMemberInput {
  schoolId: string;
  studentId: string;
  activityId: string;
  termId: string;
  performanceRole?: string;
}

export interface BulkAddMembersInput {
  schoolId: string;
  activityId: string;
  termId: string;
  studentIds: string[];
  performanceRole?: string;
}

export interface UpdateMembershipRoleInput {
  membershipId: string;
  performanceRole: string;
}

export interface ActivityMembersParams {
  activityId: string;
  termId?: string;
}

export interface StudentActivitiesParams {
  studentId: string;
  termId?: string;
}

export interface TermMembershipsParams {
  schoolId: string;
  termId: string;
}

export interface StudentsNotInActivityParams {
  activityId: string;
  schoolId: string;
  termId: string;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface SingleEventResponse {
  success: boolean;
  message?: string;
  event: SchoolEvent;
  [key: string]: any;
}

export interface EventListResponse {
  success: boolean;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  events: SchoolEvent[];
  [key: string]: any;
}

export interface BulkCreateEventsResponse {
  success: boolean;
  message?: string;
  count?: number;
  events: SchoolEvent[];
  [key: string]: any;
}

export interface EventCalendarResponse {
  success: boolean;
  calendar: Record<string, SchoolEvent[]>; // { "2026-11": [...], "2026-12": [...] }
  [key: string]: any;
}

export interface EventStatsResponse {
  success: boolean;
  stats: {
    total?: number;
    byCategory?: Record<string, number>;
    upcoming?: number;
    thisMonth?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SingleActivityResponse {
  success: boolean;
  message?: string;
  activity: CoCurricularActivity;
  [key: string]: any;
}

export interface ActivityListResponse {
  success: boolean;
  count?: number;
  activities: CoCurricularActivity[];
  [key: string]: any;
}

export interface ActivityCategoriesResponse {
  success: boolean;
  categories: string[];
  [key: string]: any;
}

export interface ActivityStatsResponse {
  success: boolean;
  stats: {
    totalMembers?: number;
    byTerm?: Record<string, number>;
    byRole?: Record<string, number>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface SingleMembershipResponse {
  success: boolean;
  message?: string;
  membership: ActivityMembership;
  [key: string]: any;
}

export interface MembershipListResponse {
  success: boolean;
  count?: number;
  memberships: ActivityMembership[];
  members?: ActivityMembership[];
  [key: string]: any;
}

export interface BulkAddMembersResponse {
  success: boolean;
  message?: string;
  added?: number;
  skipped?: number;
  memberships?: ActivityMembership[];
  [key: string]: any;
}

export interface StudentActivitiesResponse {
  success: boolean;
  count?: number;
  activities: CoCurricularActivity[];
  memberships?: ActivityMembership[];
  [key: string]: any;
}

export interface StudentActivitySummaryResponse {
  success: boolean;
  summary: {
    totalActivities?: number;
    byCategory?: Record<string, number>;
    byTerm?: Record<string, number>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface NotInActivityResponse {
  success: boolean;
  count?: number;
  students: any[];
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

export const eventsApi = createApi({
  reducerPath: 'eventsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/events`,
    credentials: 'include',
  }),
  tagTypes: [
    'Events',
    'EventDetail',
    'EventCalendar',
    'EventStats',
    'Activities',
    'ActivityDetail',
    'ActivityCategories',
    'ActivityStats',
    'Memberships',
    'MembershipDetail',
    'StudentActivities',
    'StudentActivitySummary',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════════
       SCHOOL EVENTS (1.1 – 1.16)
       ═══════════════════════════════════════════════════════════ */

    /** 1.1 POST /schools/{schoolId}/events */
    createEvent: builder.mutation<SingleEventResponse, CreateEventInput>({
      query: (arg: CreateEventInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/events`,
          method: 'POST',
          body: { schoolId, ...body },
        };
      },
      invalidatesTags: ['Events', 'EventCalendar', 'EventStats'],
    }),

    /** 1.2 POST /schools/{schoolId}/events/bulk */
    bulkCreateEvents: builder.mutation<BulkCreateEventsResponse, BulkCreateEventsInput>({
      query: (arg: BulkCreateEventsInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/events/bulk`,
          method: 'POST',
          body: { schoolId, ...body },
        };
      },
      invalidatesTags: ['Events', 'EventCalendar', 'EventStats'],
    }),

    /** 1.3 GET /events/{eventId} */
    getEventById: builder.query<SingleEventResponse, string>({
      query: (eventId: string) => `/events/${eventId}`,
      providesTags: (_r, _e, eventId: string) => [
        { type: 'EventDetail', id: eventId },
      ],
    }),

    /** 1.4–1.6 GET /schools/{schoolId}/events?page=&limit=&category=&upcomingOnly= */
    getEventsForSchool: builder.query<EventListResponse, ListEventsParams>({
      query: (arg: ListEventsParams) => ({
        url: `/schools/${arg.schoolId}/events`,
        params: {
          ...(arg.page !== undefined ? { page: arg.page } : {}),
          ...(arg.limit !== undefined ? { limit: arg.limit } : {}),
          ...(arg.category ? { category: arg.category } : {}),
          ...(arg.upcomingOnly !== undefined ? { upcomingOnly: arg.upcomingOnly } : {}),
        },
      }),
      providesTags: ['Events'],
    }),

    /** 1.7–1.8 GET /schools/{schoolId}/events/upcoming?withinDays=&limit= */
    getUpcomingEvents: builder.query<EventListResponse, UpcomingEventsParams>({
      query: (arg: UpcomingEventsParams) => ({
        url: `/schools/${arg.schoolId}/events/upcoming`,
        params: {
          ...(arg.withinDays !== undefined ? { withinDays: arg.withinDays } : {}),
          ...(arg.limit !== undefined ? { limit: arg.limit } : {}),
        },
      }),
      providesTags: ['Events'],
    }),

    /** 1.9 GET /schools/{schoolId}/events/today */
    getTodayEvents: builder.query<EventListResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/events/today`,
      providesTags: ['Events'],
    }),

    /** 1.10 GET /schools/{schoolId}/events/range?from=&to= */
    getEventsInRange: builder.query<EventListResponse, EventRangeParams>({
      query: (arg: EventRangeParams) => ({
        url: `/schools/${arg.schoolId}/events/range`,
        params: { from: arg.from, to: arg.to },
      }),
      providesTags: ['Events'],
    }),

    /** 1.11 GET /schools/{schoolId}/events/by-category?category= */
    getEventsByCategory: builder.query<EventListResponse, EventsByCategoryParams>({
      query: (arg: EventsByCategoryParams) => ({
        url: `/schools/${arg.schoolId}/events/by-category`,
        params: { category: arg.category },
      }),
      providesTags: ['Events'],
    }),

    /** 1.12–1.13 GET /schools/{schoolId}/events/calendar?from=&to= */
    getEventCalendar: builder.query<EventCalendarResponse, EventCalendarParams>({
      query: (arg: EventCalendarParams) => ({
        url: `/schools/${arg.schoolId}/events/calendar`,
        params: {
          ...(arg.from ? { from: arg.from } : {}),
          ...(arg.to ? { to: arg.to } : {}),
        },
      }),
      providesTags: ['EventCalendar', 'Events'],
    }),

    /** 1.14 PATCH /events/{eventId} */
    updateEvent: builder.mutation<SingleEventResponse, UpdateEventInput>({
      query: (arg: UpdateEventInput) => ({
        url: `/events/${arg.eventId}`,
        method: 'PATCH',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdateEventInput) => [
        { type: 'EventDetail', id: arg.eventId },
        'Events',
        'EventCalendar',
        'EventStats',
      ],
    }),

    /** 1.15 GET /schools/{schoolId}/events/stats */
    getEventStats: builder.query<EventStatsResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/events/stats`,
      providesTags: ['EventStats'],
    }),

    /** 1.16 DELETE /events/{eventId} */
    deleteEvent: builder.mutation<GenericResponse, string>({
      query: (eventId: string) => ({
        url: `/events/${eventId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, eventId: string) => [
        { type: 'EventDetail', id: eventId },
        'Events',
        'EventCalendar',
        'EventStats',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       CO-CURRICULAR ACTIVITIES (2.1 – 2.11)
       ═══════════════════════════════════════════════════════════ */

    /** 2.1–2.2 POST /schools/{schoolId}/activities */
    createActivity: builder.mutation<SingleActivityResponse, CreateActivityInput>({
      query: (arg: CreateActivityInput) => {
        const { schoolId, ...body } = arg;
        return {
          url: `/schools/${schoolId}/activities`,
          method: 'POST',
          body: { schoolId, ...body },
        };
      },
      invalidatesTags: ['Activities', 'ActivityCategories', 'ActivityStats'],
    }),

    /** 2.3 GET /activities/{activityId} */
    getActivityById: builder.query<SingleActivityResponse, string>({
      query: (activityId: string) => `/activities/${activityId}`,
      providesTags: (_r, _e, activityId: string) => [
        { type: 'ActivityDetail', id: activityId },
      ],
    }),

    /** 2.4–2.5 GET /schools/{schoolId}/activities?category= */
    getActivitiesForSchool: builder.query<
      ActivityListResponse,
      ActivitiesForSchoolParams
    >({
      query: (arg: ActivitiesForSchoolParams) => ({
        url: `/schools/${arg.schoolId}/activities`,
        params: arg.category ? { category: arg.category } : {},
      }),
      providesTags: ['Activities'],
    }),

    /** 2.6 GET /schools/{schoolId}/activities/categories */
    getActivityCategories: builder.query<ActivityCategoriesResponse, string>({
      query: (schoolId: string) => `/schools/${schoolId}/activities/categories`,
      providesTags: ['ActivityCategories'],
    }),

    /** 2.7 GET /activities/patrons/{teacherId} */
    getActivitiesByPatron: builder.query<ActivityListResponse, string>({
      query: (teacherId: string) => `/activities/patrons/${teacherId}`,
      providesTags: ['Activities'],
    }),

    /** 2.8–2.9 PATCH /activities/{activityId}/patron */
    assignPatron: builder.mutation<SingleActivityResponse, AssignPatronInput>({
      query: (arg: AssignPatronInput) => ({
        url: `/activities/${arg.activityId}/patron`,
        method: 'PATCH',
        body: { patronTeacherId: arg.patronTeacherId },
      }),
      invalidatesTags: (_r, _e, arg: AssignPatronInput) => [
        { type: 'ActivityDetail', id: arg.activityId },
        'Activities',
      ],
    }),

    /** 2.10 PATCH /activities/{activityId} */
    updateActivity: builder.mutation<SingleActivityResponse, UpdateActivityInput>({
      query: (arg: UpdateActivityInput) => ({
        url: `/activities/${arg.activityId}`,
        method: 'PATCH',
        body: arg.patch,
      }),
      invalidatesTags: (_r, _e, arg: UpdateActivityInput) => [
        { type: 'ActivityDetail', id: arg.activityId },
        'Activities',
        'ActivityCategories',
      ],
    }),

    /** 2.11 GET /activities/{activityId}/stats */
    getActivityStats: builder.query<ActivityStatsResponse, string>({
      query: (activityId: string) => `/activities/${activityId}/stats`,
      providesTags: (_r, _e, activityId: string) => [
        { type: 'ActivityStats', id: activityId },
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       STUDENT ACTIVITY MEMBERSHIPS (3.1 – 3.12)
       ═══════════════════════════════════════════════════════════ */

    /** 3.1 POST /activities/members */
    addActivityMember: builder.mutation<SingleMembershipResponse, AddMemberInput>({
      query: (body: AddMemberInput) => ({
        url: '/activities/members',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, arg: AddMemberInput) => [
        'Memberships',
        { type: 'ActivityDetail', id: arg.activityId },
        { type: 'StudentActivities', id: `${arg.studentId}::${arg.termId}` },
        { type: 'StudentActivities', id: arg.studentId },
        { type: 'StudentActivitySummary', id: arg.studentId },
        { type: 'ActivityStats', id: arg.activityId },
      ],
    }),

    /** 3.2 POST /activities/{activityId}/members/bulk */
    bulkAddActivityMembers: builder.mutation<
      BulkAddMembersResponse,
      BulkAddMembersInput
    >({
      query: (arg: BulkAddMembersInput) => {
        const { activityId, ...body } = arg;
        return {
          url: `/activities/${activityId}/members/bulk`,
          method: 'POST',
          body: { activityId, ...body },
        };
      },
      invalidatesTags: (_r, _e, arg: BulkAddMembersInput) => [
        'Memberships',
        { type: 'ActivityDetail', id: arg.activityId },
        'StudentActivities',
        'StudentActivitySummary',
        { type: 'ActivityStats', id: arg.activityId },
      ],
    }),

    /** 3.3 GET /memberships/{membershipId} */
    getMembershipById: builder.query<SingleMembershipResponse, string>({
      query: (membershipId: string) => `/memberships/${membershipId}`,
      providesTags: (_r, _e, membershipId: string) => [
        { type: 'MembershipDetail', id: membershipId },
      ],
    }),

    /** 3.4–3.5 GET /activities/{activityId}/members?termId= */
    getActivityMembers: builder.query<MembershipListResponse, ActivityMembersParams>({
      query: (arg: ActivityMembersParams) => ({
        url: `/activities/${arg.activityId}/members`,
        params: arg.termId ? { termId: arg.termId } : {},
      }),
      providesTags: (_r, _e, arg: ActivityMembersParams) => [
        {
          type: 'Memberships',
          id: arg.termId ? `${arg.activityId}::${arg.termId}` : arg.activityId,
        },
        { type: 'ActivityDetail', id: arg.activityId },
      ],
    }),

    /** 3.6 GET /schools/{schoolId}/terms/{termId}/memberships */
    getTermMemberships: builder.query<MembershipListResponse, TermMembershipsParams>({
      query: (arg: TermMembershipsParams) =>
        `/schools/${arg.schoolId}/terms/${arg.termId}/memberships`,
      providesTags: (_r, _e, arg: TermMembershipsParams) => [
        { type: 'Memberships', id: `term::${arg.termId}` },
      ],
    }),

    /** 3.7–3.8 GET /students/{studentId}/activities?termId= */
    getStudentActivities: builder.query<
      StudentActivitiesResponse,
      StudentActivitiesParams
    >({
      query: (arg: StudentActivitiesParams) => ({
        url: `/students/${arg.studentId}/activities`,
        params: arg.termId ? { termId: arg.termId } : {},
      }),
      providesTags: (_r, _e, arg: StudentActivitiesParams) => [
        {
          type: 'StudentActivities',
          id: arg.termId ? `${arg.studentId}::${arg.termId}` : arg.studentId,
        },
      ],
    }),

    /** 3.9 GET /students/{studentId}/activities/summary */
    getStudentActivitySummary: builder.query<StudentActivitySummaryResponse, string>({
      query: (studentId: string) => `/students/${studentId}/activities/summary`,
      providesTags: (_r, _e, studentId: string) => [
        { type: 'StudentActivitySummary', id: studentId },
      ],
    }),

    /** 3.10 PATCH /memberships/{membershipId}/role */
    updateMembershipRole: builder.mutation<
      SingleMembershipResponse,
      UpdateMembershipRoleInput
    >({
      query: (arg: UpdateMembershipRoleInput) => ({
        url: `/memberships/${arg.membershipId}/role`,
        method: 'PATCH',
        body: { performanceRole: arg.performanceRole },
      }),
      invalidatesTags: (_r, _e, arg: UpdateMembershipRoleInput) => [
        { type: 'MembershipDetail', id: arg.membershipId },
        'Memberships',
        'StudentActivities',
      ],
    }),

    /** 3.11 GET /activities/{activityId}/members/not-in/schools/{schoolId}/terms/{termId} */
    getStudentsNotInActivity: builder.query<
      NotInActivityResponse,
      StudentsNotInActivityParams
    >({
      query: (arg: StudentsNotInActivityParams) =>
        `/activities/${arg.activityId}/members/not-in/schools/${arg.schoolId}/terms/${arg.termId}`,
      providesTags: (_r, _e, arg: StudentsNotInActivityParams) => [
        { type: 'Memberships', id: `not-in::${arg.activityId}::${arg.termId}` },
      ],
    }),

    /** 3.12 DELETE /memberships/{membershipId} */
    removeActivityMember: builder.mutation<GenericResponse, string>({
      query: (membershipId: string) => ({
        url: `/memberships/${membershipId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, membershipId: string) => [
        { type: 'MembershipDetail', id: membershipId },
        'Memberships',
        'StudentActivities',
        'StudentActivitySummary',
        'ActivityStats',
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Events ── */
  useCreateEventMutation,
  useBulkCreateEventsMutation,
  useGetEventByIdQuery,
  useGetEventsForSchoolQuery,
  useGetUpcomingEventsQuery,
  useGetTodayEventsQuery,
  useGetEventsInRangeQuery,
  useGetEventsByCategoryQuery,
  useGetEventCalendarQuery,
  useUpdateEventMutation,
  useGetEventStatsQuery,
  useDeleteEventMutation,

  /* ── Activities ── */
  useCreateActivityMutation,
  useGetActivityByIdQuery,
  useGetActivitiesForSchoolQuery,
  useGetActivityCategoriesQuery,
  useGetActivitiesByPatronQuery,
  useAssignPatronMutation,
  useUpdateActivityMutation,
  useGetActivityStatsQuery,

  /* ── Memberships ── */
  useAddActivityMemberMutation,
  useBulkAddActivityMembersMutation,
  useGetMembershipByIdQuery,
  useGetActivityMembersQuery,
  useGetTermMembershipsQuery,
  useGetStudentActivitiesQuery,
  useGetStudentActivitySummaryQuery,
  useUpdateMembershipRoleMutation,
  useGetStudentsNotInActivityQuery,
  useRemoveActivityMemberMutation,
} = eventsApi;