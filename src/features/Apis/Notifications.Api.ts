import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

/**
 * Target audience for an announcement.
 *  • "All"      — no classId
 *  • "Students" — no classId
 *  • "Teachers" — no classId
 *  • "Parents"  — may optionally include a classId (per-class announcement)
 *  Backend rule (test 5.3): if classId is present, targetAudience MUST be "Parents".
 */
export type AnnouncementAudience =
  | 'All'
  | 'Parents'
  | 'Students'
  | 'Teachers'
  | string;

export type NotificationType =
  | 'System'
  | 'Announcement'
  | 'Message'
  | 'Discipline'
  | string;

export type SmsStatus = 'Queued' | 'Sent' | 'Failed' | string;

export interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  message: string;
  targetAudience: AnnouncementAudience;
  classId?: string | null;
  sendViaSms?: boolean;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  schoolId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
  [key: string]: any;
}

export interface SmsLog {
  id: string;
  schoolId: string;
  to: string;
  message: string;
  status: SmsStatus;
  providerMessageId?: string | null;
  sentAt?: string | null;
  createdAt?: string;
  [key: string]: any;
}

export interface DirectMessage {
  id: string;
  schoolId: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
  [key: string]: any;
}

export interface InboxEntry {
  withUser?: { id: string; name?: string; email?: string; [k: string]: any } | null;
  lastMessage?: DirectMessage;
  unreadCount?: number;
  [key: string]: any;
}

/* ── Request payloads — Announcements ────────────────────────── */

export interface CreateAnnouncementInput {
  schoolId: string;
  /** Min 2 characters (test 5.4). */
  title: string;
  message: string;
  targetAudience: AnnouncementAudience;
  /** Only allowed when targetAudience = "Parents" (test 5.3). */
  classId?: string;
  sendViaSms?: boolean;
}

export interface UpdateAnnouncementInput {
  announcementId: string;
  patch: Partial<{
    title: string;
    message: string;
    targetAudience: AnnouncementAudience;
    sendViaSms: boolean;
  }>;
}

export interface ScheduleAnnouncementInput {
  announcementId: string;
  /** ISO-8601 timestamp, e.g. "2026-12-06T23:59:59Z". */
  expiresAt: string;
}

export interface BulkCreateAnnouncementsInput {
  schoolId: string;
  announcements: Array<{
    title: string;
    message: string;
    targetAudience: AnnouncementAudience;
    classId?: string;
    sendViaSms?: boolean;
  }>;
}

/* ── Request payloads — Notifications ────────────────────────── */

