import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  useCreateAnnouncementMutation,
  useListSchoolAnnouncementsQuery,
  useUpdateAnnouncementMutation,
  useScheduleAnnouncementExpiryMutation,
  useDeleteAnnouncementMutation,
  useQueueAnnouncementSmsMutation,
  useListMyNotificationsQuery,
  useGetMyUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useQueueSmsMutation,
  useBulkQueueSmsMutation,
  useQueueAbsenteesSmsMutation,
  useQueueFeeRemindersSmsMutation,
  useQueueReportCardsSmsMutation,
  useListSchoolSmsQuery,
  useMarkSmsSentMutation,
  useGetSmsStatsQuery,
  useSendDirectMessageMutation,
  useGetInboxQuery,
  useGetMessageThreadQuery,
  useGetUnreadMessagesQuery,
  useMarkMessageReadMutation,
  type Announcement,
  type AnnouncementAudience,
  type Notification,
  type NotificationType,
  type SmsLog,
  type SmsStatus,
  type DirectMessage,
} from '../../features/Apis/Notifications.Api';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  Bell,
  Megaphone,
  MessageSquare,
  Smartphone,
  Send,
  Plus,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Pencil,
  CalendarClock,
  Search,
  CheckCheck,
  Phone,
  DollarSign,
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserX,
  Inbox,
  Mail,
  ArrowLeft,
  Save,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════ */

type Tab = 'announcements' | 'notifications' | 'sms' | 'messages';

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'sms', label: 'SMS', icon: Smartphone },
  { key: 'messages', label: 'Messages', icon: MessageSquare },
];

const AUDIENCES: AnnouncementAudience[] = ['All', 'Parents', 'Students', 'Teachers'];

const AUDIENCE_STYLE: Record<string, string> = {
  All: 'bg-primary/10 text-primary',
  Parents: 'bg-success/10 text-success',
  Students: 'bg-info/10 text-info',
  Teachers: 'bg-secondary/10 text-secondary',
};

const SMS_STYLE: Record<string, string> = {
  Queued: 'bg-warning/10 text-warning',
  Sent: 'bg-success/10 text-success',
  Failed: 'bg-error/10 text-error',
};

const inputCls =
  'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-xl text-sm placeholder:text-base-content/30 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition disabled:opacity-60 disabled:cursor-not-allowed';

const PAGE_SIZE = 20;

const isPhoneValid = (v: string) => /^\+?\d{7,15}$/.test(v.replace(/[\s-]/g, ''));
const isExpired = (d?: string | null) => !!d && new Date(d).getTime() < Date.now();

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Icon per notification type — makes the list scannable at a glance. */
function notificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case 'System': return ShieldAlert;
    case 'Announcement': return Megaphone;
    case 'Message': return MessageSquare;
    case 'Discipline': return AlertCircle;
    default: return Bell;
  }
}

/** Color tone per notification type. */
function notificationTone(type: NotificationType): string {
  switch (type) {
    case 'System': return 'bg-info/10 text-info';
    case 'Announcement': return 'bg-success/10 text-success';
    case 'Message': return 'bg-secondary/10 text-secondary';
    case 'Discipline': return 'bg-warning/10 text-warning';
    default: return 'bg-primary/10 text-primary';
  }
}

const emptyAnnouncement = () => ({
  title: '',
  message: '',
  targetAudience: 'All' as AnnouncementAudience,
  classId: '',
  sendViaSms: false,
});

