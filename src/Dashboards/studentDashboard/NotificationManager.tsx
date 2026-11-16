import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell, BellOff, Megaphone, MessageSquare, Send, CheckCheck, Check,
  School, Hash, GraduationCap, AlertCircle, Loader2, Sparkles, Clock,
  CalendarDays, Inbox, ChevronRight, ArrowLeft, User as UserIcon,
  Info, Filter, Circle, Search, RefreshCw, Plus, X, Users, Rocket,
  Lock,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
} from "../../features/Apis/students.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";
import { useGetSchoolUsersQuery } from "../../features/Apis/Users.Api";
import {
  useGetMyActiveAnnouncementsQuery,
  useGetClassAnnouncementsQuery,
  useListMyNotificationsQuery,
  useGetMyUnreadNotificationCountQuery,
  useMarkAllNotificationsReadMutation,
  useGetInboxQuery,
  useGetMessageThreadQuery,
  useSendDirectMessageMutation,
  useMarkMessageReadMutation,
} from "../../features/Apis/Notifications.Api";
import type {
  Announcement,
  Notification,
  InboxEntry,
  DirectMessage,
} from "../../features/Apis/Notifications.Api";

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const AUDIENCE_TONES: Record<string, { chip: string; dot: string }> = {
  All: { chip: "bg-primary/10 text-primary border-primary/20", dot: "bg-primary" },
  Students: { chip: "bg-success/10 text-success border-success/20", dot: "bg-success" },
  Parents: { chip: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  Teachers: { chip: "bg-warning/10 text-warning border-warning/20", dot: "bg-warning" },
};

const NOTIF_TONES: Record<string, { chip: string; icon: any }> = {
  System: { chip: "bg-base-300 text-base-content/70", icon: Info },
  Announcement: { chip: "bg-primary/10 text-primary", icon: Megaphone },
  Message: { chip: "bg-info/10 text-info", icon: MessageSquare },
  Discipline: { chip: "bg-warning/10 text-warning", icon: AlertCircle },
};

/** Global flag — flip to true once DM is enabled. */
const DIRECT_MESSAGING_ENABLED = false;

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const fmtDateTime = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return d;
  }
};

const fmtRelative = (d?: string | null) => {
  if (!d) return "";
  try {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return fmtDate(d);
  } catch {
    return d;
  }
};

const errMsg = (err: any, fallback: string) =>
  err?.status === 401
    ? "Your session has expired. Please sign in again."
    : err?.data?.message || err?.message || fallback;

function flattenProfile(data: any): Record<string, any> {
  const root = data?.user ?? data?.profile ?? data?.data ?? data ?? {};
  const nested = root?.student ?? root?.studentProfile ?? {};
  return { ...nested, ...root };
}

const unwrap = <T,>(v: any): T | null =>
  (v?.student ?? v?.enrollment ?? v?.data ?? v ?? null) as T | null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v?: string | null) => !!v && UUID_RE.test(v.trim());

const extractUsers = (v: any): any[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  for (const k of ["data", "users", "students", "records"]) {
    if (Array.isArray(v[k])) return v[k];
  }
  return [];
};