export interface CreateNotificationInput {
  schoolId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface BulkCreateNotificationsInput {
  schoolId: string;
  /** Must be unique (test 5.5 rejects duplicates). */
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
}

export interface MarkAllReadInput {
  /** Omit to mark every unread notification as read. */
  onlyIds?: string[];
}

/* ── Request payloads — SMS ──────────────────────────────────── */

export interface QueueSmsInput {
  schoolId: string;
  /** Must be a valid phone number (test 5.1 rejects free-text). */
  to: string;
  /** Non-empty (test 5.2). */
  message: string;
}

export interface BulkQueueSmsInput {
  schoolId: string;
  recipients: Array<{ to: string; message: string }>;
}

export interface AbsenteesSmsInput {
  schoolId: string;
  /** YYYY-MM-DD. */
  date: string;
}

export interface FeeRemindersSmsInput {
  schoolId: string;
  termId: string;
  minBalance?: number;
}

export interface ReportCardsSmsInput {
  schoolId: string;
  termId: string;
}

export interface AnnouncementSmsInput {
  schoolId: string;
  announcementId: string;
}

export interface MarkSmsSentInput {
  ids: string[];
  providerMessageId?: string;
}

/* ── Request payloads — Direct Messages ──────────────────────── */

export interface SendDmInput {
  schoolId: string;
  /** Cannot equal the caller's own ID (test 5.6). */
  receiverId: string;
  messageText: string;
}

/* ── Query params ────────────────────────────────────────────── */

export interface ListAnnouncementsParams {
  schoolId: string;
  /** Optional filter: "All" | "Parents" | "Students" | "Teachers". */
  audience?: AnnouncementAudience;
}

export interface ListSmsParams {
  schoolId: string;
  /** Optional filter: "Queued" | "Sent" | "Failed". */
  status?: SmsStatus;
}

export interface ThreadParams {
  withUserId: string;
}

export interface MyNotificationsParams {
  unreadOnly?: boolean;
  limit?: number;
}

/* ── Response shapes ─────────────────────────────────────────── */

export interface AnnouncementResponse {
  success: boolean;
  message?: string;
  announcement?: Announcement;
  [key: string]: any;
}

export interface AnnouncementListResponse {
  success: boolean;
  count?: number;
  announcements?: Announcement[];
  [key: string]: any;
}

export interface AnnouncementCountResponse {
  success: boolean;
  count: number;
  [key: string]: any;
}

export interface BulkCreateAnnouncementsResponse {
  success: boolean;
  message?: string;
  count?: number;
  announcements?: Announcement[];
  [key: string]: any;
}

export interface NotificationResponse {
  success: boolean;
  message?: string;
  notification?: Notification;
  [key: string]: any;
}

export interface NotificationListResponse {
  success: boolean;
  count?: number;
  notifications?: Notification[];
  [key: string]: any;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
  [key: string]: any;
}

export interface BulkCreateNotificationsResponse {
  success: boolean;
  message?: string;
  count?: number;
  notifications?: Notification[];
  [key: string]: any;
}

export interface MarkAllReadResponse {
  success: boolean;
  message?: string;
  updated?: number;
  [key: string]: any;
}

export interface SmsLogResponse {
  success: boolean;
  message?: string;
  smsLog?: SmsLog;
  log?: SmsLog;
  [key: string]: any;
}

export interface SmsLogListResponse {
  success: boolean;
  count?: number;
  logs?: SmsLog[];
  smsLogs?: SmsLog[];
  [key: string]: any;
}

export interface SmsStatsResponse {
  success: boolean;
  stats: {
    total?: number;
    byStatus?: Record<string, number>;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface MarkSmsSentResponse {
  success: boolean;
  message?: string;
  updated?: number;
  [key: string]: any;
}

/** Send DM response exposes the row under `messageRow` (see txt captures). */
export interface SendDmResponse {
  success: boolean;
  messageRow: DirectMessage;
  [key: string]: any;
}

export interface InboxResponse {
  success: boolean;
  count?: number;
  inbox?: InboxEntry[];
  conversations?: InboxEntry[];
  [key: string]: any;
}

export interface ThreadResponse {
  success: boolean;
  count?: number;
  messages?: DirectMessage[];
  thread?: DirectMessage[];
  [key: string]: any;
}

export interface UnreadMessagesResponse {
  success: boolean;
  count?: number;
  messages?: DirectMessage[];
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

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL}/api/notifications`,
    credentials: 'include',
  }),
  tagTypes: [
    // Announcements
    'Announcements',
    'AnnouncementDetail',
    'MyAnnouncements',
    'ClassAnnouncements',
    'AnnouncementCount',
    // Notifications
    'Notifications',
    'NotificationDetail',
    'MyNotifications',
    'UnreadCount',
    // SMS
    'SmsLogs',
    'SmsLogDetail',
    'SmsStats',
    // Direct messages
    'Messages',
    'MessageDetail',
    'Inbox',
    'Thread',
    'UnreadMessages',
  ],
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════════════════════════
       1. ANNOUNCEMENTS
       ═══════════════════════════════════════════════════════════ */

    /** 1.1 / 1.2 — Create a school-wide or class-targeted announcement */
    createAnnouncement: builder.mutation<AnnouncementResponse, CreateAnnouncementInput>({
      query: (body) => ({ url: '/announcements', method: 'POST', body }),
      invalidatesTags: (_r, _e, arg) => [
        'Announcements',
        'MyAnnouncements',
        'AnnouncementCount',
        ...(arg.classId
          ? [{ type: 'ClassAnnouncements' as const, id: arg.classId }]
          : []),
      ],
    }),

    /** 1.3 — Get one announcement by ID */
    getAnnouncementById: builder.query<AnnouncementResponse, string>({
      query: (announcementId) => `/announcements/${announcementId}`,
      providesTags: (_r, _e, announcementId) => [
        { type: 'AnnouncementDetail', id: announcementId },
      ],
    }),

    /** 1.4 / 1.5 — List all announcements for a school (optional audience filter) */
    listSchoolAnnouncements: builder.query<
      AnnouncementListResponse,
      ListAnnouncementsParams
    >({
      query: ({ schoolId, audience }) => ({
        url: `/announcements/school/${schoolId}`,
        params: audience ? { audience } : {},
      }),
      providesTags: ['Announcements'],
    }),

    /** 1.6 — My active announcements (not expired, for current user's audience) */
    getMyActiveAnnouncements: builder.query<AnnouncementListResponse, void>({
      query: () => '/announcements/mine',
      providesTags: ['MyAnnouncements'],
    }),

    /** 1.7 — Announcements targeting a specific class */
    getClassAnnouncements: builder.query<AnnouncementListResponse, string>({
      query: (classId) => `/announcements/class/${classId}`,
      providesTags: (_r, _e, classId) => [
        { type: 'ClassAnnouncements', id: classId },
      ],
    }),

    /** 1.8 — Count announcements for a school */
    countSchoolAnnouncements: builder.query<AnnouncementCountResponse, string>({
      query: (schoolId) => `/announcements/school/${schoolId}/count`,
      providesTags: ['AnnouncementCount'],
    }),

    /** 1.9 — Update an announcement */
    updateAnnouncement: builder.mutation<
      AnnouncementResponse,
      UpdateAnnouncementInput
    >({
      query: ({ announcementId, patch }) => ({
        url: `/announcements/${announcementId}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_r, _e, { announcementId }) => [
        { type: 'AnnouncementDetail', id: announcementId },
        'Announcements',
        'MyAnnouncements',
        'ClassAnnouncements',
      ],
    }),

    /** 1.10 — Schedule an expiry date for an announcement */
    scheduleAnnouncementExpiry: builder.mutation<
      AnnouncementResponse,
      ScheduleAnnouncementInput
    >({
      query: ({ announcementId, expiresAt }) => ({
        url: `/announcements/${announcementId}/schedule`,
        method: 'POST',
        body: { expiresAt },
      }),
      invalidatesTags: (_r, _e, { announcementId }) => [
        { type: 'AnnouncementDetail', id: announcementId },
        'Announcements',
        'MyAnnouncements',
      ],
    }),

    /** 1.11 — Bulk-create announcements for a school */
    bulkCreateAnnouncements: builder.mutation<
      BulkCreateAnnouncementsResponse,
      BulkCreateAnnouncementsInput
    >({
      query: (body) => ({ url: '/announcements/bulk', method: 'POST', body }),
      invalidatesTags: [
        'Announcements',
        'MyAnnouncements',
        'AnnouncementCount',
        'ClassAnnouncements',
      ],
    }),

    /** 1.12 — Delete an announcement */
    deleteAnnouncement: builder.mutation<GenericResponse, string>({
      query: (announcementId) => ({
        url: `/announcements/${announcementId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, announcementId) => [
        { type: 'AnnouncementDetail', id: announcementId },
        'Announcements',
        'MyAnnouncements',
        'AnnouncementCount',
        'ClassAnnouncements',
      ],
    }),

    /* ═══════════════════════════════════════════════════════════
       2. NOTIFICATIONS (bell icon)
       ═══════════════════════════════════════════════════════════ */

    /** 2.1 / 2.2 — My notifications (optional unread-only + limit) */
    listMyNotifications: builder.query<
      NotificationListResponse,
      MyNotificationsParams | void
    >({
      query: (params) => {
        const p = params ?? {};
        const qs: Record<string, string | number> = {};
        if (p.unreadOnly !== undefined) qs.unreadOnly = p.unreadOnly ? 'true' : 'false';
        if (p.limit !== undefined) qs.limit = p.limit;
        return {
          url: '/notifications/mine',
          params: Object.keys(qs).length ? qs : {},
        };
      },
      providesTags: ['MyNotifications'],
    }),

    /** 2.3 — My unread notification count */
    getMyUnreadNotificationCount: builder.query<UnreadCountResponse, void>({
      query: () => '/notifications/mine/unread-count',
      providesTags: ['UnreadCount'],
    }),

    /** 2.4 — Create a notification for another user (admin) */
    createNotification: builder.mutation<
      NotificationResponse,
      CreateNotificationInput
    >({
      query: (body) => ({ url: '/notifications', method: 'POST', body }),
      invalidatesTags: (_r, _e, { userId }) => [
        'Notifications',
        { type: 'MyNotifications' as const, id: userId },
      ],
    }),

    /** 2.5 — Bulk-create notifications for multiple users (userIds must be unique) */
    bulkCreateNotifications: builder.mutation<
      BulkCreateNotificationsResponse,
      BulkCreateNotificationsInput
    >({
      query: (body) => ({ url: '/notifications/bulk', method: 'POST', body }),
      invalidatesTags: ['Notifications', 'MyNotifications', 'UnreadCount'],
    }),

    /**
     * 2.6 / 2.7 — Mark all (or a specific subset) of my notifications as read.
     * Pass `{}` or omit body to mark everything as read.
     */
    markAllNotificationsRead: builder.mutation<
      MarkAllReadResponse,
      MarkAllReadInput | void
    >({
      query: (body) => ({
        url: '/notifications/mark-all-read',
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['MyNotifications', 'UnreadCount', 'NotificationDetail'],
    }),

    /* ═══════════════════════════════════════════════════════════
       3. SMS — QUEUE ONLY
       ═══════════════════════════════════════════════════════════ */

    /** 3.1 — Queue a single SMS */
    queueSms: builder.mutation<SmsLogResponse, QueueSmsInput>({
      query: (body) => ({ url: '/sms', method: 'POST', body }),
      invalidatesTags: ['SmsLogs', 'SmsStats'],
    }),

    /** 3.2 — Queue bulk SMS (same or per-recipient message) */
    bulkQueueSms: builder.mutation<
      SmsLogListResponse,
      BulkQueueSmsInput
    >({
      query: (body) => ({ url: '/sms/bulk', method: 'POST', body }),
      invalidatesTags: ['SmsLogs', 'SmsStats'],
    }),

    /** 3.3 — Queue absentee alerts for a given date */
    queueAbsenteesSms: builder.mutation<SmsLogListResponse, AbsenteesSmsInput>({
      query: (body) => ({ url: '/sms/absentees', method: 'POST', body }),
      invalidatesTags: ['SmsLogs', 'SmsStats'],
    }),

    /** 3.4 — Queue fee reminders for the current term */
    queueFeeRemindersSms: builder.mutation<
      SmsLogListResponse,
      FeeRemindersSmsInput
    >({
      query: (body) => ({ url: '/sms/fee-reminders', method: 'POST', body }),
      invalidatesTags: ['SmsLogs', 'SmsStats'],
    }),

    /** 3.5 — Queue report-cards-ready notifications */
    queueReportCardsSms: builder.mutation<
      SmsLogListResponse,
      ReportCardsSmsInput
    >({
      query: (body) => ({ url: '/sms/report-cards-ready', method: 'POST', body }),
      invalidatesTags: ['SmsLogs', 'SmsStats'],
    }),

    /** 3.6 — Queue SMS for a specific announcement */
    queueAnnouncementSms: builder.mutation<
      SmsLogListResponse,
      AnnouncementSmsInput
    >({
      query: (body) => ({ url: '/sms/announcement', method: 'POST', body }),
      invalidatesTags: ['SmsLogs', 'SmsStats'],
    }),

    /** 3.7 / 3.8 — List SMS logs for a school (optional status filter) */
    listSchoolSms: builder.query<SmsLogListResponse, ListSmsParams>({
      query: ({ schoolId, status }) => ({
        url: `/sms/school/${schoolId}`,
        params: status ? { status } : {},
      }),
      providesTags: ['SmsLogs'],
    }),

    /** 3.9 — Get one SMS log by ID */
    getSmsLogById: builder.query<SmsLogResponse, string>({
      query: (smsLogId) => `/sms/${smsLogId}`,
      providesTags: (_r, _e, smsLogId) => [
        { type: 'SmsLogDetail', id: smsLogId },
      ],
    }),

    /** 3.10 — Mark queued SMS as Sent (after the school sends via their provider) */
    markSmsSent: builder.mutation<MarkSmsSentResponse, MarkSmsSentInput>({
      query: (body) => ({ url: '/sms/mark-sent', method: 'POST', body }),
      invalidatesTags: (_r, _e, { ids }) => [
        ...ids.map((id) => ({ type: 'SmsLogDetail' as const, id })),
        'SmsLogs',
        'SmsStats',
      ],
    }),

    /** 3.11 — SMS stats by status for a school */
    getSmsStats: builder.query<SmsStatsResponse, string>({
      query: (schoolId) => `/sms/school/${schoolId}/stats`,
      providesTags: ['SmsStats'],
    }),

    /* ═══════════════════════════════════════════════════════════
       4. DIRECT MESSAGES
       ═══════════════════════════════════════════════════════════ */

    /** 4.1 — Send a direct message */
    sendDirectMessage: builder.mutation<SendDmResponse, SendDmInput>({
      query: (body) => ({ url: '/messages', method: 'POST', body }),
      invalidatesTags: (_r, _e, { receiverId }) => [
        'Messages',
        'Inbox',
        'UnreadMessages',
        { type: 'Thread' as const, id: receiverId },
      ],
    }),

    /** 4.2 — My inbox (most recent message per sender) */
    getInbox: builder.query<InboxResponse, void>({
      query: () => '/messages/inbox',
      providesTags: ['Inbox'],
    }),

    /** 4.3 — Full thread with a specific user */
    getMessageThread: builder.query<ThreadResponse, ThreadParams>({
      query: ({ withUserId }) => ({
        url: '/messages/thread',
        params: { withUserId },
      }),
      providesTags: (_r, _e, { withUserId }) => [
        { type: 'Thread', id: withUserId },
      ],
    }),

    /** 4.4 — My unread messages */
    getUnreadMessages: builder.query<UnreadMessagesResponse, void>({
      query: () => '/messages/unread',
      providesTags: ['UnreadMessages'],
    }),

    /** 4.5 — Mark a message as read */
    markMessageRead: builder.mutation<GenericResponse, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}/read`,
        method: 'POST',
      }),
      invalidatesTags: (_r, _e, messageId) => [
        { type: 'MessageDetail', id: messageId },
        'Messages',
        'Inbox',
        'Thread',
        'UnreadMessages',
      ],
    }),

    /** 4.6 — Delete a message (sender only) */
    deleteMessage: builder.mutation<GenericResponse, string>({
      query: (messageId) => ({
        url: `/messages/${messageId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, messageId) => [
        { type: 'MessageDetail', id: messageId },
        'Messages',
        'Inbox',
        'Thread',
        'UnreadMessages',
      ],
    }),
  }),
});

/* ═══════════════════════════════════════════════════════════════
   HOOKS EXPORT
   ═══════════════════════════════════════════════════════════════ */

export const {
  /* ── Announcements ── */
  useCreateAnnouncementMutation,
  useGetAnnouncementByIdQuery,
  useListSchoolAnnouncementsQuery,
  useGetMyActiveAnnouncementsQuery,
  useGetClassAnnouncementsQuery,
  useCountSchoolAnnouncementsQuery,
  useUpdateAnnouncementMutation,
  useScheduleAnnouncementExpiryMutation,
  useBulkCreateAnnouncementsMutation,
  useDeleteAnnouncementMutation,

  /* ── Notifications ── */
  useListMyNotificationsQuery,
  useGetMyUnreadNotificationCountQuery,
  useCreateNotificationMutation,
  useBulkCreateNotificationsMutation,
  useMarkAllNotificationsReadMutation,

  /* ── SMS ── */
  useQueueSmsMutation,
  useBulkQueueSmsMutation,
  useQueueAbsenteesSmsMutation,
  useQueueFeeRemindersSmsMutation,
  useQueueReportCardsSmsMutation,
  useQueueAnnouncementSmsMutation,
  useListSchoolSmsQuery,
  useGetSmsLogByIdQuery,
  useMarkSmsSentMutation,
  useGetSmsStatsQuery,

  /* ── Direct Messages ── */
  useSendDirectMessageMutation,
  useGetInboxQuery,
  useGetMessageThreadQuery,
  useGetUnreadMessagesQuery,
  useMarkMessageReadMutation,
  useDeleteMessageMutation,
} = notificationsApi;