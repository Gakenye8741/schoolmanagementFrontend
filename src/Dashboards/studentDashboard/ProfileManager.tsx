import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch } from "react-redux";
import {
  User, Mail, Phone, MapPin, IdCard, GraduationCap, CalendarDays, Save,
  Lock, Eye, EyeOff, MonitorSmartphone, LogOut, CheckCircle2, AlertCircle,
  X, Loader2, ShieldCheck, School, Hash, Copy, Check, Smartphone,
  Tablet, Monitor, Globe, Clock, Sparkles, BadgeCheck, KeyRound,
  CalendarRange, Users, Info, AlertTriangle, ChevronRight, Fingerprint,
  Building2, Shield, Activity, Terminal, CircleDot,
} from "lucide-react";
import { clearCredentials } from "../../features/Auth/AuthSlice";
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangePasswordMutation,
  useGetMySessionsQuery,
  useLogoutAllSessionsMutation,
} from "../../features/Apis/Auth.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
} from "../../features/Apis/students.Api";
import { useGetCurrentTermBySchoolIdQuery } from "../../features/Apis/Term.Api";
import { useGetGradeLevelByIdQuery } from "../../features/Apis/academicStructure.Api";

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";
const INPUT =
  "w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60";
const LABEL = "block text-xs font-bold uppercase tracking-wider opacity-70";

const errMsg = (err: any, fallback: string) =>
  err?.status === 401
    ? "Your session has expired. Please sign in again."
    : err?.data?.message || err?.message || fallback;

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d.length === 10 ? `${d}T00:00:00` : d).toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return d;
  }
};

const fmtDateTime = (d?: string | null) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString(undefined, {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit",
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
    if (days < 30) return `${days}d ago`;
    return fmtDate(d);
  } catch {
    return d;
  }
};

function flattenProfile(data: any): Record<string, any> {
  const root = data?.user ?? data?.profile ?? data?.data ?? data ?? {};
  const nested = root?.student ?? root?.studentProfile ?? {};
  return { ...nested, ...root };
}

const unwrap = <T,>(v: any): T | null =>
  (v?.student ?? v?.enrollment ?? v?.data ?? v ?? null) as T | null;

const sessionsList = (d: any): any[] =>
  Array.isArray(d) ? d : d?.sessions ?? d?.data ?? [];

/** Pick a device icon based on user-agent string. */
function deviceIcon(ua?: string) {
  const s = (ua ?? "").toLowerCase();
  if (/ipad|tablet/.test(s)) return Tablet;
  if (/mobile|android|iphone/.test(s)) return Smartphone;
  return Monitor;
}