const extractAnnouncements = (v: any): Announcement[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["announcements", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractNotifications = (v: any): Notification[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["notifications", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractInbox = (v: any): InboxEntry[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["inbox", "conversations", "data"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractThread = (v: any): DirectMessage[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["messages", "thread", "data"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const initialOf = (name?: string | null) =>
  (name ?? "?").trim().slice(0, 1).toUpperCase() || "?";

const userDisplayName = (u: any): string =>
  u?.name ||
  u?.fullName ||
  [u?.firstName, u?.lastName].filter(Boolean).join(" ") ||
  u?.email ||
  "User";

const roleLabel = (u: any): string => {
  const r = (u?.role ?? "").toString().replace(/_/g, " ");
  return r ? r.charAt(0).toUpperCase() + r.slice(1) : "";
};

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function AudienceChip({ audience }: { audience: string }) {
  const t = AUDIENCE_TONES[audience] ?? AUDIENCE_TONES.All;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${t.chip}`}
    >
      {audience}
    </span>
  );
}

function AnnouncementCard({
  announcement,
  primaryColor,
}: {
  announcement: Announcement;
  primaryColor: string;
}) {
  const expired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl hover:border-primary/40 transition">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black">{announcement.title}</h3>
            <AudienceChip audience={announcement.targetAudience} />
            {announcement.sendViaSms && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-info/10 text-info">
                SMS
              </span>
            )}
            {expired && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-base-300 text-base-content/60">
                Expired
              </span>
            )}
          </div>
          <p className="text-xs opacity-75 mt-1.5 whitespace-pre-wrap">
            {announcement.message}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[10px] font-mono opacity-55">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {fmtDateTime(announcement.createdAt)}
            </span>
            {announcement.expiresAt && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> Expires{" "}
                {fmtDate(announcement.expiresAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  primaryColor,
}: {
  notification: Notification;
  primaryColor: string;
}) {
  const tone = NOTIF_TONES[notification.type] ?? NOTIF_TONES.System;
  const Icon = tone.icon;
  const unread = !notification.isRead;

  return (
    <div
      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition ${
        unread
          ? "bg-primary/5 border-primary/30"
          : "bg-base-100 border-base-300 opacity-80"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${tone.chip}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-black">{notification.title}</p>
          <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${tone.chip}`}>
            {notification.type}
          </span>
          {unread && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </div>
        <p className="text-xs opacity-75 mt-1">{notification.body}</p>
        <p className="text-[10px] font-mono opacity-50 mt-1.5">
          {fmtRelative(notification.createdAt)}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMING-SOON PLACEHOLDER (Direct Messages)
   ═══════════════════════════════════════════════════════════════ */
function DirectMessagesComingSoon({ primaryColor }: { primaryColor: string }) {
  const features = [
    { icon: MessageSquare, label: "Private conversations", desc: "Message your class teacher and staff directly." },
    { icon: Users, label: "Group threads", desc: "Coordinate with your project and club teammates." },
    { icon: Bell, label: "Instant notifications", desc: "Get notified the moment a new message arrives." },
  ];

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl border border-base-300">
        <div
          className="p-8 sm:p-10 text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 55%, ${primaryColor}88 100%)`,
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur grid place-items-center shrink-0">
              <Rocket className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-white/25 backdrop-blur">
                <Lock className="w-3 h-3" /> Coming Soon
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-2 leading-tight">
                Direct Messages are on the way
              </h2>
              <p className="text-sm opacity-90 mt-2 max-w-xl">
                We're building a safe, private messaging experience for students,
                teachers, and staff. It will be available in an upcoming update.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature preview grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {features.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="p-4 rounded-2xl bg-base-100 border border-base-300"
          >
            <div
              className="w-9 h-9 rounded-xl grid place-items-center mb-2"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xs font-black">{label}</p>
            <p className="text-[11px] opacity-65 mt-1 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-info/5 border border-info/20 text-[11px]">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-info" />
        <span className="opacity-80">
          In the meantime, use <strong>Announcements</strong> to stay updated and
          contact the school office for any urgent matter. You'll see a{" "}
          <strong>New</strong> button here as soon as messaging is live.
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NEW CONVERSATION MODAL (createPortal)
   Kept for future use — not rendered while DIRECT_MESSAGING_ENABLED = false
   ═══════════════════════════════════════════════════════════════ */
function NewConversationModal({
  schoolId,
  currentUserId,
  classTeacherUserId,
  classTeacherName,
  primaryColor,
  onClose,
  onStart,
}: {
  schoolId: string;
  currentUserId?: string;
  classTeacherUserId?: string;
  classTeacherName?: string;
  primaryColor: string;
  onClose: () => void;
  onStart: (userId: string, userName?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [localError, setLocalError] = useState("");

  const {
    data: staffData,
    isLoading: loadingStaff,
    isError: staffError,
    error: staffErr,
  } = useGetSchoolUsersQuery(
    {
      schoolId,
      params: {
        includeStudents: false,
        isActive: true,
        limit: 200,
      },
    },
    { skip: !schoolId }
  );

  const staff = useMemo(() => {
    const list = extractUsers(staffData);
    return list.filter((u) => u?.id && u.id !== currentUserId);
  }, [staffData, currentUserId]);

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((u) => {
      const name = userDisplayName(u).toLowerCase();
      const role = roleLabel(u).toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(q) || role.includes(q) || email.includes(q);
    });
  }, [staff, search]);

  const classTeacher = useMemo(
    () => (classTeacherUserId ? staff.find((u) => u.id === classTeacherUserId) : undefined),
    [staff, classTeacherUserId]
  );

  const otherStaff = useMemo(
    () => filteredStaff.filter((u) => u.id !== classTeacher?.id),
    [filteredStaff, classTeacher]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pick = (u: any) => {
    if (!u?.id) return;
    if (u.id === currentUserId) return setLocalError("You can't message yourself.");
    onStart(u.id, userDisplayName(u));
    onClose();
  };

  const startManual = () => {
    setLocalError("");
    const id = manualId.trim();
    if (!isUuid(id)) return setLocalError("Enter a valid user UUID.");
    if (id === currentUserId) return setLocalError("You can't message yourself.");
    onStart(id, manualName.trim() || undefined);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="New conversation"
    >
      <div
        className="w-full max-w-lg bg-base-100 rounded-3xl border border-base-300 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between sticky -top-6 -mx-6 px-6 pt-6 pb-3 bg-base-100 z-10 border-b border-base-300">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl grid place-items-center text-white"
              style={{ backgroundColor: primaryColor }}
            >
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-none">
                New conversation
              </h2>
              <p className="text-[10px] font-mono opacity-55 mt-0.5">
                Pick who to message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {classTeacher && (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-black tracking-wider opacity-55">
              Your class teacher
            </p>
            <button
              onClick={() => pick(classTeacher)}
              className="w-full p-3 rounded-2xl bg-primary/5 border border-primary/20 hover:bg-primary/10 flex items-center gap-3 text-left transition cursor-pointer"
            >
              <div
                className="w-10 h-10 rounded-full grid place-items-center text-white font-black shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                {initialOf(userDisplayName(classTeacher))}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black truncate">
                  {userDisplayName(classTeacher)}
                </p>
                <p className="text-[11px] opacity-60 truncate">
                  {roleLabel(classTeacher) || "Class teacher"}
                  {classTeacher.email && ` · ${classTeacher.email}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          </div>
        )}

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teachers and staff…"
            className="w-full pl-9 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 opacity-55" />
            <p className="text-[10px] uppercase font-black tracking-wider opacity-55">
              Teachers & staff
            </p>
            <span className="ml-auto text-[10px] font-mono opacity-45">
              {otherStaff.length}
            </span>
          </div>

          {loadingStaff ? (
            <div className="p-6 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading staff…
            </div>
          ) : staffError ? (
            <div className="p-3 bg-error/10 text-error rounded-xl text-[11px] flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errMsg(staffErr, "Could not load staff list.")}</span>
            </div>
          ) : otherStaff.length === 0 ? (
            <div className="p-5 text-center text-[11px] opacity-55 border-2 border-dashed border-base-300 rounded-xl">
              {search
                ? "No matching users."
                : staff.length === 0
                ? "No other staff members found."
                : "All staff are pinned above."}
            </div>
          ) : (
            <div className="space-y-1 max-h-[240px] overflow-y-auto pr-1">
              {otherStaff.slice(0, 60).map((u) => (
                <button
                  key={u.id}
                  onClick={() => pick(u)}
                  className="w-full p-2.5 bg-base-100 border border-base-300 rounded-xl hover:border-primary/40 hover:bg-base-200/40 transition flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <div
                    className="w-8 h-8 rounded-full grid place-items-center text-white text-[11px] font-black shrink-0"
                    style={{ backgroundColor: `${primaryColor}cc` }}
                  >
                    {initialOf(userDisplayName(u))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">
                      {userDisplayName(u)}
                    </p>
                    <p className="text-[10px] opacity-55 truncate">
                      {roleLabel(u) || "Staff"}
                      {u.email && ` · ${u.email}`}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-30" />
                </button>
              ))}
              {otherStaff.length > 60 && (
                <p className="text-[10px] text-center opacity-45 pt-1 font-mono">
                  +{otherStaff.length - 60} more — refine your search
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-base-300 space-y-2">
          <button
            onClick={() => setShowManual((v) => !v)}
            className="text-[10px] font-black uppercase tracking-wider opacity-55 hover:opacity-100 flex items-center gap-1 cursor-pointer"
          >
            <ChevronRight
              className={`w-3 h-3 transition-transform ${showManual ? "rotate-90" : ""}`}
            />
            Advanced: enter user ID manually
          </button>

          {showManual && (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="User UUID (e.g. 89813af8-…)"
                className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Display name (optional)"
                className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                onClick={startManual}
                className="w-full py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: primaryColor }}
              >
                Start conversation
              </button>
            </div>
          )}

          {localError && (
            <p className="text-[11px] text-error flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" /> {localError}
            </p>
          )}
        </div>

        <p className="text-[10px] font-mono opacity-50 text-center pt-1">
          The first message creates the thread.
        </p>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE THREAD VIEW
   Kept for future use — not rendered while DIRECT_MESSAGING_ENABLED = false
   ═══════════════════════════════════════════════════════════════ */
function ThreadView({
  withUserId,
  withUserName,
  currentUserId,
  schoolId,
  primaryColor,
  onBack,
}: {
  withUserId: string;
  withUserName?: string;
  currentUserId: string;
  schoolId: string;
  primaryColor: string;
  onBack: () => void;
}) {
  const [reply, setReply] = useState("");
  const [localError, setLocalError] = useState("");

  const { data, isLoading, isError, error } = useGetMessageThreadQuery(
    { withUserId },
    { pollingInterval: 20_000 }
  );
  const messages = useMemo(() => extractThread(data), [data]);

  const [sendDm, { isLoading: sending }] = useSendDirectMessageMutation();
  const [markRead] = useMarkMessageReadMutation();

  useEffect(() => {
    messages
      .filter((m) => !m.isRead && m.receiverId === currentUserId)
      .forEach((m) => {
        markRead(m.id).catch(() => {});
      });
  }, [messages, currentUserId, markRead]);

  const doSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const text = reply.trim();
    if (!text) return;
    if (!schoolId) {
      setLocalError("School information not available.");
      return;
    }
    try {
      await sendDm({ schoolId, receiverId: withUserId, messageText: text }).unwrap();
      setReply("");
    } catch (err) {
      setLocalError(errMsg(err, "Could not send message."));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-base-300">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 cursor-pointer"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className="w-10 h-10 rounded-full grid place-items-center text-white font-black shrink-0"
          style={{ backgroundColor: primaryColor }}
        >
          {initialOf(withUserName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black truncate">{withUserName ?? "Conversation"}</p>
          <p className="text-[10px] font-mono opacity-55">Private message</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs opacity-60">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading thread…
        </div>
      ) : isError ? (
        <div className="p-3 bg-error/10 text-error rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errMsg(error, "Could not load messages.")}
        </div>
      ) : messages.length === 0 ? (
        <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
          No messages yet. Send the first one below.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                    mine
                      ? "text-white rounded-br-sm"
                      : "bg-base-100 border border-base-300 rounded-bl-sm"
                  }`}
                  style={mine ? { backgroundColor: primaryColor } : {}}
                >
                  <p className="whitespace-pre-wrap break-words">{m.messageText}</p>
                  <p
                    className={`text-[9px] font-mono mt-1 ${
                      mine ? "text-white/70 text-right" : "opacity-50"
                    }`}
                  >
                    {fmtRelative(m.createdAt)}
                    {mine && m.isRead && (
                      <span className="inline-flex ml-1 items-center gap-0.5">
                        · <CheckCheck className="w-2.5 h-2.5" /> read
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {localError && (
        <div className="p-2.5 bg-error/10 text-error rounded-xl text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" /> {localError}
        </div>
      )}

      <form onSubmit={doSend} className="flex gap-2 pt-2 border-t border-base-300">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="px-4 py-2.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: primaryColor }}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
type Tab = "announcements" | "notifications" | "messages";

export default function StudentNotifications() {
  const [tab, setTab] = useState<Tab>("announcements");
  const [activeThread, setActiveThread] = useState<{
    userId: string;
    userName?: string;
  } | null>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [classTeacherUserId, setClassTeacherUserId] = useState<string | undefined>();
  const [classTeacherName, setClassTeacherName] = useState<string | undefined>();
  const [audienceFilter, setAudienceFilter] = useState<string>("");
  const [searchAnnouncements, setSearchAnnouncements] = useState("");
  const [searchMessages, setSearchMessages] = useState("");

  /* ── 1. Identity chain ── */
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
    error: profileErr,
  } = useGetMyProfileQuery(undefined);
  const profile = useMemo(() => flattenProfile(profileData), [profileData]);
  const userId: string | undefined =
    profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  const { data: studentByUser, isLoading: loadingStudent } = useGetStudentByUserIdQuery(
    userId as string,
    { skip: !userId }
  );
  const studentRecord = useMemo(() => unwrap<any>(studentByUser), [studentByUser]);
  const studentId: string | undefined =
    studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData, isLoading: loadingFull } = useGetStudentWithRelationsQuery(
    studentId as string,
    { skip: !studentId }
  );
  const fullStudent = useMemo(() => unwrap<any>(fullStudentData), [fullStudentData]);

  const schoolId: string | undefined =
    fullStudent?.schoolId ??
    studentRecord?.schoolId ??
    profile.schoolId ??
    profile.school?.id;

  const classId: string | undefined =
    fullStudent?.classId ?? fullStudent?.class?.id ?? studentRecord?.classId;

  /* ── 2. Extract class teacher from fullStudent ── */
  useEffect(() => {
    const ct = fullStudent?.class?.classTeacher;
    const ctUserId = ct?.userId ?? ct?.user?.id ?? ct?.id;
    const name =
      ct?.name ??
      ct?.fullName ??
      [ct?.firstName, ct?.lastName].filter(Boolean).join(" ") ??
      "";
    setClassTeacherUserId(ctUserId);
    setClassTeacherName(name || "Class teacher");
  }, [fullStudent]);

  /* ── 3. School + term ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId as string, {
    skip: !schoolId,
  });
  const currentTerm: any = (currentTermData as any)?.data ?? (currentTermData as any)?.term;

  /* ── 4. Announcements ── */
  const { data: myAnnData, isLoading: loadingMyAnn } = useGetMyActiveAnnouncementsQuery();
  const { data: classAnnData, isLoading: loadingClassAnn } = useGetClassAnnouncementsQuery(
    classId as string,
    { skip: !classId }
  );

  const announcements = useMemo(() => {
    const my = extractAnnouncements(myAnnData);
    const cls = extractAnnouncements(classAnnData);
    const map = new Map<string, Announcement>();
    [...my, ...cls].forEach((a) => map.set(a.id, a));
    return [...map.values()].sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
  }, [myAnnData, classAnnData]);

  /* ── 5. Notifications ── */
  const {
    data: notifData,
    isLoading: loadingNotifs,
    refetch: refetchNotifs,
  } = useListMyNotificationsQuery({ limit: 50 }, { pollingInterval: 60_000 });

  const { data: unreadData } = useGetMyUnreadNotificationCountQuery(undefined, {
    pollingInterval: 30_000,
  });

  const notifications = useMemo(() => extractNotifications(notifData), [notifData]);
  const unreadCount = (unreadData as any)?.count ?? 0;

  const [markAllRead, { isLoading: markingRead }] =
    useMarkAllNotificationsReadMutation();

  const doMarkAllRead = async () => {
    try {
      await markAllRead({}).unwrap();
      refetchNotifs();
    } catch {}
  };

  /* ── 6. Messages (only when feature is enabled) ── */
  const { data: inboxData, isLoading: loadingInbox } = useGetInboxQuery(undefined, {
    pollingInterval: 45_000,
    skip: !DIRECT_MESSAGING_ENABLED,
  });
  const inbox = useMemo(() => extractInbox(inboxData), [inboxData]);

  /* ── 7. Filters ── */
  const filteredAnnouncements = useMemo(() => {
    let list = announcements;
    if (audienceFilter) {
      list = list.filter((a) => a.targetAudience === audienceFilter);
    }
    if (searchAnnouncements.trim()) {
      const q = searchAnnouncements.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.message.toLowerCase().includes(q)
      );
    }
    return list;
  }, [announcements, audienceFilter, searchAnnouncements]);

  const audiences = useMemo(
    () => [...new Set(announcements.map((a) => a.targetAudience))],
    [announcements]
  );

  const filteredInbox = useMemo(() => {
    if (!searchMessages.trim()) return inbox;
    const q = searchMessages.trim().toLowerCase();
    return inbox.filter((e) => {
      const name = e.withUser?.name ?? "";
      const text = e.lastMessage?.messageText ?? "";
      return name.toLowerCase().includes(q) || text.toLowerCase().includes(q);
    });
  }, [inbox, searchMessages]);

  const unreadMessages = useMemo(
    () => inbox.reduce((s, e) => s + (e.unreadCount ?? 0), 0),
    [inbox]
  );

  /* ── 8. Labels ── */
  const className: string =
    fullStudent?.class?.name ?? fullStudent?.className ?? profile.className ?? "My Class";
  const stream: string | undefined =
    fullStudent?.class?.stream ?? studentRecord?.class?.stream;
  const admissionNumber: string | undefined =
    fullStudent?.admissionNumber ?? studentRecord?.admissionNumber;
  const studentName =
    [
      fullStudent?.firstName ?? studentRecord?.firstName,
      fullStudent?.lastName ?? studentRecord?.lastName,
    ]
      .filter(Boolean)
      .join(" ") || null;

  const primaryColor = school?.primaryColor || "#6366f1";

  /* ── 9. Gates ── */
  const resolvingIdentity =
    loadingProfile || (!studentId && (loadingStudent || loadingFull));

  if (resolvingIdentity) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-base-200/60" />
        <div className="h-10 w-64 rounded-xl bg-base-200/60" />
        <div className="h-72 rounded-3xl bg-base-200/60" />
      </div>
    );
  }

  if (profileError || !studentId) {
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <GraduationCap className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">We couldn't find your student record.</p>
        <p className="text-xs opacity-60">
          Please contact the school office to have your record linked to your account.
        </p>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-base-200 to-secondary/20 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-56 h-56 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start gap-5 flex-wrap">
          <div
            className="w-20 h-20 rounded-3xl text-white grid place-items-center shadow-lg shrink-0 relative"
            style={{ backgroundColor: primaryColor }}
          >
            <Bell className="w-9 h-9" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] px-1.5 rounded-full bg-error text-error-content text-[10px] font-black grid place-items-center border-2 border-base-100">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              Notifications & Messages
            </p>
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight truncate"
              style={{ color: primaryColor }}
            >
              {className}
            </h1>
            {studentName && (
              <p className="text-sm font-bold opacity-80 mt-1 truncate">{studentName}</p>
            )}

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase rounded-full border"
                style={{
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  borderColor: `${primaryColor}40`,
                }}
              >
                <School className="w-3 h-3" /> {className}
                {stream && <> · {stream}</>}
              </span>
              {admissionNumber && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full font-mono">
                  <Hash className="w-3 h-3" /> {admissionNumber}
                </span>
              )}
              {currentTerm?.termName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                  <Sparkles className="w-3 h-3" /> {currentTerm.termName}{" "}
                  {currentTerm.academicYear}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 border-b border-base-300 pb-3 flex-wrap">
        {(
          [
            ["announcements", "Announcements", Megaphone, announcements.length],
            ["notifications", "Notifications", Bell, unreadCount],
            ["messages", "Messages", MessageSquare, DIRECT_MESSAGING_ENABLED ? unreadMessages : 0],
          ] as const
        ).map(([id, label, Icon, badge]) => {
          const isMessagesTab = id === "messages";
          const isLocked = isMessagesTab && !DIRECT_MESSAGING_ENABLED;
          return (
            <button
              key={id}
              onClick={() => {
                setTab(id);
                setActiveThread(null);
              }}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                tab === id
                  ? "text-white shadow-md"
                  : "bg-base-200/50 hover:bg-base-200 opacity-75"
              }`}
              style={tab === id ? { backgroundColor: primaryColor } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
              {isLocked ? (
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    tab === id ? "bg-white/25 text-white" : "bg-warning/15 text-warning"
                  }`}
                >
                  <Lock className="w-2.5 h-2.5" /> Soon
                </span>
              ) : badge > 0 ? (
                <span
                  className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black grid place-items-center ${
                    tab === id ? "bg-white/25 text-white" : "bg-error text-error-content"
                  }`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          ANNOUNCEMENTS TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "announcements" && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-base-300">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">
                School announcements
              </h2>
            </div>
            <span className="ml-auto text-[10px] font-mono opacity-55">
              {filteredAnnouncements.length} of {announcements.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchAnnouncements}
                onChange={(e) => setSearchAnnouncements(e.target.value)}
                placeholder="Search announcements…"
                className="w-full pl-9 pr-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            {audiences.length > 1 && (
              <select
                value={audienceFilter}
                onChange={(e) => setAudienceFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer"
              >
                <option value="">All audiences</option>
                {audiences.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
          </div>

          {loadingMyAnn || loadingClassAnn ? (
            <div className="p-12 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading announcements…
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold">No announcements</p>
              <p className="opacity-70">
                {announcements.length === 0
                  ? "The school hasn't posted any announcements yet."
                  : "No announcements match the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAnnouncements.map((a) => (
                <AnnouncementCard
                  key={a.id}
                  announcement={a}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NOTIFICATIONS TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "notifications" && (
        <div className={`${CARD} space-y-4`}>
          <div className="flex items-center gap-3 flex-wrap pb-3 border-b border-base-300">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-wider">My notifications</h2>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-error/10 text-error text-[10px] font-black uppercase rounded-full">
                  {unreadCount} unread
                </span>
              )}
              <button
                onClick={doMarkAllRead}
                disabled={markingRead || unreadCount === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200 text-[10px] font-black uppercase disabled:opacity-50 cursor-pointer"
              >
                {markingRead ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3 h-3" />
                )}
                Mark all read
              </button>
            </div>
          </div>

          {loadingNotifs ? (
            <div className="p-12 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold">No notifications yet</p>
              <p className="opacity-70">
                You'll see important updates here when the school sends them.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} primaryColor={primaryColor} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MESSAGES TAB — COMING SOON
         ═══════════════════════════════════════════════════════════ */}
      {tab === "messages" && (
        <>
          {DIRECT_MESSAGING_ENABLED && activeThread ? (
            <div className={`${CARD} space-y-4`}>
              <ThreadView
                withUserId={activeThread.userId}
                withUserName={activeThread.userName}
                currentUserId={userId ?? ""}
                schoolId={schoolId ?? ""}
                primaryColor={primaryColor}
                onBack={() => setActiveThread(null)}
              />
            </div>
          ) : (
            <DirectMessagesComingSoon primaryColor={primaryColor} />
          )}
        </>
      )}

      {/* ── INFO FOOTER ── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Announcements are posted by the school administration. Notifications
          update in real time. Direct messaging will be available in an upcoming
          update.
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          NEW CONVERSATION MODAL (portal)
          Rendered only when DIRECT_MESSAGING_ENABLED = true
         ═══════════════════════════════════════════════════════════ */}
      {DIRECT_MESSAGING_ENABLED && showNewConv && (
        <NewConversationModal
          schoolId={schoolId ?? ""}
          currentUserId={userId}
          classTeacherUserId={classTeacherUserId}
          classTeacherName={classTeacherName}
          primaryColor={primaryColor}
          onClose={() => setShowNewConv(false)}
          onStart={(uid, uname) => setActiveThread({ userId: uid, userName: uname })}
        />
      )}
    </div>
  );
}