import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BookOpen, BookOpenCheck, ClipboardList, GraduationCap, School, Hash,
  CalendarRange, Sparkles, AlertCircle, Loader2, Clock, CheckCircle2,
  XCircle, FileText, Send, Award, MessageSquareQuote, CalendarDays,
  Search, Filter, Upload, Link2, Info, RefreshCw, X, ChevronDown,
  ChevronRight, TrendingUp, Percent, ListChecks, Eye, EyeOff, Target,
} from "lucide-react";
import { useGetMyProfileQuery } from "../../features/Apis/Auth.Api";
import {
  useGetStudentByUserIdQuery,
  useGetStudentWithRelationsQuery,
} from "../../features/Apis/students.Api";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import {
  useGetCurrentTermBySchoolIdQuery,
} from "../../features/Apis/Term.Api";
import {
  useGetSubjectsBySchoolQuery,
} from "../../features/Apis/academicStructure.Api";
import {
  useGetAssignmentsByClassQuery,
  useGetSubmissionsByStudentQuery,
  useGetStudentHomeworkSummaryQuery,
  useSubmitHomeworkMutation,
} from "../../features/Apis/Homework.Api";
import type {
  Assignment,
  Submission,
  SubmissionStatus,
} from "../../features/Apis/Homework.Api";

/* ═══════════════════════════════════════════════════════════════
   STYLES & CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const CARD =
  "bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 sm:p-8 rounded-3xl shadow-xl";

const STATUS_STYLES: Record<
  string,
  { chip: string; dot: string; label: string; icon: any }
> = {
  Pending: {
    chip: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    label: "Pending",
    icon: Clock,
  },
  Submitted: {
    chip: "bg-info/10 text-info border-info/20",
    dot: "bg-info",
    label: "Submitted",
    icon: Send,
  },
  Late: {
    chip: "bg-error/10 text-error border-error/20",
    dot: "bg-error",
    label: "Late",
    icon: AlertCircle,
  },
  Graded: {
    chip: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    label: "Graded",
    icon: CheckCircle2,
  },
  Returned: {
    chip: "bg-secondary/10 text-secondary border-secondary/20",
    dot: "bg-secondary",
    label: "Returned",
    icon: RefreshCw,
  },
  Overdue: {
    chip: "bg-error/10 text-error border-error/20",
    dot: "bg-error",
    label: "Overdue",
    icon: XCircle,
  },
};

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
    const diff = new Date(d).getTime() - Date.now();
    const abs = Math.abs(diff);
    const mins = Math.floor(abs / 60000);
    const suffix = diff > 0 ? "left" : "ago";
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ${suffix}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${suffix}`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ${suffix}`;
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

const extractAssignments = (v: any): Assignment[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["assignments", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractSubmissions = (v: any): Submission[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["submissions", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const extractSubjects = (v: any): any[] => {
  if (!v) return [];
  const d = v.data ?? v;
  if (Array.isArray(d)) return d;
  for (const k of ["subjects", "data", "records"]) {
    if (Array.isArray(d[k])) return d[k];
  }
  return [];
};

const toNum = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtScore = (v: any) => {
  const n = toNum(v);
  return n === null ? "—" : n.toFixed(1);
};

const pct = (score: any, max: any): number | null => {
  const s = toNum(score);
  const m = toNum(max);
  if (s === null || m === null || m === 0) return null;
  return Math.round((s / m) * 1000) / 10;
};

/** Effective status — a Pending submission past its due date shows as Overdue. */
function effectiveStatus(
  assignment: Assignment,
  submission?: Submission | null
): { status: SubmissionStatus; isOverdue: boolean } {
  const status = submission?.status ?? "Pending";
  const isOverdue =
    status === "Pending" &&
    Boolean(assignment.dueDate) &&
    new Date(assignment.dueDate).getTime() < Date.now();
  return { status: isOverdue ? "Overdue" : status, isOverdue };
}