/** Parse browser from user-agent. */
function browserFromUA(ua?: string): string {
  const s = (ua ?? "").toLowerCase();
  if (/edg\//.test(s)) return "Microsoft Edge";
  if (/opr\/|opera/.test(s)) return "Opera";
  if (/chrome\//.test(s) && !/edg\//.test(s)) return "Chrome";
  if (/firefox\//.test(s)) return "Firefox";
  if (/safari\//.test(s) && !/chrome/.test(s)) return "Safari";
  return "Unknown browser";
}

/** Parse OS from user-agent. */
function osFromUA(ua?: string): string {
  const s = (ua ?? "").toLowerCase();
  if (/windows nt/.test(s)) return "Windows";
  if (/mac os x/.test(s)) return "macOS";
  if (/iphone|ipad|ipod/.test(s)) return "iOS";
  if (/android/.test(s)) return "Android";
  if (/linux/.test(s)) return "Linux";
  return "Unknown OS";
}

/** Password strength 0–4. */
function pwStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

type Tab = "details" | "security" | "sessions";

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function CopyableValue({ value }: { value?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!value) return <span>—</span>;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-sm font-bold hover:text-primary transition group cursor-pointer"
      title="Copy"
    >
      {value}
      {copied ? (
        <Check className="w-3 h-3 text-success" />
      ) : (
        <Copy className="w-3 h-3 opacity-40 group-hover:opacity-100" />
      )}
    </button>
  );
}

function RecordRow({
  icon: Icon,
  label,
  value,
  copyable,
  sub,
}: {
  icon: any;
  label: string;
  value?: React.ReactNode;
  copyable?: string | null;
  sub?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-55">
          {label}
        </p>
        <div className="text-sm font-bold truncate">
          {copyable ? <CopyableValue value={copyable} /> : value || "—"}
        </div>
        {sub && <p className="text-[10px] font-mono opacity-50 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Portal: Toast ── */
function ToastPortal({
  tone,
  message,
  onClose,
}: {
  tone: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const t = setTimeout(() => onCloseRef.current(), 4500);
    return () => clearTimeout(t);
  }, []);

  const toneStyles =
    tone === "success"
      ? "bg-success/10 border-success/30 text-success"
      : "bg-error/10 border-error/30 text-error";
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-[70] max-w-sm w-[calc(100vw-2rem)] sm:w-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 animate-in slide-in-from-top duration-200 ${toneStyles}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <span className="text-sm font-bold flex-1 leading-snug">{message}</span>
      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 cursor-pointer shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>,
    document.body
  );
}

/* ── Portal: Confirmation modal ── */
function ConfirmPortal({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  danger,
  loading,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loading, onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => !loading && onCancel()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md bg-base-100 rounded-3xl border border-base-300 shadow-2xl p-6 space-y-4 animate-in slide-in-from-bottom-2 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-11 h-11 rounded-2xl grid place-items-center shrink-0 ${
              danger ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
            }`}
          >
            {danger ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black leading-tight">{title}</h2>
            <div className="text-xs opacity-75 mt-1 leading-relaxed">{message}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-base-200 text-[11px] font-black uppercase tracking-wider hover:bg-base-300 cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-white cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 ${
              danger ? "bg-error hover:bg-error/90" : "bg-primary hover:opacity-90"
            }`}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Portal: Session detail drawer ── */
function SessionDrawerPortal({
  session,
  onClose,
}: {
  session: any;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const DevIcon = deviceIcon(session.userAgent ?? session.browser);
  const browser = browserFromUA(session.userAgent);
  const os = osFromUA(session.userAgent);
  const isCurrent = session.isCurrent || session.current;

  return createPortal(
    <div
      className="fixed inset-0 z-[65] flex justify-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Session details"
    >
      <aside
        className="w-full max-w-md h-full overflow-y-auto bg-base-100 border-l border-base-300 shadow-2xl p-6 space-y-5 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-base-300">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isCurrent ? "bg-primary/15 text-primary" : "bg-base-200 text-base-content/70"
              }`}
            >
              <DevIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black leading-tight truncate">
                {session.device ?? browser}
              </h2>
              <p className="text-[11px] font-mono opacity-60 truncate">
                {os} · {browser}
              </p>
              {isCurrent && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-success/10 text-success text-[9px] font-black uppercase rounded-full">
                  <CircleDot className="w-2.5 h-2.5" /> This device
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60">
              Session details
            </h3>
          </div>

          <div className="space-y-2">
            {[
              ["Session ID", session.id ?? "—", true],
              ["IP address", session.ipAddress ?? session.ip ?? "—", false],
              ["Signed in", fmtDateTime(session.createdAt), false],
              ["Last used", session.lastUsedAt ? fmtDateTime(session.lastUsedAt) : "—", false],
              ["Revoked", session.revokedAt ? fmtDateTime(session.revokedAt) : "No", false],
              ["Status", session.isActive === false ? "Inactive" : "Active", false],
            ].map(([label, value, mono]: any) => (
              <div
                key={label}
                className="p-3 rounded-xl bg-base-200/40 border border-base-300 flex items-start gap-3"
              >
                <p className="text-[10px] font-black uppercase tracking-wider opacity-55 w-24 shrink-0 pt-0.5">
                  {label}
                </p>
                <p className={`text-xs flex-1 break-all ${mono ? "font-mono" : "font-semibold"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-wider opacity-60">
              Raw user agent
            </h3>
          </div>
          <div className="p-3 rounded-xl bg-base-200/40 border border-base-300">
            <p className="text-[10px] font-mono opacity-75 break-all leading-relaxed">
              {session.userAgent ?? "Not captured"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-info/5 border border-info/20 text-[11px]">
          <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5 text-info" />
          <span className="opacity-80">
            If you don't recognise this session, sign out everywhere and change
            your password immediately.
          </span>
        </div>
      </aside>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function StudentProfile() {
  const dispatch = useDispatch();
  const [tab, setTab] = useState<Tab>("details");
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<any>(null);

  const setOk = (msg: string) => setToast({ tone: "success", message: msg });
  const setErr = (msg: string) => setToast({ tone: "error", message: msg });

  /* ── identity chain ── */
  const { data, isLoading, isError, error } = useGetMyProfileQuery(undefined);
  const profile = useMemo(() => flattenProfile(data), [data]);

  const userId: string | undefined =
    profile.userId ?? profile.id ?? profile.user?.id ?? profile.authUserId;

  const { data: studentByUser } = useGetStudentByUserIdQuery(userId as string, {
    skip: !userId,
  });
  const studentRecord = useMemo(() => unwrap<any>(studentByUser), [studentByUser]);
  const studentId: string | undefined =
    studentRecord?.id ?? profile.studentId ?? profile.student?.id;

  const { data: fullStudentData } = useGetStudentWithRelationsQuery(
    studentId as string,
    { skip: !studentId }
  );
  const fullStudent = useMemo(() => unwrap<any>(fullStudentData), [fullStudentData]);

  const schoolId: string | undefined =
    fullStudent?.schoolId ??
    studentRecord?.schoolId ??
    profile.schoolId ??
    profile.school?.id;

  /* ── school + grade + term ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, {
    skip: !schoolId,
  });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(
    schoolId as string,
    { skip: !schoolId }
  );
  const currentTerm: any =
    (currentTermData as any)?.data ?? (currentTermData as any)?.term;

  const gradeLevelId: string | undefined =
    fullStudent?.class?.gradeLevelId ?? fullStudent?.class?.gradeLevel?.id;
  const { data: gradeLevelData } = useGetGradeLevelByIdQuery(
    gradeLevelId as string,
    { skip: !gradeLevelId }
  );
  const gradeLevel: any =
    (gradeLevelData as any)?.data ?? (gradeLevelData as any)?.gradeLevel;

  /* ── labels ── */
  const fullName =
    `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim() ||
    profile.fullName ||
    profile.name ||
    profile.username ||
    "Student";
  const className =
    fullStudent?.class?.name ??
    profile.className ??
    profile.class?.name ??
    profile.class?.className ??
    profile.classLabel ??
    null;
  const stream: string | undefined =
    fullStudent?.class?.stream ?? studentRecord?.class?.stream;
  const gradeName: string | undefined =
    fullStudent?.class?.gradeLevel?.name ?? gradeLevel?.name;
  const educationStage: string | undefined =
    fullStudent?.class?.gradeLevel?.educationStage ?? gradeLevel?.educationStage;
  const academicYear: string | undefined =
    fullStudent?.class?.academicYear ?? fullStudent?.academicYear;
  const admission: string | undefined =
    fullStudent?.admissionNumber ??
    profile.admissionNumber ??
    profile.admissionNo ??
    studentRecord?.admissionNumber ??
    null;
  const upi: string | undefined = profile.upiNumber ?? studentRecord?.upiNumber;

  /* Class teacher (from with-relations) */
  const classTeacher = fullStudent?.class?.classTeacher;
  const classTeacherName: string | undefined = classTeacher
    ? classTeacher.name ||
      classTeacher.fullName ||
      [classTeacher.firstName, classTeacher.lastName].filter(Boolean).join(" ") ||
      undefined
    : undefined;

  const classTitle = (() => {
    const g = gradeName ?? className;
    if (g && stream) return `${g} · ${stream}`;
    return g ?? null;
  })();

  const primaryColor = school?.primaryColor || "#6366f1";
  const schoolName = school?.name ?? profile.school?.name ?? "School";

  /* ── account metadata ── */
  const accountCreated = profile.createdAt ?? studentRecord?.createdAt;
  const lastLogin = profile.lastLoginAt ?? profile.lastLogin;
  const accountId = userId ?? studentId;

  /* ── editable details ── */
  const [form, setForm] = useState({ email: "", phone: "", address: "" });
  useEffect(() => {
    setForm({
      email: profile.email ?? "",
      phone: profile.phone ?? profile.phoneNumber ?? "",
      address: profile.address ?? "",
    });
  }, [profile.email, profile.phone, profile.phoneNumber, profile.address]);

  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();

  const original = {
    email: profile.email ?? "",
    phone: profile.phone ?? profile.phoneNumber ?? "",
    address: profile.address ?? "",
  };
  const dirty = (Object.keys(form) as Array<keyof typeof form>).some(
    (k) => form[k] !== original[k]
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      return setErr("Enter a valid email address.");
    if (form.phone && !/^[+\d][\d\s\-()]{6,}$/.test(form.phone))
      return setErr("Enter a valid phone number.");

    const patch: Record<string, string> = {};
    (Object.keys(form) as Array<keyof typeof form>).forEach((k) => {
      if (form[k] !== original[k]) patch[k] = form[k].trim();
    });
    try {
      await updateProfile(patch).unwrap();
      setOk("Profile updated.");
    } catch (e: any) {
      setErr(errMsg(e, "Could not update your profile."));
    }
  };

  /* ── password ── */
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();

  const strength = pwStrength(pw.newPassword);
  const strengthLabel = ["Very weak", "Weak", "Fair", "Strong", "Very strong"][strength];
  const strengthColor = ["bg-error", "bg-error", "bg-warning", "bg-info", "bg-success"][
    strength
  ];

  /* password requirement flags */
  const reqs = [
    { label: "At least 8 characters", ok: pw.newPassword.length >= 8 },
    { label: "Contains uppercase & lowercase", ok: /[A-Z]/.test(pw.newPassword) && /[a-z]/.test(pw.newPassword) },
    { label: "Contains a number", ok: /\d/.test(pw.newPassword) },
    { label: "Contains a symbol", ok: /[^A-Za-z0-9]/.test(pw.newPassword) },
  ];

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.currentPassword) return setErr("Enter your current password.");
    if (pw.newPassword.length < 8)
      return setErr("New password must be at least 8 characters.");
    if (pw.newPassword !== pw.confirm)
      return setErr("New passwords do not match.");
    if (pw.newPassword === pw.currentPassword)
      return setErr("New password must be different from the current one.");
    try {
      await changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      }).unwrap();
      setOk("Password changed.");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e: any) {
      setErr(errMsg(e, "Could not change your password."));
    }
  };

  /* ── sessions ── */
  const { data: sessionsData, isLoading: loadingSessions } = useGetMySessionsQuery(
    undefined,
    { skip: tab !== "sessions" }
  );
  const sessions = useMemo(() => sessionsList(sessionsData), [sessionsData]);
  const [logoutAll, { isLoading: loggingOut }] = useLogoutAllSessionsMutation();

  const handleLogoutAll = async () => {
    try {
      await logoutAll(undefined).unwrap();
      dispatch(clearCredentials());
    } catch (e: any) {
      setErr(errMsg(e, "Could not sign out of all sessions."));
      setConfirmLogout(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setToast(null);
  };

  /* ── loading / error gates ── */
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-base-200/60" />
        <div className="h-10 w-64 rounded-xl bg-base-200/60" />
        <div className="h-96 rounded-3xl bg-base-200/60" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="p-6 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium">
          {errMsg(error, "Could not load your profile.")}
        </span>
      </div>
    );
  }

  const readOnly: Array<[string, any, React.ComponentType<{ className?: string }>, string?, string?]> = [
    ["Admission No.", admission, IdCard, "copy", undefined],
    ["UPI Number", upi, Hash, "copy", undefined],
    ["Class", classTitle, GraduationCap, undefined, educationStage],
    ["Class teacher", classTeacherName, Users, undefined, undefined],
    ["Academic year", academicYear, CalendarRange, undefined, undefined],
    ["Gender", profile.gender, User, undefined, undefined],
    ["Date of birth", fmtDate(profile.dateOfBirth ?? profile.dob), CalendarDays, undefined, undefined],
  ];

  const sessionCount = sessions.length;

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* ── HEADER ── */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm"
        style={{ borderColor: `${primaryColor}40` }}
      >
        <div
          className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="relative z-10 flex items-center gap-5 flex-wrap">
          <div
            className="w-20 h-20 rounded-3xl text-white grid place-items-center text-3xl font-black shadow-lg shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              My Profile
            </p>
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight truncate"
              style={{ color: primaryColor }}
            >
              {fullName}
            </h1>
            <p className="text-xs font-mono opacity-65 mt-1 truncate">
              {[admission && `ADM ${admission}`, classTitle].filter(Boolean).join(" · ") ||
                "Student"}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full border border-success/20">
                <ShieldCheck className="w-3 h-3" /> Active Student
              </span>
              {schoolName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full truncate max-w-[240px]">
                  <School className="w-3 h-3" /> {schoolName}
                </span>
              )}
              {currentTerm?.termName && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-info/10 text-info text-[10px] font-black uppercase rounded-full border border-info/20">
                  <Sparkles className="w-3 h-3" /> {currentTerm.termName}{" "}
                  {currentTerm.academicYear}
                </span>
              )}
              {sessionCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-base-100 border border-base-300 text-[10px] font-black uppercase rounded-full">
                  <MonitorSmartphone className="w-3 h-3" /> {sessionCount} device{sessionCount === 1 ? "" : "s"}
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
            ["details", "My Details", User],
            ["security", "Password", KeyRound],
            ["sessions", "Devices", MonitorSmartphone],
          ] as const
        ).map(([id, label, Icon]) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                active
                  ? "text-white shadow-md"
                  : "bg-base-200/50 hover:bg-base-200 opacity-75"
              }`}
              style={active ? { backgroundColor: primaryColor } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          DETAILS TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "details" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          {/* School record */}
          <div className={`md:col-span-2 ${CARD} space-y-4`}>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
                School record
              </h2>
            </div>

            <div className="space-y-3 pt-1">
              {readOnly.map(([label, value, Icon, mode, sub]) => (
                <RecordRow
                  key={label}
                  icon={Icon}
                  label={label}
                  value={value}
                  copyable={mode === "copy" && value ? String(value) : undefined}
                  sub={sub ?? undefined}
                />
              ))}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-info/5 border border-info/20 text-[11px] mt-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-info" />
              <span className="opacity-80">
                Name, class and admission number are managed by the school office.
                Contact them to correct any mistakes.
              </span>
            </div>

            {/* Account metadata footer */}
            {(accountCreated || lastLogin || accountId) && (
              <div className="pt-3 mt-1 border-t border-base-300 space-y-1.5 text-[10px] font-mono opacity-55">
                {accountCreated && (
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3" />
                    Account created {fmtDate(accountCreated)}
                  </p>
                )}
                {lastLogin && (
                  <p className="flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    Last login {fmtRelative(lastLogin)}
                  </p>
                )}
                {accountId && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Fingerprint className="w-3 h-3 shrink-0" />
                    ID {accountId}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Contact details form */}
          <form onSubmit={handleSave} className={`md:col-span-3 ${CARD} space-y-5`}>
            <div className="flex items-center gap-2 pb-2 border-b border-base-300">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Mail className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
                Contact details
              </h2>
              {dirty && (
                <span className="ml-auto text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-warning/15 text-warning">
                  Unsaved
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className={LABEL}>Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`${INPUT} pl-11`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL}>Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`${INPUT} pl-11`}
                  placeholder="+254…"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={LABEL}>Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className={`${INPUT} pl-11`}
                  placeholder="Home address"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving || !dirty}
              className="w-full text-white font-black py-3.5 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all hover:opacity-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SECURITY TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "security" && (
        <form onSubmit={handlePassword} className={`${CARD} max-w-xl space-y-5`}>
          <div className="flex items-center gap-2 pb-2 border-b border-base-300">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Lock className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
              Change password
            </h2>
          </div>

          {/* Current */}
          <div className="space-y-1.5">
            <label className={LABEL}>Current password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={pw.currentPassword}
                autoComplete="current-password"
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                className={`${INPUT} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                aria-label={showCurrent ? "Hide" : "Show"}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New */}
          <div className="space-y-1.5">
            <label className={LABEL}>New password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={pw.newPassword}
                autoComplete="new-password"
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                className={`${INPUT} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                aria-label={showNew ? "Hide" : "Show"}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength meter */}
            {pw.newPassword && (
              <div className="space-y-1 pt-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        i < strength ? strengthColor : "bg-base-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold opacity-60">
                  Strength:{" "}
                  <span
                    className={
                      strength >= 3
                        ? "text-success"
                        : strength === 2
                        ? "text-info"
                        : "text-warning"
                    }
                  >
                    {strengthLabel}
                  </span>
                </p>
              </div>
            )}

            {/* Requirements checklist */}
            {pw.newPassword && (
              <div className="space-y-1 pt-2">
                {reqs.map((r) => (
                  <div
                    key={r.label}
                    className={`flex items-center gap-1.5 text-[11px] ${
                      r.ok ? "text-success" : "opacity-55"
                    }`}
                  >
                    {r.ok ? (
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                    ) : (
                      <CircleDot className="w-3 h-3 shrink-0" />
                    )}
                    <span>{r.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className={LABEL}>Confirm new password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={pw.confirm}
                autoComplete="new-password"
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className={`${INPUT} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 cursor-pointer"
                aria-label={showConfirm ? "Hide" : "Show"}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {pw.confirm && pw.newPassword && pw.newPassword !== pw.confirm && (
              <p className="text-[11px] text-error flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Passwords do not match.
              </p>
            )}
            {pw.confirm && pw.newPassword === pw.confirm && pw.confirm.length >= 8 && (
              <p className="text-[11px] text-success flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Passwords match.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={changing}
            className="w-full text-white font-black py-3.5 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            {changing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            {changing ? "Updating…" : "Update password"}
          </button>

          <div className="flex items-start gap-2 p-3 rounded-xl bg-info/5 border border-info/20 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-info" />
            <span className="opacity-80">
              Use a mix of uppercase, lowercase, numbers and symbols. Never share
              your password with anyone — even school staff.
            </span>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════
          SESSIONS TAB
         ═══════════════════════════════════════════════════════════ */}
      {tab === "sessions" && (
        <div className={`${CARD} space-y-5`}>
          <div className="flex items-center gap-2 pb-4 border-b border-base-300">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <MonitorSmartphone className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black uppercase tracking-wider opacity-70">
                Where you're signed in
              </h2>
              <p className="text-[11px] opacity-55">
                {sessions.length} active session{sessions.length === 1 ? "" : "s"} · tap to view details
              </p>
            </div>
          </div>

          {loadingSessions ? (
            <div className="p-8 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
              No active sessions found.
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s: any, i: number) => {
                const DevIcon = deviceIcon(s.userAgent ?? s.browser);
                const isCurrent = s.isCurrent || s.current;
                const browser = browserFromUA(s.userAgent);
                const os = osFromUA(s.userAgent);
                return (
                  <button
                    key={s.id ?? i}
                    onClick={() => setSessionDetail(s)}
                    className={`w-full p-4 rounded-2xl border flex items-center gap-3 transition text-left cursor-pointer hover:border-primary/40 ${
                      isCurrent
                        ? "bg-primary/5 border-primary/30"
                        : "bg-base-100 border-base-300"
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isCurrent
                          ? "bg-primary/15 text-primary"
                          : "bg-base-200 text-base-content/70"
                      }`}
                    >
                      <DevIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold truncate">
                          {s.device ?? browser}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-success/10 text-success text-[9px] font-extrabold uppercase rounded">
                            This device
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono opacity-60 truncate mt-0.5">
                        {[s.ipAddress ?? s.ip, os, browser, `Signed in ${fmtRelative(s.createdAt)}`]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Danger zone */}
          <div className="pt-4 border-t border-base-300 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <h3 className="text-xs font-black uppercase tracking-wider text-error">
                Danger zone
              </h3>
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              disabled={loggingOut}
              className="w-full text-white font-black py-3.5 rounded-2xl shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 transition-all bg-error hover:bg-error/90 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? "Signing out…" : "Sign out everywhere"}
            </button>
            <p className="text-[11px] opacity-55 text-center">
              This will sign you out of every device including this one.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PORTAL: Toast
         ═══════════════════════════════════════════════════════════ */}
      {toast &&
        createPortal(
          <ToastPortal
            tone={toast.tone}
            message={toast.message}
            onClose={() => setToast(null)}
          />,
          document.body
        )}

      {/* ═══════════════════════════════════════════════════════════
          PORTAL: Logout confirmation
         ═══════════════════════════════════════════════════════════ */}
      {confirmLogout && (
        <ConfirmPortal
          title="Sign out of every device?"
          message={
            <>
              You'll be signed out on <strong>all devices</strong>, including this
              one. You'll need to sign back in to continue.
            </>
          }
          confirmLabel={loggingOut ? "Signing out…" : "Sign out everywhere"}
          cancelLabel="Cancel"
          danger
          loading={loggingOut}
          onConfirm={handleLogoutAll}
          onCancel={() => !loggingOut && setConfirmLogout(false)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════
          PORTAL: Session detail drawer
         ═══════════════════════════════════════════════════════════ */}
      {sessionDetail && (
        <SessionDrawerPortal
          session={sessionDetail}
          onClose={() => setSessionDetail(null)}
        />
      )}
    </div>
  );
}