type ModalState =
  | { type: 'create-announcement' }
  | { type: 'edit-announcement'; announcement: Announcement }
  | { type: 'delete-announcement'; announcement: Announcement }
  | { type: 'schedule-announcement'; announcement: Announcement }
  | { type: 'queue-announcement-sms'; announcement: Announcement }
  | { type: 'compose-sms' }
  | { type: 'sms-absentees' }
  | { type: 'sms-fees' }
  | { type: 'sms-reports' }
  | { type: 'mark-sms-sent'; log: SmsLog }
  | null;

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export const NotificationManager: React.FC<{ termId?: string }> = ({ termId }) => {
  const { user } = useSelector((state: any) => state.auth || {});
  const schoolId: string = user?.schoolId || user?.user?.schoolId || '';
  const myUserId: string = user?.id || user?.user?.id || '';

  const { data: school } = useGetSchoolByIdQuery(schoolId, { skip: !schoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your school';

  const [tab, setTab] = useState<Tab>('announcements');
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    if (type === 'success') setTimeout(() => setToast(null), 4000);
  };
  const errText = (err: any, fallback: string) => err?.data?.message || fallback;

  const { data: unreadData } = useGetMyUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30000,
  });
  const unreadCount = unreadData?.count ?? 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [modal]);

  /* ── Data queries ── */
  const [audienceFilter, setAudienceFilter] = useState<AnnouncementAudience | ''>('');
  const [annSearch, setAnnSearch] = useState('');
  const [annPage, setAnnPage] = useState(1);

  const annQuery = useListSchoolAnnouncementsQuery(
    { schoolId, audience: audienceFilter || undefined },
    { skip: !schoolId || tab !== 'announcements' }
  );

  const notifQuery = useListMyNotificationsQuery(
    { unreadOnly: false, limit: 100 },
    { skip: tab !== 'notifications' }
  );

  const [smsStatusFilter, setSmsStatusFilter] = useState<SmsStatus | ''>('');
  const smsQuery = useListSchoolSmsQuery(
    { schoolId, status: smsStatusFilter || undefined },
    { skip: !schoolId || tab !== 'sms' }
  );
  const smsStatsQuery = useGetSmsStatsQuery(schoolId, { skip: !schoolId || tab !== 'sms' });

  const inboxQuery = useGetInboxQuery(undefined, { skip: tab !== 'messages' });

  /* ── Stat cards — must be ABOVE any early return (hook order) ── */
  const stats = useMemo(() => {
    if (tab === 'announcements') {
      const list: Announcement[] = annQuery.data?.announcements ?? [];
      return [
        { label: 'Total', value: list.length, icon: Megaphone, tone: 'bg-primary/10 text-primary' },
        {
          label: 'Last 7 days',
          value: list.filter((a: Announcement) => a.createdAt && Date.now() - new Date(a.createdAt).getTime() < 7 * 864e5).length,
          icon: Clock,
          tone: 'bg-info/10 text-info',
        },
        {
          label: 'Expired',
          value: list.filter((a: Announcement) => isExpired(a.expiresAt)).length,
          icon: CalendarClock,
          tone: 'bg-warning/10 text-warning',
        },
        {
          label: 'Via SMS',
          value: list.filter((a: Announcement) => a.sendViaSms).length,
          icon: Smartphone,
          tone: 'bg-success/10 text-success',
        },
      ];
    }
    if (tab === 'notifications') {
      const list: Notification[] = notifQuery.data?.notifications ?? [];
      return [
        { label: 'Total', value: list.length, icon: Bell, tone: 'bg-primary/10 text-primary' },
        { label: 'Unread', value: unreadCount, icon: AlertCircle, tone: 'bg-warning/10 text-warning' },
        { label: 'System', value: list.filter((n: Notification) => n.type === 'System').length, icon: ShieldAlert, tone: 'bg-info/10 text-info' },
        { label: 'Announcements', value: list.filter((n: Notification) => n.type === 'Announcement').length, icon: Megaphone, tone: 'bg-success/10 text-success' },
      ];
    }
    if (tab === 'sms') {
      const s = smsStatsQuery.data?.stats;
      const byStatus = s?.byStatus ?? {};
      return [
        { label: 'Total', value: s?.total ?? 0, icon: Smartphone, tone: 'bg-primary/10 text-primary' },
        { label: 'Queued', value: byStatus.Queued ?? 0, icon: Clock, tone: 'bg-warning/10 text-warning' },
        { label: 'Sent', value: byStatus.Sent ?? 0, icon: CheckCircle2, tone: 'bg-success/10 text-success' },
        { label: 'Failed', value: byStatus.Failed ?? 0, icon: AlertCircle, tone: 'bg-error/10 text-error' },
      ];
    }
    const inbox = inboxQuery.data?.inbox ?? inboxQuery.data?.conversations ?? [];
    return [
      { label: 'Conversations', value: inbox.length, icon: MessageSquare, tone: 'bg-primary/10 text-primary' },
      { label: 'Unread', value: inbox.reduce((s: number, e: any) => s + (e.unreadCount || 0), 0), icon: AlertCircle, tone: 'bg-warning/10 text-warning' },
      { label: 'Inbox', value: inbox.length, icon: Inbox, tone: 'bg-info/10 text-info' },
      { label: 'Status', value: 'Live', icon: CheckCircle2, tone: 'bg-success/10 text-success' },
    ];
  }, [tab, annQuery.data, notifQuery.data, smsStatsQuery.data, inboxQuery.data, unreadCount]);

  /* ── Guard (after all hooks) ── */
  if (!schoolId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="p-8 bg-error/10 border border-error/20 text-error rounded-3xl">
          <AlertCircle className="w-6 h-6 mb-2" />
          <p className="font-bold">No school found in your session.</p>
          <p className="text-sm mt-1">Please log in again, or contact your Super Admin.</p>
        </div>
      </div>
    );
  }

  const refreshAll = () => {
    annQuery.refetch();
    notifQuery.refetch();
    smsQuery.refetch();
    smsStatsQuery.refetch();
    inboxQuery.refetch();
  };
  const closeModal = () => setModal(null);

  /* ── Render ── */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-base-100 text-base-content min-h-screen">
      {/* ═════════ HEADER ═════════ */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Communication</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Announcements, notifications, SMS and messages for {schoolName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-3 rounded-xl border border-base-300 hover:bg-base-200 transition"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {tab === 'announcements' && (
            <button
              onClick={() => setModal({ type: 'create-announcement' })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-content font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition"
            >
              <Plus className="w-4 h-4" /> New announcement
            </button>
          )}
          {tab === 'sms' && (
            <button
              onClick={() => setModal({ type: 'compose-sms' })}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-content font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition"
            >
              <Send className="w-4 h-4" /> Send SMS
            </button>
          )}
        </div>
      </header>

      {/* ═════════ STATS ═════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="flex items-center gap-3 p-4 rounded-2xl bg-base-200/50 border border-base-300">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black leading-none">{s.value}</p>
                <p className="text-xs text-base-content/60 mt-1 truncate">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═════════ TABS ═════════ */}
      <div className="flex flex-wrap items-center gap-1 p-1.5 bg-base-200/50 border border-base-300 rounded-2xl">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const badge = t.key === 'notifications' && unreadCount > 0 ? unreadCount : null;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                active ? 'bg-primary text-primary-content shadow-md' : 'hover:bg-base-100 text-base-content/70'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {badge !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-error/10 text-error'}`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═════════ TOAST ═════════ */}
      <div aria-live="polite">
        {toast && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-success/10 border-success/20 text-success'
                : 'bg-error/10 border-error/20 text-error'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-semibold">{toast.text}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}
      </div>

      {/* ═════════ TAB CONTENT ═════════ */}
      {tab === 'announcements' && (
        <AnnouncementsPanel
          schoolId={schoolId}
          query={annQuery}
          search={annSearch}
          onSearch={setAnnSearch}
          audience={audienceFilter}
          onAudience={setAudienceFilter}
          page={annPage}
          onPage={setAnnPage}
          onEdit={(a) => setModal({ type: 'edit-announcement', announcement: a })}
          onDelete={(a) => setModal({ type: 'delete-announcement', announcement: a })}
          onSchedule={(a) => setModal({ type: 'schedule-announcement', announcement: a })}
          onSms={(a) => setModal({ type: 'queue-announcement-sms', announcement: a })}
        />
      )}
      {tab === 'notifications' && (
        <NotificationsPanel
          query={notifQuery}
          unreadCount={unreadCount}
          notify={notify}
          errText={errText}
        />
      )}
      {tab === 'sms' && (
        <SmsPanel
          query={smsQuery}
          status={smsStatusFilter}
          onStatus={setSmsStatusFilter}
          onMarkSent={(log) => setModal({ type: 'mark-sms-sent', log })}
          onQuickAction={(kind) => setModal({ type: kind === 'absentees' ? 'sms-absentees' : kind === 'fees' ? 'sms-fees' : 'sms-reports' })}
        />
      )}
      {tab === 'messages' && <MessagesPanel myUserId={myUserId} schoolId={schoolId} notify={notify} errText={errText} />}

      {/* ═════════ MODALS ═════════ */}
      {modal?.type === 'create-announcement' && (
        <Modal title="New announcement" subtitle={`Broadcast to ${schoolName}.`} icon={Megaphone} onClose={closeModal}>
          <AnnouncementForm
            mode="create"
            schoolId={schoolId}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'edit-announcement' && (
        <Modal title="Edit announcement" subtitle={modal.announcement.title} icon={Pencil} onClose={closeModal}>
          <AnnouncementForm
            mode="edit"
            schoolId={schoolId}
            announcement={modal.announcement}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'delete-announcement' && (
        <Modal title="Delete announcement" subtitle="This cannot be undone." icon={ShieldAlert} danger onClose={closeModal}>
          <DeleteAnnouncementConfirm
            schoolId={schoolId}
            announcement={modal.announcement}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'schedule-announcement' && (
        <Modal title="Schedule expiry" subtitle={modal.announcement.title} icon={CalendarClock} onClose={closeModal}>
          <ScheduleExpiryForm
            announcement={modal.announcement}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'queue-announcement-sms' && (
        <Modal title="Send SMS for announcement" subtitle={modal.announcement.title} icon={Smartphone} onClose={closeModal}>
          <QueueAnnouncementSmsConfirm
            schoolId={schoolId}
            announcement={modal.announcement}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'compose-sms' && (
        <Modal title="Compose SMS" subtitle="Queue a single or bulk message." icon={Send} onClose={closeModal}>
          <ComposeSmsForm
            schoolId={schoolId}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'sms-absentees' && (
        <Modal title="Absentee SMS" subtitle="Notify parents of today's absentees." icon={UserX} onClose={closeModal}>
          <QuickSmsForm
            kind="absentees"
            schoolId={schoolId}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'sms-fees' && (
        <Modal title="Fee reminder SMS" subtitle="Parents with an outstanding balance." icon={DollarSign} onClose={closeModal}>
          <QuickSmsForm
            kind="fees"
            schoolId={schoolId}
            termId={termId}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'sms-reports' && (
        <Modal title="Report cards ready" subtitle="Let parents know reports are ready." icon={FileText} onClose={closeModal}>
          <QuickSmsForm
            kind="reports"
            schoolId={schoolId}
            termId={termId}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}
      {modal?.type === 'mark-sms-sent' && (
        <Modal title="Mark as sent" subtitle={modal.log.to} icon={CheckCircle2} onClose={closeModal}>
          <MarkSmsSentForm
            log={modal.log}
            onCancel={closeModal}
            onDone={(ok, msg) => { notify(ok ? 'success' : 'error', msg); if (ok) closeModal(); }}
          />
        </Modal>
      )}

      <style>{`
        @keyframes nm-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes nm-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nm-fade { animation: nm-fade 0.2s ease-out both; }
        .nm-pop  { animation: nm-pop 0.26s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .nm-fade, .nm-pop { animation: none !important; } }
      `}</style>
    </div>
  );
};

export default NotificationManager;

/* ═══════════════════════════════════════════════════════
   TAB 1 — ANNOUNCEMENTS PANEL
   ═══════════════════════════════════════════════════════ */

function AnnouncementsPanel({
  query, search, onSearch, audience, onAudience, page, onPage, onEdit, onDelete, onSchedule, onSms,
}: {
  schoolId: string;
  query: ReturnType<typeof useListSchoolAnnouncementsQuery>;
  search: string;
  onSearch: (v: string) => void;
  audience: AnnouncementAudience | '';
  onAudience: (v: AnnouncementAudience | '') => void;
  page: number;
  onPage: (v: number) => void;
  onEdit: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
  onSchedule: (a: Announcement) => void;
  onSms: (a: Announcement) => void;
}) {
  const list: Announcement[] = useMemo(
    () => query.data?.announcements ?? [],
    [query.data?.announcements]
  );

  const filtered: Announcement[] = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a: Announcement) => a.title.toLowerCase().includes(q) || a.message.toLowerCase().includes(q)
    );
  }, [list, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged: Announcement[] = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section className="bg-base-200/50 border border-base-300 rounded-3xl overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-3 lg:items-center border-b border-base-300">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => { onSearch(e.target.value); onPage(1); }}
            placeholder="Search announcements…"
            className={`${inputCls} pl-10 py-2.5`}
          />
        </div>
        <select
          value={audience}
          onChange={(e) => { onAudience(e.target.value as AnnouncementAudience | ''); onPage(1); }}
          className={`${inputCls} py-2.5 lg:w-48`}
          aria-label="Filter by audience"
        >
          <option value="">All audiences</option>
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {query.isLoading ? (
        <div className="py-16 text-center"><span className="loading loading-spinner text-primary" /></div>
      ) : query.isError ? (
        <div className="p-8 text-center text-error">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
          <p className="font-semibold">Could not load announcements.</p>
        </div>
      ) : paged.length === 0 ? (
        <div className="py-16 text-center text-base-content/50">
          <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No announcements yet</p>
          <p className="text-xs mt-1">Post your first announcement to keep the school informed.</p>
        </div>
      ) : (
        <div className="bg-base-100 divide-y divide-base-300">
          {paged.map((a: Announcement) => {
            const expired = isExpired(a.expiresAt);
            return (
              <article key={a.id} className={`p-5 ${expired ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-base">{a.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${AUDIENCE_STYLE[a.targetAudience] || 'bg-base-300'}`}>
                        {a.targetAudience}
                      </span>
                      {a.classId && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-base-300 text-base-content/70">
                          class-specific
                        </span>
                      )}
                      {expired && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-error/10 text-error inline-flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> expired
                        </span>
                      )}
                      {a.sendViaSms && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-info/10 text-info inline-flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" /> SMS
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-base-content/80 whitespace-pre-line line-clamp-3">{a.message}</p>
                    <p className="text-xs text-base-content/50 mt-2">
                      Posted {timeAgo(a.createdAt)}
                      {a.expiresAt && <> · Expires {fmtDate(a.expiresAt)}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconBtn label="Edit" onClick={() => onEdit(a)}><Pencil className="w-4 h-4" /></IconBtn>
                    <IconBtn label="Schedule expiry" onClick={() => onSchedule(a)}><CalendarClock className="w-4 h-4" /></IconBtn>
                    <IconBtn label="Queue SMS" onClick={() => onSms(a)}><Phone className="w-4 h-4" /></IconBtn>
                    <IconBtn label="Delete" danger onClick={() => onDelete(a)}><Trash2 className="w-4 h-4" /></IconBtn>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {paged.length > 0 && (
        <div className="px-5 py-3 flex items-center justify-between text-xs text-base-content/60 border-t border-base-300">
          <span>{filtered.length} {filtered.length === 1 ? 'announcement' : 'announcements'}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-base-300 hover:bg-base-200 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">Page {page} of {totalPages}</span>
            <button
              onClick={() => onPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-base-300 hover:bg-base-200 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 2 — NOTIFICATIONS PANEL (enhanced)
   ═══════════════════════════════════════════════════════ */

type NotifFilter = 'all' | 'unread' | 'System' | 'Announcement' | 'Message' | 'Discipline';

function NotificationsPanel({
  query, unreadCount, notify, errText,
}: {
  query: ReturnType<typeof useListMyNotificationsQuery>;
  unreadCount: number;
  notify: (t: 'success' | 'error', msg: string) => void;
  errText: (e: any, fb: string) => string;
}) {
  const [filter, setFilter] = useState<NotifFilter>('all');
  const [markAllRead, markState] = useMarkAllNotificationsReadMutation();

  const list: Notification[] = useMemo(
    () => query.data?.notifications ?? [],
    [query.data?.notifications]
  );

  const typeCounts = useMemo(() => ({
    System: list.filter((n: Notification) => n.type === 'System').length,
    Announcement: list.filter((n: Notification) => n.type === 'Announcement').length,
    Message: list.filter((n: Notification) => n.type === 'Message').length,
    Discipline: list.filter((n: Notification) => n.type === 'Discipline').length,
  }), [list]);

  const visible: Notification[] = useMemo(() => {
    if (filter === 'all') return list;
    if (filter === 'unread') return list.filter((n: Notification) => !n.isRead);
    return list.filter((n: Notification) => n.type === filter);
  }, [list, filter]);

  const handleMarkAll = async () => {
    try {
      await markAllRead({}).unwrap();
      notify('success', 'All notifications marked as read.');
    } catch (err) {
      notify('error', errText(err, 'Could not mark all as read.'));
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      await markAllRead({ onlyIds: [id] }).unwrap();
      notify('success', 'Notification marked as read.');
    } catch (err) {
      notify('error', errText(err, 'Could not mark notification as read.'));
    }
  };

  const filters: { key: NotifFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: list.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    ...(typeCounts.System > 0 ? [{ key: 'System' as const, label: 'System', count: typeCounts.System }] : []),
    ...(typeCounts.Announcement > 0 ? [{ key: 'Announcement' as const, label: 'Announcements', count: typeCounts.Announcement }] : []),
    ...(typeCounts.Message > 0 ? [{ key: 'Message' as const, label: 'Messages', count: typeCounts.Message }] : []),
    ...(typeCounts.Discipline > 0 ? [{ key: 'Discipline' as const, label: 'Discipline', count: typeCounts.Discipline }] : []),
  ];

  return (
    <section className="bg-base-200/50 border border-base-300 rounded-3xl overflow-hidden">
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-3 lg:items-center border-b border-base-300">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-base-100 rounded-xl border border-base-300">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                filter === f.key ? 'bg-primary text-primary-content shadow' : 'hover:bg-base-200 opacity-80'
              }`}
            >
              {f.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-base-300'}`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={handleMarkAll}
          disabled={markState.isLoading || unreadCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-content font-bold text-sm shadow-md disabled:opacity-40 transition"
        >
          {markState.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
          Mark all as read
        </button>
      </div>

      {query.isLoading ? (
        <div className="py-16 text-center"><span className="loading loading-spinner text-primary" /></div>
      ) : query.isError ? (
        <div className="p-8 text-center text-error">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
          <p className="font-semibold">Could not load notifications.</p>
          <p className="text-xs mt-1 opacity-70">Try refreshing the page.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center text-base-content/50">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">
            {filter === 'unread'
              ? "You're all caught up"
              : filter === 'all'
                ? 'No notifications yet'
                : `No ${filter.toLowerCase()} notifications`}
          </p>
          <p className="text-xs mt-1">
            {filter === 'unread'
              ? 'All notifications have been read.'
              : 'When new items arrive, they will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-base-100 divide-y divide-base-300">
          {visible.map((n: Notification) => {
            const Icon = notificationIcon(n.type);
            const tone = notificationTone(n.type);
            return (
              <article key={n.id} className={`p-5 flex items-start gap-4 transition ${!n.isRead ? 'bg-primary/[0.04]' : ''}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'}`}>{n.title}</h4>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-base-200 text-base-content/70">
                      {n.type}
                    </span>
                    {!n.isRead && (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-primary/15 text-primary">
                        new
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-base-content/80 mt-1 whitespace-pre-line">{n.body}</p>
                  <p className="text-xs text-base-content/50 mt-2">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-base-200 hover:bg-base-300 transition"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 3 — SMS PANEL
   ═══════════════════════════════════════════════════════ */

function SmsPanel({
  query, status, onStatus, onMarkSent, onQuickAction,
}: {
  query: ReturnType<typeof useListSchoolSmsQuery>;
  status: SmsStatus | '';
  onStatus: (v: SmsStatus | '') => void;
  onMarkSent: (log: SmsLog) => void;
  onQuickAction: (kind: 'absentees' | 'fees' | 'reports') => void;
}) {
  const logs: SmsLog[] = useMemo(
    () => query.data?.logs ?? query.data?.smsLogs ?? [],
    [query.data?.logs, query.data?.smsLogs]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <QuickActionCard
          icon={UserX}
          title="Absentee alerts"
          desc="Notify parents of today's absentees."
          onClick={() => onQuickAction('absentees')}
          tone="bg-warning/10 text-warning"
        />
        <QuickActionCard
          icon={DollarSign}
          title="Fee reminders"
          desc="Parents with an outstanding balance."
          onClick={() => onQuickAction('fees')}
          tone="bg-success/10 text-success"
        />
        <QuickActionCard
          icon={FileText}
          title="Report cards ready"
          desc="Let parents know reports are ready."
          onClick={() => onQuickAction('reports')}
          tone="bg-info/10 text-info"
        />
      </div>

      <section className="bg-base-200/50 border border-base-300 rounded-3xl overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center border-b border-base-300">
          <h3 className="text-base font-bold flex-1">SMS logs</h3>
          <select
            value={status}
            onChange={(e) => onStatus(e.target.value as SmsStatus | '')}
            className={`${inputCls} py-2.5 sm:w-48`}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="Queued">Queued</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="overflow-x-auto bg-base-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-base-content/50 border-b border-base-300">
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Message</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Queued</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {query.isLoading ? (
                <tr><td colSpan={5} className="py-16 text-center"><span className="loading loading-spinner text-primary" /></td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-base-content/50">
                    <Smartphone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No SMS yet</p>
                    <p className="text-xs mt-1">Queued messages will appear here.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log: SmsLog) => (
                  <tr key={log.id} className="hover:bg-base-200/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{log.to}</td>
                    <td className="px-4 py-3 text-sm text-base-content/80 max-w-md truncate">{log.message}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${SMS_STYLE[log.status] || 'bg-base-300'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-base-content/60 whitespace-nowrap">{timeAgo(log.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {log.status === 'Queued' && (
                          <button
                            onClick={() => onMarkSent(log)}
                            className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-xs font-bold hover:bg-success hover:text-success-content transition"
                          >
                            Mark sent
                          </button>
                        )}
                        {log.status === 'Sent' && log.providerMessageId && (
                          <span className="text-xs text-base-content/50 font-mono truncate max-w-[140px]">{log.providerMessageId}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function QuickActionCard({
  icon: Icon, title, desc, onClick, tone,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  tone: string;
}) {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-2xl bg-base-200/50 border border-base-300 hover:border-primary/40 hover:shadow-sm transition text-left"
    >
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold">{title}</p>
          <p className="text-xs text-base-content/60">{desc}</p>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   TAB 4 — MESSAGES PANEL
   ═══════════════════════════════════════════════════════ */

function MessagesPanel({
  myUserId, schoolId, notify, errText,
}: {
  myUserId: string;
  schoolId: string;
  notify: (t: 'success' | 'error', msg: string) => void;
  errText: (e: any, fb: string) => string;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const inboxQuery = useGetInboxQuery();
  const unreadQuery = useGetUnreadMessagesQuery();
  const threadQuery = useGetMessageThreadQuery({ withUserId: selectedUserId ?? '' }, { skip: !selectedUserId });
  const [sendMessage, sendState] = useSendDirectMessageMutation();
  const [markRead] = useMarkMessageReadMutation();

  const inbox = inboxQuery.data?.inbox ?? inboxQuery.data?.conversations ?? [];
  const unread = unreadQuery.data?.messages ?? [];
  const thread: DirectMessage[] = useMemo(
    () => threadQuery.data?.messages ?? threadQuery.data?.thread ?? [],
    [threadQuery.data?.messages, threadQuery.data?.thread]
  );

  useEffect(() => {
    if (!selectedUserId) return;
    thread.forEach((msg: DirectMessage) => {
      if (!msg.isRead && msg.receiverId === myUserId && msg.senderId === selectedUserId) {
        markRead(msg.id);
      }
    });
  }, [thread, selectedUserId, myUserId, markRead]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !draft.trim()) return;
    try {
      await sendMessage({ schoolId, receiverId: selectedUserId, messageText: draft.trim() }).unwrap();
      setDraft('');
    } catch (err) {
      notify('error', errText(err, 'Could not send message.'));
    }
  };

  return (
    <section className="bg-base-200/50 border border-base-300 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
      <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-base-300 bg-base-100">
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <h3 className="text-sm font-bold flex items-center gap-1.5"><Inbox className="w-4 h-4" /> Inbox</h3>
          {unread.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-error/10 text-error text-[10px] font-bold">
              {unread.length} unread
            </span>
          )}
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {inboxQuery.isLoading ? (
            <div className="py-16 text-center"><span className="loading loading-spinner text-primary" /></div>
          ) : inbox.length === 0 ? (
            <div className="py-16 text-center text-base-content/50">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold">No conversations</p>
              <p className="text-xs mt-1">Messages will show here.</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {inbox.map((entry: any, i: number) => {
                const otherId = entry.withUser?.id ?? entry.lastMessage?.senderId ?? `unknown-${i}`;
                const otherName = entry.withUser?.name || entry.withUser?.email || entry.lastMessage?.senderId?.slice(0, 8) || 'Unknown';
                const last = entry.lastMessage?.messageText ?? '';
                const active = selectedUserId === otherId;
                return (
                  <button
                    key={otherId}
                    onClick={() => setSelectedUserId(otherId)}
                    className={`w-full text-left p-3 rounded-xl transition ${active ? 'bg-primary/10 border border-primary/30' : 'hover:bg-base-200/60 border border-transparent'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                        {otherName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold truncate">{otherName}</span>
                          {entry.unreadCount && entry.unreadCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-error text-error-content text-[10px] font-bold">
                              {entry.unreadCount}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-base-content/60 truncate">{last}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      <div className="md:col-span-8 flex flex-col bg-base-100 min-h-[560px]">
        {!selectedUserId ? (
          <div className="flex-1 grid place-items-center p-6 text-center text-base-content/50">
            <div>
              <Mail className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="text-sm font-semibold">Pick a conversation</p>
              <p className="text-xs mt-1">Select a chat from the inbox to start messaging.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-base-300 flex items-center gap-2">
              <button onClick={() => setSelectedUserId(null)} className="md:hidden p-1.5 rounded-lg hover:bg-base-200" aria-label="Back">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <ShieldAlert className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold truncate">
                {inbox.find((e: any) => e.withUser?.id === selectedUserId)?.withUser?.name || 'Conversation'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {threadQuery.isLoading ? (
                <div className="py-16 text-center"><span className="loading loading-spinner text-primary" /></div>
              ) : thread.length === 0 ? (
                <p className="text-center text-sm text-base-content/50 py-8">No messages yet. Say hello 👋</p>
              ) : (
                thread.map((msg: DirectMessage) => {
                  const mine = msg.senderId === myUserId;
                  return (
                    <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                          mine ? 'bg-primary text-primary-content' : 'bg-base-200'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.messageText}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                          {timeAgo(msg.createdAt)} {mine && msg.isRead ? ' · read' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-base-300 flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={1}
                placeholder="Write a message…"
                className={`${inputCls} resize-none max-h-32`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e as any);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sendState.isLoading || !draft.trim()}
                className="p-3 rounded-xl bg-primary text-primary-content disabled:opacity-40 shrink-0"
                aria-label="Send"
              >
                {sendState.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MODAL FORMS
   ═══════════════════════════════════════════════════════ */

function AnnouncementForm({
  mode, schoolId, announcement, onCancel, onDone,
}: {
  mode: 'create' | 'edit';
  schoolId: string;
  announcement?: Announcement;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [f, setF] = useState(() =>
    announcement
      ? {
          title: announcement.title,
          message: announcement.message,
          targetAudience: announcement.targetAudience,
          classId: announcement.classId ?? '',
          sendViaSms: !!announcement.sendViaSms,
        }
      : emptyAnnouncement()
  );

  const [create, createState] = useCreateAnnouncementMutation();
  const [update, updateState] = useUpdateAnnouncementMutation();
  const loading = createState.isLoading || updateState.isLoading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.title.trim().length < 2) return onDone(false, 'Title must be at least 2 characters.');
    if (!f.message.trim()) return onDone(false, 'Message cannot be empty.');
    if (f.targetAudience !== 'Parents' && f.classId) {
      return onDone(false, 'Class targeting only works when audience is Parents.');
    }
    try {
      if (mode === 'edit' && announcement) {
        await update({
          announcementId: announcement.id,
          patch: {
            title: f.title.trim(),
            message: f.message.trim(),
            targetAudience: f.targetAudience,
            sendViaSms: f.sendViaSms,
          },
        }).unwrap();
        onDone(true, 'Announcement updated.');
      } else {
        await create({
          schoolId,
          title: f.title.trim(),
          message: f.message.trim(),
          targetAudience: f.targetAudience,
          classId: f.targetAudience === 'Parents' && f.classId ? f.classId : undefined,
          sendViaSms: f.sendViaSms,
        }).unwrap();
        onDone(true, 'Announcement posted.');
      }
    } catch (err: any) {
      onDone(false, err?.data?.message || 'Could not save announcement.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Title *">
        <input
          data-autofocus
          type="text"
          required
          minLength={2}
          value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })}
          placeholder="e.g. Term 1 closing ceremony"
          className={inputCls}
        />
      </Field>
      <Field label="Message *">
        <textarea
          required
          rows={3}
          value={f.message}
          onChange={(e) => setF({ ...f, message: e.target.value })}
          placeholder="What's the announcement?"
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Audience">
          <select
            value={f.targetAudience}
            onChange={(e) => setF({ ...f, targetAudience: e.target.value as AnnouncementAudience })}
            className={inputCls}
          >
            {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        {f.targetAudience === 'Parents' && (
          <Field label="Class (optional)">
            <input
              type="text"
              value={f.classId}
              onChange={(e) => setF({ ...f, classId: e.target.value })}
              placeholder="Leave blank for all parents"
              className={`${inputCls} font-mono text-xs`}
            />
          </Field>
        )}
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={f.sendViaSms}
          onChange={(e) => setF({ ...f, sendViaSms: e.target.checked })}
          className="checkbox checkbox-sm checkbox-primary"
        />
        Also send via SMS
      </label>
      <ModalFooter onCancel={onCancel} loading={loading} label={mode === 'edit' ? 'Save changes' : 'Post announcement'} />
    </form>
  );
}

function DeleteAnnouncementConfirm({
  announcement, onCancel, onDone,
}: {
  schoolId: string;
  announcement: Announcement;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [deleteAnn, state] = useDeleteAnnouncementMutation();
  return (
    <>
      <p className="text-sm">
        You are about to delete <strong>{announcement.title}</strong>. Everyone who received it will lose access to it.
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 mt-5 border-t border-base-300">
        <button onClick={onCancel} disabled={state.isLoading} className="px-6 py-3 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-sm transition disabled:opacity-50">
          Keep announcement
        </button>
        <button
          onClick={async () => {
            try { await deleteAnn(announcement.id).unwrap(); onDone(true, 'Announcement deleted.'); }
            catch (err: any) { onDone(false, err?.data?.message || 'Could not delete.'); }
          }}
          disabled={state.isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-error text-error-content font-bold text-sm shadow-md disabled:opacity-60 transition"
        >
          {state.isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : <><Trash2 className="w-4 h-4" /> Delete announcement</>}
        </button>
      </div>
    </>
  );
}

function ScheduleExpiryForm({
  announcement, onCancel, onDone,
}: {
  announcement: Announcement;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [date, setDate] = useState(
    announcement.expiresAt ? announcement.expiresAt.slice(0, 10) : new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  );
  const [schedule, state] = useScheduleAnnouncementExpiryMutation();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await schedule({ announcementId: announcement.id, expiresAt: new Date(`${date}T23:59:59Z`).toISOString() }).unwrap();
          onDone(true, 'Expiry scheduled.');
        } catch (err: any) {
          onDone(false, err?.data?.message || 'Could not schedule.');
        }
      }}
      className="space-y-4"
    >
      <p className="text-sm text-base-content/70">After this date the announcement will be hidden from "mine" lists.</p>
      <Field label="Expiry date">
        <input data-autofocus type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
      </Field>
      <ModalFooter onCancel={onCancel} loading={state.isLoading} label="Schedule expiry" />
    </form>
  );
}

function QueueAnnouncementSmsConfirm({
  schoolId, announcement, onCancel, onDone,
}: {
  schoolId: string;
  announcement: Announcement;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [queue, state] = useQueueAnnouncementSmsMutation();
  return (
    <>
      <p className="text-sm">
        Queue SMS to everyone targeted by <strong>{announcement.title}</strong> (audience: <b>{announcement.targetAudience}</b>)?
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 mt-5 border-t border-base-300">
        <button onClick={onCancel} disabled={state.isLoading} className="px-6 py-3 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-sm transition disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={async () => {
            try { await queue({ schoolId, announcementId: announcement.id }).unwrap(); onDone(true, 'SMS queued.'); }
            catch (err: any) { onDone(false, err?.data?.message || 'Could not queue SMS.'); }
          }}
          disabled={state.isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-content font-bold text-sm shadow-md disabled:opacity-60 transition"
        >
          {state.isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Queuing…</> : <><Send className="w-4 h-4" /> Queue SMS</>}
        </button>
      </div>
    </>
  );
}

function ComposeSmsForm({
  schoolId, onCancel, onDone,
}: {
  schoolId: string;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [bulkPhones, setBulkPhones] = useState('');
  const [bulkBody, setBulkBody] = useState('');

  const [queueOne, oneState] = useQueueSmsMutation();
  const [queueBulk, bulkState] = useBulkQueueSmsMutation();
  const loading = oneState.isLoading || bulkState.isLoading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'single') {
      if (!isPhoneValid(to)) return onDone(false, 'Enter a valid phone number, e.g. +254712345678.');
      if (!body.trim()) return onDone(false, 'Message cannot be empty.');
      try {
        await queueOne({ schoolId, to: to.trim(), message: body.trim() }).unwrap();
        onDone(true, 'SMS queued.');
      } catch (err: any) {
        onDone(false, err?.data?.message || 'Could not queue SMS.');
      }
    } else {
      const lines = bulkPhones.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
      if (lines.length === 0) return onDone(false, 'Add at least one phone number.');
      const invalid = lines.find((p) => !isPhoneValid(p));
      if (invalid) return onDone(false, `Invalid phone number: ${invalid}`);
      if (!bulkBody.trim()) return onDone(false, 'Message cannot be empty.');
      try {
        await queueBulk({
          schoolId,
          recipients: lines.map((phone) => ({ to: phone, message: bulkBody.trim() })),
        }).unwrap();
        onDone(true, `Queued ${lines.length} SMS.`);
      } catch (err: any) {
        onDone(false, err?.data?.message || 'Could not queue bulk SMS.');
      }
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-1 p-1 bg-base-200 rounded-xl border border-base-300 w-fit">
        <button
          type="button"
          onClick={() => setMode('single')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'single' ? 'bg-primary text-primary-content shadow' : 'opacity-70'}`}
        >
          Single
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${mode === 'bulk' ? 'bg-primary text-primary-content shadow' : 'opacity-70'}`}
        >
          Bulk
        </button>
      </div>

      {mode === 'single' ? (
        <>
          <Field label="Phone number *">
            <input data-autofocus type="tel" required value={to} onChange={(e) => setTo(e.target.value)} placeholder="+254712345678" className={inputCls} />
          </Field>
          <Field label="Message *">
            <textarea required rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message text…" className={inputCls} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Phone numbers (one per line) *">
            <textarea
              data-autofocus
              required
              rows={3}
              value={bulkPhones}
              onChange={(e) => setBulkPhones(e.target.value)}
              placeholder="+254712345678&#10;+254798765432"
              className={`${inputCls} font-mono text-xs`}
            />
          </Field>
          <Field label="Shared message text *">
            <textarea required rows={3} value={bulkBody} onChange={(e) => setBulkBody(e.target.value)} placeholder="Fee balance reminder" className={inputCls} />
          </Field>
        </>
      )}

      <ModalFooter onCancel={onCancel} loading={loading} label={mode === 'single' ? 'Queue SMS' : 'Queue bulk SMS'} />
    </form>
  );
}

function QuickSmsForm({
  kind, schoolId, termId, onCancel, onDone,
}: {
  kind: 'absentees' | 'fees' | 'reports';
  schoolId: string;
  termId?: string;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [minBalance, setMinBalance] = useState(1000);
  const [absentees, absState] = useQueueAbsenteesSmsMutation();
  const [fees, feeState] = useQueueFeeRemindersSmsMutation();
  const [reports, repState] = useQueueReportCardsSmsMutation();

  const loading = absState.isLoading || feeState.isLoading || repState.isLoading;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (kind === 'absentees') {
        await absentees({ schoolId, date }).unwrap();
        onDone(true, 'Absentee SMS queued.');
      } else if (kind === 'fees') {
        if (!termId) return onDone(false, 'Set a current term first.');
        await fees({ schoolId, termId, minBalance }).unwrap();
        onDone(true, 'Fee reminder SMS queued.');
      } else {
        if (!termId) return onDone(false, 'Set a current term first.');
        await reports({ schoolId, termId }).unwrap();
        onDone(true, 'Report-card SMS queued.');
      }
    } catch (err: any) {
      onDone(false, err?.data?.message || 'Could not queue SMS.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {kind === 'absentees' && (
        <>
          <p className="text-sm text-base-content/70">Parents of every student marked absent on this date will receive an SMS.</p>
          <Field label="Date">
            <input data-autofocus type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
        </>
      )}
      {kind === 'fees' && (
        <>
          <p className="text-sm text-base-content/70">Parents whose balance is above the minimum will receive a reminder.</p>
          <Field label="Minimum balance (KES)">
            <input data-autofocus type="number" min={0} value={minBalance} onChange={(e) => setMinBalance(Number(e.target.value) || 0)} className={inputCls} />
          </Field>
        </>
      )}
      {kind === 'reports' && (
        <p className="text-sm text-base-content/70">Parents of every student in the current term will be told their child's report is ready.</p>
      )}
      <ModalFooter onCancel={onCancel} loading={loading} label="Queue SMS" />
    </form>
  );
}

function MarkSmsSentForm({
  log, onCancel, onDone,
}: {
  log: SmsLog;
  onCancel: () => void;
  onDone: (ok: boolean, msg: string) => void;
}) {
  const [providerRef, setProviderRef] = useState('');
  const [markSent, state] = useMarkSmsSentMutation();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await markSent({ ids: [log.id], providerMessageId: providerRef || undefined }).unwrap();
          onDone(true, 'Marked as sent.');
        } catch (err: any) {
          onDone(false, err?.data?.message || 'Could not mark as sent.');
        }
      }}
      className="space-y-4"
    >
      <div className="p-3 rounded-xl bg-base-200/60 border border-base-300 text-xs">
        <p className="font-mono font-bold">{log.to}</p>
        <p className="mt-1 text-base-content/70 line-clamp-2">{log.message}</p>
      </div>
      <Field label="Provider message ID (optional)">
        <input
          data-autofocus
          type="text"
          value={providerRef}
          onChange={(e) => setProviderRef(e.target.value)}
          placeholder="e.g. AT-EXT-REF-2026-0001"
          className={`${inputCls} font-mono`}
        />
      </Field>
      <ModalFooter onCancel={onCancel} loading={state.isLoading} label="Mark as sent" />
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED UI
   ═══════════════════════════════════════════════════════ */

function IconBtn({
  children, label, onClick, danger, disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg transition disabled:opacity-40 ${
        danger ? 'text-error hover:bg-error hover:text-error-content' : 'text-base-content/60 hover:bg-base-300'
      }`}
    >
      {children}
    </button>
  );
}

function Modal({
  title, subtitle, icon: Icon, danger, onClose, children,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  danger?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/50 nm-fade"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden bg-base-100 text-base-content rounded-t-3xl sm:rounded-3xl border border-base-300 shadow-2xl nm-pop"
      >
        <div className="flex items-start gap-3 p-5 sm:p-6 border-b border-base-300 shrink-0">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${danger ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-black">{title}</h3>
            {subtitle && <p className="text-sm text-base-content/60 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-base-200 transition shrink-0" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ModalFooter({ onCancel, loading, label }: { onCancel: () => void; loading: boolean; label: string }) {
  return (
    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 mt-2 border-t border-base-300">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-6 py-3 rounded-xl border border-base-300 hover:bg-base-200 transition font-bold text-sm disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-primary text-primary-content font-bold py-3 px-6 rounded-xl shadow-md disabled:opacity-60 transition active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> {label}</>}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-base-content/60 mb-1.5">{label}</span>
      {children}
    </label>
  );
}