/* ═══════════════════════════════════════════════════════════════
   SMALL COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function StatusChip({ status }: { status: string }) {
  const tone = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
  const Icon = tone.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full border ${tone.chip}`}
    >
      <Icon className="w-3 h-3" />
      {tone.label}
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "text-primary",
  bg = "bg-primary/10",
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: string;
  bg?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-base-100/70 border border-base-300">
      <div className={`p-2.5 rounded-xl ${bg} ${tone}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-black opacity-55">
          {label}
        </p>
        <p className="text-base font-black leading-tight truncate">{value}</p>
        {sub && <p className="text-[10px] opacity-50 font-mono">{sub}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUBMIT MODAL (createPortal)
   ═══════════════════════════════════════════════════════════════ */
function SubmitModal({
  assignment,
  existingSubmission,
  schoolId,
  studentId,
  primaryColor,
  onClose,
  onSubmitted,
}: {
  assignment: Assignment;
  existingSubmission?: Submission | null;
  schoolId: string;
  studentId: string;
  primaryColor: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [text, setText] = useState(existingSubmission?.submissionText ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(
    existingSubmission?.attachmentUrl ?? ""
  );
  const [localError, setLocalError] = useState("");

  const [submit, { isLoading }] = useSubmitHomeworkMutation();

  const isOverdue =
    Boolean(assignment.dueDate) &&
    new Date(assignment.dueDate).getTime() < Date.now();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const doSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    const t = text.trim();
    const a = attachmentUrl.trim();
    if (!t && !a) {
      return setLocalError("Please provide either text or an attachment URL.");
    }
    try {
      await submit({
        schoolId,
        assignmentId: assignment.id,
        studentId,
        ...(t ? { submissionText: t } : {}),
        ...(a ? { attachmentUrl: a } : {}),
      }).unwrap();
      onSubmitted();
      onClose();
    } catch (err) {
      setLocalError(errMsg(err, "Could not submit homework."));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Submit homework"
    >
      <div
        className="w-full max-w-lg bg-base-100 rounded-3xl border border-base-300 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center text-white shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Send className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black leading-tight truncate">
                {existingSubmission ? "Update submission" : "Submit homework"}
              </h2>
              <p className="text-[11px] opacity-60 truncate">{assignment.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-base-200 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isOverdue && !existingSubmission && (
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 text-warning text-[11px] flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              This assignment was due {fmtDateTime(assignment.dueDate)}. Your
              submission will be marked as <strong>Late</strong>.
            </span>
          </div>
        )}

        <form onSubmit={doSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider opacity-55">
              Your answer
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Type your answer or working here…"
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black tracking-wider opacity-55 flex items-center gap-1">
              <Link2 className="w-3 h-3" /> Attachment URL (optional)
            </label>
            <input
              type="url"
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="https://example.com/my-work.pdf"
              className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {localError && (
            <div className="p-2.5 bg-error/10 text-error rounded-xl text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 shrink-0" /> {localError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-base-200 text-[11px] font-black uppercase tracking-wider hover:bg-base-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-wider cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              style={{ backgroundColor: primaryColor }}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {existingSubmission ? "Update" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════════
   ASSIGNMENT CARD
   ═══════════════════════════════════════════════════════════════ */
function AssignmentCard({
  assignment,
  submission,
  subjectName,
  primaryColor,
  onOpenSubmit,
}: {
  assignment: Assignment;
  submission?: Submission | null;
  subjectName: string;
  primaryColor: string;
  onOpenSubmit: (a: Assignment, s?: Submission | null) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { status } = effectiveStatus(assignment, submission);
  const score = submission?.gradeScore;
  const maxScore = assignment.maxScore;
  const percent = pct(score, maxScore);
  const isGraded = status === "Graded";
  const hasSubmission =
    status === "Submitted" || status === "Late" || status === "Graded" || status === "Returned";

  const dueIn = assignment.dueDate ? new Date(assignment.dueDate).getTime() - Date.now() : null;
  const isUrgent = dueIn !== null && dueIn > 0 && dueIn < 24 * 60 * 60 * 1000;

  return (
    <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden hover:border-primary/40 transition">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-start gap-3 text-left cursor-pointer hover:bg-base-200/30 transition"
      >
        <div
          className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          <ClipboardList className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black truncate">{assignment.title}</h3>
            <StatusChip status={status} />
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-base-200 text-base-content/70">
              {subjectName}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] opacity-65">
            <span
              className={`inline-flex items-center gap-1 font-mono ${
                isUrgent ? "text-error font-bold" : ""
              }`}
            >
              <Clock className="w-3 h-3" />
              Due {fmtDateTime(assignment.dueDate)}
              {isUrgent && " · due soon"}
            </span>
            {maxScore && (
              <span className="inline-flex items-center gap-1">
                <Target className="w-3 h-3" /> Max {maxScore}
              </span>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          {isGraded && score != null ? (
            <>
              <p className="text-lg font-black text-success leading-none">
                {fmtScore(score)}
              </p>
              <p className="text-[10px] font-mono opacity-60 mt-0.5">
                / {maxScore ?? "—"}
              </p>
              {percent !== null && (
                <p className="text-[10px] font-mono opacity-50">{percent}%</p>
              )}
            </>
          ) : hasSubmission ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-info">
              <Send className="w-3 h-3" /> Sent
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-warning">
              <Clock className="w-3 h-3" /> Pending
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 opacity-40 transition-transform mt-1 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-base-300 pt-3">
          {assignment.description && (
            <div>
              <p className="text-[10px] uppercase font-black tracking-wider opacity-55 mb-1">
                Description
              </p>
              <p className="text-xs opacity-80 whitespace-pre-wrap">
                {assignment.description}
              </p>
            </div>
          )}

          {/* Submission preview */}
          {hasSubmission && submission && (
            <div className="p-3 rounded-xl bg-base-200/40 border border-base-300 space-y-2">
              <p className="text-[10px] uppercase font-black tracking-wider opacity-55 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Your submission
                {submission.submittedAt && (
                  <span className="ml-auto font-mono normal-case opacity-60">
                    {fmtDateTime(submission.submittedAt)}
                  </span>
                )}
              </p>
              {submission.submissionText && (
                <p className="text-xs opacity-80 whitespace-pre-wrap">
                  {submission.submissionText}
                </p>
              )}
              {submission.attachmentUrl && (
                <a
                  href={submission.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <Link2 className="w-3 h-3" /> Open attachment
                </a>
              )}
            </div>
          )}

          {/* Grade + feedback */}
          {isGraded && (
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 space-y-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-success" />
                <p className="text-xs font-black text-success">
                  Score: {fmtScore(score)}
                  {maxScore ? ` / ${maxScore}` : ""}
                  {percent !== null && ` · ${percent}%`}
                </p>
                {submission?.gradedAt && (
                  <span className="ml-auto text-[10px] font-mono opacity-55">
                    {fmtDate(submission.gradedAt)}
                  </span>
                )}
              </div>
              {submission?.teacherFeedback && (
                <div className="flex items-start gap-1.5">
                  <MessageSquareQuote className="w-3 h-3 mt-0.5 shrink-0 text-success/70" />
                  <p className="text-[11px] italic opacity-80">
                    "{submission.teacherFeedback}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Returned feedback */}
          {status === "Returned" && submission?.teacherFeedback && (
            <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/20 text-secondary text-[11px] flex items-start gap-2">
              <RefreshCw className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-black mb-1">Returned for resubmission</p>
                <p className="italic opacity-80">"{submission.teacherFeedback}"</p>
              </div>
            </div>
          )}

          {/* Action */}
          <div className="flex gap-2 pt-1">
            {!isGraded && (
              <button
                onClick={() => onOpenSubmit(assignment, submission)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-[11px] font-black uppercase tracking-wider cursor-pointer hover:opacity-90 transition"
                style={{ backgroundColor: primaryColor }}
              >
                {hasSubmission ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" /> Update submission
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Submit now
                  </>
                )}
              </button>
            )}
            {isGraded && (
              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-success/10 text-success text-[11px] font-black uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" /> Graded
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
type FilterTab = "all" | "pending" | "submitted" | "graded";

export default function StudentHomework() {
  const [tab, setTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [submitTarget, setSubmitTarget] = useState<{
    assignment: Assignment;
    submission?: Submission | null;
  } | null>(null);

  /* ── 1. Identity chain ── */
  const {
    data: profileData,
    isLoading: loadingProfile,
    isError: profileError,
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

  /* ── 2. School, term, subjects ── */
  const { data: school } = useGetSchoolByIdQuery(schoolId as string, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId as string, {
    skip: !schoolId,
  });
  const currentTerm: any = (currentTermData as any)?.data ?? (currentTermData as any)?.term;

  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId as string, {
    skip: !schoolId,
  });

  const subjectsMap = useMemo(() => {
    const m = new Map<string, any>();
    extractSubjects(subjectsData).forEach((s: any) => {
      if (s?.id) m.set(s.id, s);
    });
    return m;
  }, [subjectsData]);

  const subjectNameOf = (id?: string) =>
    (id ? subjectsMap.get(id)?.name ?? subjectsMap.get(id)?.code ?? "Subject" : "Subject");

  /* ── 3. Data ── */
  const {
    data: assignmentsData,
    isLoading: loadingAssignments,
    isError: assignmentsError,
    error: assignmentsErr,
    refetch: refetchAssignments,
  } = useGetAssignmentsByClassQuery({ classId: classId! }, { skip: !classId });

  const {
    data: submissionsData,
    isLoading: loadingSubmissions,
    refetch: refetchSubmissions,
  } = useGetSubmissionsByStudentQuery(studentId as string, { skip: !studentId });

  const { data: summaryData } = useGetStudentHomeworkSummaryQuery(
    { studentId: studentId! },
    { skip: !studentId }
  );

  const assignments = useMemo(() => extractAssignments(assignmentsData), [assignmentsData]);
  const submissions = useMemo(() => extractSubmissions(submissionsData), [submissionsData]);
  const summary: any = (summaryData as any)?.summary ?? (summaryData as any)?.data?.summary ?? {};

  const submissionByAssignment = useMemo(() => {
    const m = new Map<string, Submission>();
    submissions.forEach((s) => m.set(s.assignmentId, s));
    return m;
  }, [submissions]);

  /* ── 4. Merge + filter ── */
  type MergedRow = {
    assignment: Assignment;
    submission?: Submission | null;
    status: SubmissionStatus;
  };

  const merged: MergedRow[] = useMemo(() => {
    return assignments
      .map((a) => {
        const sub = submissionByAssignment.get(a.id);
        const { status } = effectiveStatus(a, sub);
        return { assignment: a, submission: sub, status };
      })
      .sort((a, b) => {
        const rank = (r: MergedRow) => {
          if (r.status === "Pending" || r.status === "Overdue" || r.status === "Returned")
            return 0;
          if (r.status === "Submitted" || r.status === "Late") return 1;
          return 2;
        };
        const dr = rank(a) - rank(b);
        if (dr !== 0) return dr;
        return (a.assignment.dueDate ?? "").localeCompare(b.assignment.dueDate ?? "");
      });
  }, [assignments, submissionByAssignment]);

  const counts = useMemo(() => {
    let pending = 0;
    let submitted = 0;
    let graded = 0;
    merged.forEach((r) => {
      if (r.status === "Graded") graded++;
      else if (r.status === "Submitted" || r.status === "Late") submitted++;
      else pending++;
    });
    return { pending, submitted, graded, total: merged.length };
  }, [merged]);

  const filtered = useMemo(() => {
    let list = merged;
    if (tab === "pending")
      list = list.filter(
        (r) =>
          r.status === "Pending" ||
          r.status === "Overdue" ||
          r.status === "Returned"
      );
    else if (tab === "submitted")
      list = list.filter(
        (r) => r.status === "Submitted" || r.status === "Late"
      );
    else if (tab === "graded")
      list = list.filter((r) => r.status === "Graded");

    if (subjectFilter)
      list = list.filter((r) => r.assignment.subjectId === subjectFilter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const subj = subjectNameOf(r.assignment.subjectId).toLowerCase();
        return (
          r.assignment.title.toLowerCase().includes(q) ||
          (r.assignment.description ?? "").toLowerCase().includes(q) ||
          subj.includes(q)
        );
      });
    }
    return list;
  }, [merged, tab, subjectFilter, search, subjectsMap]);

  /* ── 5. Labels ── */
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

  /* ── 6. Gates ── */
  const resolving =
    loadingProfile || (!studentId && (loadingStudent || loadingFull));

  if (resolving) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-40 rounded-3xl bg-base-200/60" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-base-200/60" />
          ))}
        </div>
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

  if (!classId) {
    return (
      <div className={`${CARD} max-w-xl mx-auto text-center space-y-3`}>
        <School className="w-10 h-10 mx-auto text-primary" />
        <p className="text-base font-black">You haven't been assigned to a class yet.</p>
        <p className="text-xs opacity-60">
          Your homework will appear here once your class is set up.
        </p>
      </div>
    );
  }

  const isLoading = loadingAssignments || loadingSubmissions;
  const avgScore = summary.averageScore ?? summary.averagePercentage;

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
            className="w-20 h-20 rounded-3xl text-white grid place-items-center shadow-lg shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <BookOpenCheck className="w-9 h-9" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-black opacity-55 mb-1">
              My Homework
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

        {/* Stats strip */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <StatTile
            icon={ClipboardList}
            label="Total"
            value={counts.total}
            sub="assignments"
          />
          <StatTile
            icon={Clock}
            label="Pending"
            value={counts.pending}
            tone="text-warning"
            bg="bg-warning/10"
          />
          <StatTile
            icon={Send}
            label="Submitted"
            value={counts.submitted}
            tone="text-info"
            bg="bg-info/10"
          />
          <StatTile
            icon={Award}
            label="Avg. score"
            value={avgScore != null ? `${fmtScore(avgScore)}%` : "—"}
            tone="text-success"
            bg="bg-success/10"
            sub={`${counts.graded} graded`}
          />
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className={`${CARD} !p-4 sm:!p-5 space-y-3`}>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All", counts.total],
              ["pending", "Pending", counts.pending],
              ["submitted", "Submitted", counts.submitted],
              ["graded", "Graded", counts.graded],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                tab === id
                  ? "text-white shadow-md"
                  : "bg-base-100 border border-base-300 hover:bg-base-200"
              }`}
              style={tab === id ? { backgroundColor: primaryColor } : {}}
            >
              {label}
              <span
                className={`min-w-[18px] px-1 rounded-full text-[9px] font-black ${
                  tab === id ? "bg-white/25 text-white" : "bg-base-300/60"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, description or subject…"
              className="w-full pl-9 pr-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {subjectsMap.size > 0 && (
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer"
            >
              <option value="">All subjects</option>
              {[...subjectsMap.values()].map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? s.code}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => {
              refetchAssignments();
              refetchSubmissions();
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 text-[10px] font-black uppercase cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* ── LIST ── */}
      {isLoading ? (
        <div className="p-16 text-center text-sm opacity-60">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
          Loading homework…
        </div>
      ) : assignmentsError ? (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">
            {errMsg(assignmentsErr, "Could not load homework.")}
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${CARD} text-center space-y-3 py-12`}>
          <BookOpen className="w-10 h-10 mx-auto opacity-40" />
          <p className="text-sm font-black">
            {merged.length === 0 ? "No homework yet" : "No homework matches your filter"}
          </p>
          <p className="text-xs opacity-60 max-w-sm mx-auto">
            {merged.length === 0
              ? "Your teachers haven't assigned any homework. Check back soon."
              : "Try clearing filters or switching tabs."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((row) => (
            <AssignmentCard
              key={row.assignment.id}
              assignment={row.assignment}
              submission={row.submission}
              subjectName={subjectNameOf(row.assignment.subjectId)}
              primaryColor={primaryColor}
              onOpenSubmit={(a, s) => setSubmitTarget({ assignment: a, submission: s })}
            />
          ))}
        </div>
      )}

      {/* ── INFO FOOTER ── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-base-200/40 border border-base-300 text-[11px] opacity-70">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Submissions can be updated until your teacher grades them. Late
          submissions are automatically flagged. Contact your teacher if you
          have trouble uploading an attachment.
        </span>
      </div>

      {/* ── SUBMIT MODAL ── */}
      {submitTarget && (
        <SubmitModal
          assignment={submitTarget.assignment}
          existingSubmission={submitTarget.submission}
          schoolId={schoolId ?? ""}
          studentId={studentId}
          primaryColor={primaryColor}
          onClose={() => setSubmitTarget(null)}
          onSubmitted={() => {
            refetchAssignments();
            refetchSubmissions();
          }}
        />
      )}
    </div>
  );
}