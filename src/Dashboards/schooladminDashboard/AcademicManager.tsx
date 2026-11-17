import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  GraduationCap, BookOpen, School, Link2, Sparkles, Building,
  Layers, Edit3, Trash2, CheckCircle2, AlertCircle,
  ArrowUp, ArrowDown, X, Save, ShieldCheck, Users, UserCheck,
  Search, Loader2, Calendar,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';

// ── Academic structure API ─────────────────────────────────────
import {
  useGetGradeLevelsBySchoolQuery,
  useCreateGradeLevelMutation,
  useUpdateGradeLevelMutation,
  useDeleteGradeLevelMutation,
  useReorderGradeLevelsMutation,
  useValidatePromotionLadderQuery,
  useGetSubjectsBySchoolQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useGetClassesBySchoolQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useCountClassStudentsQuery,
  useCheckClassCapacityQuery,
  useLinkStudentMutation,
  type GradeLevel,
  type Subject,
  type ClassEntity,
} from '../../features/Apis/academicStructure.Api';

// ── Terms API ─────────────────────────────────────────────────
import {
  useGetTermsBySchoolIdQuery,
  useGetCurrentTermBySchoolIdQuery,
  type AcademicTerm,
} from '../../features/Apis/academicStructure.Api';

// ── Users API (teachers) ──────────────────────────────────────
// We import TWO hooks so teacher-fetch is robust:
//   1. useGetTeachersBySchoolQuery  → GET /users/teachers?schoolId=...
//   2. useGetSchoolUsersByRoleQuery → GET /schools/{id}/users/by-role/teacher
// If one endpoint is missing on the backend, the other still works.
import {
  useGetTeachersBySchoolQuery,
  useGetSchoolUsersByRoleQuery,
} from '../../features/Apis/Users.Api';

type TeacherUser = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tscNumber?: string;
  phone?: string;
  avatarUrl?: string;
  [key: string]: any;
};

// ── Students API ──────────────────────────────────────────────
import {
  useGetStudentsBySchoolQuery,
  type Student,
} from '../../features/Apis/students.Api';

type Tab = 'grades' | 'subjects' | 'classes' | 'linking';

const STAGES = ['Pre-Primary', 'Lower Primary', 'Upper Primary', 'Junior Secondary', 'Senior Secondary'];
const SUBJECT_CATEGORIES = ['Core', 'Elective', 'Optional', 'Co-curricular'];

export default function AcademicManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('grades');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      {/* ─────────── HEADER ─────────── */}
      <div
        className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-8 sm:p-10 rounded-3xl border shadow-sm"
        style={{ borderColor: `${secondaryColor}40` }}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: secondaryColor }}
            >
              <Sparkles className="w-3.5 h-3.5" /> Academic Structure
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Academic Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Configure grade levels, subjects, classes, and student enrollments for {schoolName}.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <School className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Institution</p>
              <p className="text-lg font-black text-primary truncate max-w-[200px]">{schoolName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────── TABS ─────────── */}
      <div className="flex flex-wrap gap-3 border-b border-base-300 pb-4">
        {[
          { id: 'grades' as Tab, label: 'Grade Levels', icon: GraduationCap },
          { id: 'subjects' as Tab, label: 'Subjects', icon: BookOpen },
          { id: 'classes' as Tab, label: 'Classes', icon: School },
          { id: 'linking' as Tab, label: 'Student Linking', icon: Link2 },
        ].map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSuccessMessage(''); setErrorMessage(''); }}
              className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                active
                  ? 'bg-primary text-primary-content shadow-lg shadow-primary/20'
                  : 'bg-base-200/50 hover:bg-base-200 opacity-75'
              }`}
              style={active ? { borderBottom: `4px solid ${secondaryColor}` } : {}}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {/* ─────────── ALERTS ─────────── */}
      {successMessage && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold flex-1">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─────────── CONTENT ─────────── */}
      {activeTab === 'grades' && (
        <GradeLevelsSection
          schoolId={currentSchoolId}
          schoolName={schoolName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'subjects' && (
        <SubjectsSection
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'classes' && (
        <ClassesSection
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'linking' && (
        <StudentLinkingSection
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// UTILS — normalize teacher/student shapes from various responses
// ════════════════════════════════════════════════════════════════
function extractTeachers(data: any): TeacherUser[] {
  if (!data) return [];
  const raw = data.data ?? data.teachers ?? data.users ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractStudents(data: any): Student[] {
  if (!data) return [];
  const raw = data.students ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function teacherLabel(t: TeacherUser): string {
  const name = t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || 'Unnamed';
  const id = t.tscNumber ? ` · TSC ${t.tscNumber}` : t.email ? ` · ${t.email}` : '';
  return `${name}${id}`;
}

function teacherInitials(t: TeacherUser): string {
  const name = t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function studentLabel(s: Student): string {
  const name = `${s.firstName ?? ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName ?? ''}`.trim() || 'Unnamed';
  const adm = s.admissionNumber ? ` · ${s.admissionNumber}` : '';
  return `${name}${adm}`;
}

// ════════════════════════════════════════════════════════════════
// GRADE LEVELS
// ════════════════════════════════════════════════════════════════
function GradeLevelsSection({
  schoolId, schoolName, primaryColor, secondaryColor,
  setSuccessMessage, setErrorMessage,
}: SectionProps & { schoolName: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', sortOrder: '', educationStage: 'Upper Primary',
    nextGradeLevelId: '', isFinalGrade: false,
  });

  const { data: gradesData, isLoading, error } = useGetGradeLevelsBySchoolQuery(schoolId);
  const { data: ladderData } = useValidatePromotionLadderQuery(schoolId);

  const [createGradeLevel, { isLoading: creating }] = useCreateGradeLevelMutation();
  const [updateGradeLevel, { isLoading: updating }] = useUpdateGradeLevelMutation();
  const [deleteGradeLevel] = useDeleteGradeLevelMutation();
  const [reorderGradeLevels] = useReorderGradeLevelsMutation();

  const grades: GradeLevel[] = useMemo(() => {
    const raw = (gradesData as any)?.gradeLevels ?? (gradesData as any)?.data ?? [];
    return Array.isArray(raw) ? [...raw].sort((a, b) => a.sortOrder - b.sortOrder) : [];
  }, [gradesData]);

  const resetForm = () => {
    setForm({ name: '', sortOrder: '', educationStage: 'Upper Primary', nextGradeLevelId: '', isFinalGrade: false });
    setIsEditing(false); setEditingId(null);
  };
  const handleEdit = (g: GradeLevel) => {
    setForm({
      name: g.name, sortOrder: String(g.sortOrder),
      educationStage: g.educationStage,
      nextGradeLevelId: g.nextGradeLevelId ?? '',
      isFinalGrade: g.isFinalGrade,
    });
    setIsEditing(true); setEditingId(g.id);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!form.name.trim()) return setErrorMessage('Grade level name is required.');
    if (!form.sortOrder || isNaN(Number(form.sortOrder)))
      return setErrorMessage('Sort order must be a valid number.');
    const payload = {
      schoolId, name: form.name.trim(), sortOrder: Number(form.sortOrder),
      educationStage: form.educationStage,
      nextGradeLevelId: form.nextGradeLevelId || null,
      isFinalGrade: form.isFinalGrade,
    };
    try {
      if (isEditing && editingId) {
        await updateGradeLevel({ id: editingId, patch: payload }).unwrap();
        setSuccessMessage(`Successfully updated grade level: ${payload.name}`);
      } else {
        await createGradeLevel(payload).unwrap();
        setSuccessMessage(`Successfully created grade level: ${payload.name}`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed.');
    }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete grade level "${name}"? This cannot be undone.`)) return;
    try {
      await deleteGradeLevel(id).unwrap();
      setSuccessMessage(`"${name}" deleted successfully.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };
  const handleMove = async (id: string, dir: -1 | 1) => {
    const ordered = [...grades].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = ordered.findIndex((g) => g.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= ordered.length) return;
    [ordered[idx], ordered[swap]] = [ordered[swap], ordered[idx]];
    try {
      await reorderGradeLevels({ schoolId, orderedIds: ordered.map((g) => g.id) }).unwrap();
      setSuccessMessage('Grade levels reordered.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Reorder failed.');
    }
  };
  const finalGrade = grades.find((g) => g.isFinalGrade);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><GraduationCap className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Grade Level' : 'Add New Grade Level'}</h2>
          </div>
          {isEditing && (
            <button onClick={resetForm} className="text-xs text-error font-bold hover:underline">Cancel Edit</button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">School</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary"><Building className="w-4 h-4" /></span>
              <input type="text" value={schoolName} disabled className="w-full pl-10 pr-3 py-3 bg-base-300/50 border border-base-300 rounded-2xl text-xs font-bold opacity-80 cursor-not-allowed" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Grade 5" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} placeholder="5" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Education Stage</label>
            <select value={form.educationStage} onChange={(e) => setForm({ ...form, educationStage: e.target.value })} className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Next Grade (Promotion Target)</label>
            <select value={form.nextGradeLevelId} onChange={(e) => setForm({ ...form, nextGradeLevelId: e.target.value })} className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
              <option value="">None</option>
              {grades.filter((g) => g.id !== editingId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold cursor-pointer">
            <input type="checkbox" checked={form.isFinalGrade} onChange={(e) => setForm({ ...form, isFinalGrade: e.target.checked })} className="checkbox checkbox-primary checkbox-xs" />
            Mark as final grade (no promotion)
          </label>
          <button type="submit" disabled={creating || updating} className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
            {creating || updating ? 'Saving...' : isEditing ? 'Update Grade Level' : 'Create Grade Level'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><Layers className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Grade Levels</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{grades.length} levels</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Total" value={grades.length} tone="primary" />
          <MiniStat label="Ladder" value={(ladderData as any)?.valid === false ? 'Review' : 'Valid'} tone="success" />
          <MiniStat label="Final Grade" value={finalGrade?.name ?? '—'} tone="warning" />
        </div>

        <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
          {isLoading ? <div className="p-8 text-center text-xs opacity-60">Loading grade levels...</div>
            : error ? <div className="p-8 text-center text-xs text-error">Failed to load grade levels.</div>
            : grades.length === 0 ? <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">No grade levels yet. Create your first one on the left.</div>
            : grades.map((g) => (
              <div key={g.id} className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-base-200 rounded">#{g.sortOrder}</span>
                    <h3 className="font-black text-sm text-primary">{g.name}</h3>
                    {g.isFinalGrade && <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-extrabold uppercase rounded-lg">Final</span>}
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-lg">{g.educationStage}</span>
                  </div>
                  <p className="text-xs font-mono opacity-70">Next: {grades.find((x) => x.id === g.nextGradeLevelId)?.name ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button onClick={() => handleMove(g.id, -1)} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all" title="Move up"><ArrowUp className="w-4 h-4" /></button>
                  <button onClick={() => handleMove(g.id, 1)} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all" title="Move down"><ArrowDown className="w-4 h-4" /></button>
                  <button onClick={() => handleEdit(g)} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(g.id, g.name)} className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SUBJECTS
// ════════════════════════════════════════════════════════════════
function SubjectsSection({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', category: 'Core' });

  const { data: subjectsData, isLoading, error } = useGetSubjectsBySchoolQuery(schoolId);
  const [createSubject, { isLoading: creating }] = useCreateSubjectMutation();
  const [updateSubject, { isLoading: updating }] = useUpdateSubjectMutation();
  const [deleteSubject] = useDeleteSubjectMutation();

  const subjects: Subject[] = useMemo(() => {
    const raw = (subjectsData as any)?.subjects ?? (subjectsData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [subjectsData]);

  const resetForm = () => { setForm({ name: '', code: '', category: 'Core' }); setIsEditing(false); setEditingId(null); };
  const handleEdit = (s: Subject) => { setForm({ name: s.name, code: s.code, category: s.category }); setIsEditing(true); setEditingId(s.id); };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!form.name.trim()) return setErrorMessage('Subject name is required.');
    if (!form.code.trim()) return setErrorMessage('Subject code is required.');
    const payload = { schoolId, name: form.name.trim(), code: form.code.trim().toUpperCase(), category: form.category };
    try {
      if (isEditing && editingId) {
        await updateSubject({ id: editingId, patch: payload }).unwrap();
        setSuccessMessage(`Successfully updated subject: ${payload.name}`);
      } else {
        await createSubject(payload).unwrap();
        setSuccessMessage(`Successfully created subject: ${payload.name}`);
      }
      resetForm();
    } catch (err: any) { setErrorMessage(err?.data?.message || 'Operation failed.'); }
  };
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete subject "${name}"?`)) return;
    try { await deleteSubject(id).unwrap(); setSuccessMessage(`"${name}" deleted successfully.`); }
    catch (err: any) { setErrorMessage(err?.data?.message || 'Delete failed.'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><BookOpen className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
          </div>
          {isEditing && <button onClick={resetForm} className="text-xs text-error font-bold hover:underline">Cancel Edit</button>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Subject Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Code</label>
              <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="MAT" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono uppercase" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                {SUBJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" disabled={creating || updating} className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
            {creating || updating ? 'Saving...' : isEditing ? 'Update Subject' : 'Create Subject'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><BookOpen className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">All Subjects</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{subjects.length} subjects</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {isLoading ? <div className="col-span-2 p-8 text-center text-xs opacity-60">Loading subjects...</div>
            : error ? <div className="col-span-2 p-8 text-center text-xs text-error">Failed to load subjects.</div>
            : subjects.length === 0 ? <div className="col-span-2 p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">No subjects yet. Add your first one on the left.</div>
            : subjects.map((s) => (
              <div key={s.id} className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm text-primary">{s.name}</h3>
                    <p className="mt-1 text-[11px] font-mono font-bold opacity-60 tracking-wide">{s.code}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg ${s.category === 'Core' ? 'bg-primary/10 text-primary' : 'bg-base-300 text-base-content/70'}`}>{s.category}</span>
                </div>
                <div className="mt-4 flex justify-end gap-1.5">
                  <button onClick={() => handleEdit(s)} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(s.id, s.name)} className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CLASSES — robust teacher picker (multi-endpoint fallback)
// ════════════════════════════════════════════════════════════════
function ClassesSection({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    gradeLevelId: '', stream: '', academicYear: String(new Date().getFullYear()),
    classTeacherId: '', capacity: '40',
  });
  const [teacherSearch, setTeacherSearch] = useState('');

  const { data: classesData, isLoading, error } = useGetClassesBySchoolQuery(schoolId);
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId);

  // ── Teachers: try BOTH endpoints; whichever returns data wins ──
  const {
    data: teachersBySchoolData,
    isLoading: loadingTeachersBySchool,
  } = useGetTeachersBySchoolQuery(schoolId);

  const {
    data: teachersByRoleData,
    isLoading: loadingTeachersByRole,
  } = useGetSchoolUsersByRoleQuery(
    { schoolId, role: 'teacher' },
    { skip: !schoolId }
  );

  const loadingTeachers = loadingTeachersBySchool && loadingTeachersByRole;

  const [createClass, { isLoading: creating }] = useCreateClassMutation();
  const [updateClass, { isLoading: updating }] = useUpdateClassMutation();
  const [deleteClass] = useDeleteClassMutation();

  const grades: GradeLevel[] = useMemo(() => {
    const raw = (gradesData as any)?.gradeLevels ?? (gradesData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [gradesData]);

  // Combine both sources — dedupe by id, prefer first non-empty result
  const teachers: TeacherUser[] = useMemo(() => {
    const primary = extractTeachers(teachersBySchoolData);
    if (primary.length > 0) return primary;
    return extractTeachers(teachersByRoleData);
  }, [teachersBySchoolData, teachersByRoleData]);

  const teacherMap = useMemo(() => {
    const m = new Map<string, TeacherUser>();
    teachers.forEach((t) => m.set(t.id, t));
    return m;
  }, [teachers]);

  // Filter teacher dropdown by search
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = (t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || '').toLowerCase();
      const tsc = (t.tscNumber ?? '').toLowerCase();
      const email = (t.email ?? '').toLowerCase();
      return name.includes(q) || tsc.includes(q) || email.includes(q);
    });
  }, [teachers, teacherSearch]);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === form.classTeacherId) ?? null,
    [teachers, form.classTeacherId]
  );

  const classes: ClassEntity[] = useMemo(() => {
    const raw = (classesData as any)?.classes ?? (classesData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [classesData]);

  const resetForm = () => {
    setForm({ gradeLevelId: '', stream: '', academicYear: String(new Date().getFullYear()), classTeacherId: '', capacity: '40' });
    setTeacherSearch('');
    setIsEditing(false); setEditingId(null);
  };
  const handleEdit = (c: ClassEntity) => {
    setForm({
      gradeLevelId: c.gradeLevelId, stream: c.stream, academicYear: c.academicYear,
      classTeacherId: c.classTeacherId ?? '', capacity: String(c.capacity),
    });
    setTeacherSearch('');
    setIsEditing(true); setEditingId(c.id);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!form.gradeLevelId) return setErrorMessage('Please select a grade level.');
    if (!form.stream.trim()) return setErrorMessage('Stream is required.');
    if (!form.academicYear.trim()) return setErrorMessage('Academic year is required.');
    if (!form.capacity || isNaN(Number(form.capacity)))
      return setErrorMessage('Capacity must be a valid number.');
    const payload = {
      schoolId, gradeLevelId: form.gradeLevelId, stream: form.stream.trim(),
      academicYear: form.academicYear.trim(),
      classTeacherId: form.classTeacherId || null,
      capacity: Number(form.capacity),
    };
    try {
      if (isEditing && editingId) {
        await updateClass({ id: editingId, patch: payload }).unwrap();
        setSuccessMessage(`Successfully updated class: ${payload.stream}`);
      } else {
        await createClass(payload).unwrap();
        setSuccessMessage(`Successfully created class: ${payload.stream}`);
      }
      resetForm();
    } catch (err: any) { setErrorMessage(err?.data?.message || 'Operation failed.'); }
  };
  const handleDelete = async (id: string, stream: string) => {
    if (!window.confirm(`Delete class "${stream}"?`)) return;
    try { await deleteClass(id).unwrap(); setSuccessMessage(`"${stream}" deleted successfully.`); }
    catch (err: any) { setErrorMessage(err?.data?.message || 'Delete failed.'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><School className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Class' : 'Add New Class'}</h2>
          </div>
          {isEditing && <button onClick={resetForm} className="text-xs text-error font-bold hover:underline">Cancel Edit</button>}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Grade Level</label>
            <select value={form.gradeLevelId} onChange={(e) => setForm({ ...form, gradeLevelId: e.target.value })} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
              <option value="">-- Choose grade level --</option>
              {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Stream</label>
              <input type="text" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} placeholder="East" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Academic Year</label>
              <input type="text" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2026" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Capacity</label>
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} placeholder="40" required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider opacity-70">
                <span className="flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Class Teacher</span>
                <span className="font-mono normal-case opacity-60">
                  {loadingTeachers ? '…' : `${teachers.length} available`}
                </span>
              </label>

              {!loadingTeachers && teachers.length === 0 && (
                <p className="text-[10px] text-warning font-mono px-1 mb-1">
                  ⚠ No teachers found. Create teachers in User Manager first.
                </p>
              )}

              {teachers.length > 15 && (
                <input
                  type="text"
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  placeholder="Filter teachers by name, TSC, or email…"
                  className="mb-1 w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              )}

              <select
                value={form.classTeacherId}
                onChange={(e) => setForm({ ...form, classTeacherId: e.target.value })}
                disabled={loadingTeachers}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-60"
              >
                <option value="">
                  {loadingTeachers
                    ? 'Loading teachers…'
                    : filteredTeachers.length === 0 && teachers.length > 0
                    ? 'No teachers match filter'
                    : '— No teacher assigned —'}
                </option>
                {filteredTeachers.map((t) => (
                  <option key={t.id} value={t.id}>{teacherLabel(t)}</option>
                ))}
              </select>

              {/* Selected teacher preview card */}
              {selectedTeacher && (
                <div className="mt-2 flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-xs">
                    {teacherInitials(selectedTeacher)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black truncate">
                      {selectedTeacher.name || [selectedTeacher.firstName, selectedTeacher.lastName].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-[10px] font-mono opacity-60 truncate">
                      {selectedTeacher.tscNumber ? `TSC ${selectedTeacher.tscNumber}` : selectedTeacher.email ?? '—'}
                      {selectedTeacher.phone ? ` · ${selectedTeacher.phone}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={creating || updating} className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4" style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}>
            {creating || updating ? 'Saving...' : isEditing ? 'Update Class' : 'Create Class'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}><School className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">All Classes</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{classes.length} classes · {teachers.length} teachers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
          {isLoading ? <div className="col-span-2 p-8 text-center text-xs opacity-60">Loading classes...</div>
            : error ? <div className="col-span-2 p-8 text-center text-xs text-error">Failed to load classes.</div>
            : classes.length === 0 ? <div className="col-span-2 p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">No classes yet. Create one on the left.</div>
            : classes.map((c) => (
              <ClassCard
                key={c.id}
                cls={c}
                gradeName={grades.find((g) => g.id === c.gradeLevelId)?.name ?? '—'}
                teacherName={c.classTeacherId ? (teacherMap.get(c.classTeacherId)?.name ?? 'Unknown teacher') : null}
                onEdit={() => handleEdit(c)}
                onDelete={() => handleDelete(c.id, c.stream)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  cls, gradeName, teacherName, onEdit, onDelete,
}: {
  cls: ClassEntity; gradeName: string; teacherName: string | null;
  onEdit: () => void; onDelete: () => void;
}) {
  const { data: countData } = useCountClassStudentsQuery(cls.id);
  const { data: capacityData } = useCheckClassCapacityQuery(cls.id);
  const count = (countData as any)?.count ?? 0;
  const pct = Math.min(100, (count / Math.max(1, cls.capacity)) * 100);

  return (
    <div className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-black text-sm text-primary">{gradeName} — {cls.stream}</h3>
          <p className="mt-0.5 text-[11px] font-mono opacity-60">Year {cls.academicYear}</p>
        </div>
        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-lg">{cls.stream}</span>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[11px]">
        <UserCheck className="w-3.5 h-3.5 text-primary/70" />
        <span className={teacherName ? 'font-bold opacity-80' : 'italic opacity-50'}>
          {teacherName ?? 'No teacher assigned'}
        </span>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-[11px] font-bold opacity-70">
          <span>Enrollment</span>
          <span>{count} / {cls.capacity}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-base-200 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-error' : pct >= 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${pct}%` }} />
        </div>
        {(capacityData as any)?.message && <p className="text-[10px] opacity-60">{(capacityData as any).message}</p>}
      </div>

      <div className="mt-4 flex justify-end gap-1.5">
        <button onClick={onEdit} className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// STUDENT LINKING — with term dropdown
// ════════════════════════════════════════════════════════════════
function StudentLinkingSection({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [form, setForm] = useState({
    studentId: '',
    rawStudentId: '',
    classId: '',
    termId: '',
    requireUnplaced: true,
  });
  const [studentSearch, setStudentSearch] = useState('');

  const { data: classesData } = useGetClassesBySchoolQuery(schoolId);
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId);

  const { data: studentsData, isLoading: loadingStudents } = useGetStudentsBySchoolQuery(schoolId);

  const { data: termsData, isLoading: loadingTerms } = useGetTermsBySchoolIdQuery(schoolId, { skip: !schoolId });
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(schoolId, { skip: !schoolId });

  const [linkStudent, { isLoading }] = useLinkStudentMutation();

  const grades: GradeLevel[] = useMemo(() => {
    const raw = (gradesData as any)?.gradeLevels ?? (gradesData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [gradesData]);

  const students: Student[] = useMemo(() => extractStudents(studentsData), [studentsData]);

  const terms: AcademicTerm[] = useMemo(() => {
    const list = termsData?.terms ?? [];
    return [...list].sort((a, b) => {
      if (a.academicYear !== b.academicYear) return b.academicYear.localeCompare(a.academicYear);
      return a.termName.localeCompare(b.termName);
    });
  }, [termsData]);

  const currentTerm: AcademicTerm | null = currentTermData?.term ?? null;

  const selectedTerm = useMemo(
    () => terms.find((t) => t.id === form.termId) ?? null,
    [terms, form.termId],
  );

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName ?? ''} ${s.middleName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
      return name.includes(q) || (s.admissionNumber ?? '').toLowerCase().includes(q);
    });
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === form.studentId) ?? null,
    [students, form.studentId],
  );

  const classes = useMemo(() => {
    const raw = (classesData as any)?.classes ?? (classesData as any)?.data ?? [];
    return (Array.isArray(raw) ? raw : []).map((c: ClassEntity) => ({
      value: c.id,
      label: `${grades.find((g) => g.id === c.gradeLevelId)?.name ?? '—'} — ${c.stream} (${c.academicYear})`,
    }));
  }, [classesData, grades]);

  const effectiveStudentId = form.rawStudentId.trim() || form.studentId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!effectiveStudentId) return setErrorMessage('Please pick a student (or enter a raw ID).');
    if (!form.classId) return setErrorMessage('Please select a target class.');

    try {
      const res = await linkStudent({
        studentId: effectiveStudentId,
        classId: form.classId,
        requireUnplaced: form.requireUnplaced || undefined,
        termId: form.termId || undefined,
      }).unwrap();
      setSuccessMessage((res as any)?.message || 'Student linked successfully.');
      setForm({ studentId: '', rawStudentId: '', classId: '', termId: '', requireUnplaced: true });
      setStudentSearch('');
    } catch (err: any) {
      const msg = err?.data?.message ??
        (Array.isArray(err?.data?.errors)
          ? err.data.errors.map((x: any) => x.message).join(', ')
          : 'Linking failed.');
      setErrorMessage(msg);
    }
  };

  const fillScenario = (s: 'link' | 'relink' | 'transfer' | 'term' | 'cross' | 'invalid') => {
    setSuccessMessage(''); setErrorMessage('');
    switch (s) {
      case 'link':
      case 'relink':
        setForm((f) => ({ ...f, requireUnplaced: true, termId: '', rawStudentId: '', classId: classes[0]?.value ?? '' }));
        break;
      case 'transfer':
        setForm((f) => ({ ...f, requireUnplaced: false, termId: '', rawStudentId: '', classId: classes[1]?.value ?? '' }));
        break;
      case 'term': {
        const nonCurrent = terms.find((t) => !t.isCurrentTerm);
        const chosenId = nonCurrent?.id ?? currentTerm?.id ?? '';
        setForm((f) => ({ ...f, requireUnplaced: true, termId: chosenId }));
        break;
      }
      case 'cross':
        setForm((f) => ({ ...f, rawStudentId: f.studentId || f.rawStudentId, classId: '00000000-0000-0000-0000-000000000099' }));
        break;
      case 'invalid':
        setForm((f) => ({ ...f, rawStudentId: 'not-a-uuid', classId: 'also-not-a-uuid' }));
        break;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Link2 className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Link a Student to a Class</h2>
          </div>
          <button
            onClick={() => {
              setForm({ studentId: '', rawStudentId: '', classId: '', termId: '', requireUnplaced: true });
              setStudentSearch('');
            }}
            className="text-xs text-error font-bold hover:underline"
          >
            Reset
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ─── Student picker ─── */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
              <Users className="w-3.5 h-3.5" /> Student
              <span className="ml-auto font-mono normal-case opacity-60">{students.length} enrolled</span>
            </label>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                {loadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </span>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or admission number…"
                className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              disabled={loadingStudents}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-60"
            >
              <option value="">
                {loadingStudents
                  ? 'Loading students…'
                  : filteredStudents.length === 0
                  ? 'No matching students'
                  : `-- Choose from ${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'} --`}
              </option>
              {filteredStudents.slice(0, 200).map((s) => (
                <option key={s.id} value={s.id}>{studentLabel(s)}</option>
              ))}
            </select>

            {selectedStudent && (
              <div className="mt-2 flex items-center gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-2xl">
                <div className="w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-xs">
                  {(selectedStudent.firstName?.[0] ?? '?').toUpperCase()}
                  {(selectedStudent.lastName?.[0] ?? '').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate">
                    {selectedStudent.firstName} {selectedStudent.middleName ?? ''} {selectedStudent.lastName}
                  </p>
                  <p className="text-[10px] font-mono opacity-60 truncate">
                    ADM {selectedStudent.admissionNumber} · {selectedStudent.gender}
                    {selectedStudent.upiNumber ? ` · UPI ${selectedStudent.upiNumber}` : ''}
                  </p>
                </div>
              </div>
            )}

            <details className="text-xs mt-2">
              <summary className="cursor-pointer font-bold opacity-60 hover:opacity-100 select-none">
                Advanced — use raw UUID override
              </summary>
              <input
                type="text"
                value={form.rawStudentId}
                onChange={(e) => setForm({ ...form, rawStudentId: e.target.value })}
                placeholder="Paste a student UUID (overrides dropdown)"
                className="mt-2 w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </details>
          </div>

          {/* ─── Class picker ─── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Target Class</label>
            <select
              value={form.classId}
              onChange={(e) => setForm({ ...form, classId: e.target.value })}
              required
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose class --</option>
              {classes.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* ─── Academic Term dropdown ─── */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
              <Calendar className="w-3.5 h-3.5" /> Academic Term
              <span className="ml-auto font-mono normal-case opacity-60">
                {loadingTerms ? '…' : `${terms.length} available`}
              </span>
            </label>
            <select
              value={form.termId}
              onChange={(e) => setForm({ ...form, termId: e.target.value })}
              disabled={loadingTerms}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer disabled:opacity-60"
            >
              <option value="">
                {currentTerm
                  ? `Use current term — ${currentTerm.termName} (${currentTerm.academicYear})`
                  : 'Use current term (default)'}
              </option>
              {terms.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.termName} ({t.academicYear}){t.isCurrentTerm ? ' · current' : ''}
                </option>
              ))}
            </select>

            {selectedTerm && (
              <div className="mt-1 px-3 py-2 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="truncate">
                  {new Date(selectedTerm.startDate).toLocaleDateString()} → {new Date(selectedTerm.endDate).toLocaleDateString()}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                  selectedTerm.status === 'active'
                    ? 'bg-success/20 text-success'
                    : selectedTerm.status === 'upcoming'
                    ? 'bg-warning/20 text-warning'
                    : 'bg-base-300 text-base-content/70'
                }`}>
                  {selectedTerm.status}
                </span>
              </div>
            )}

            {!selectedTerm && currentTerm && (
              <p className="text-[10px] opacity-60 font-mono px-1">
                Defaults to current term: {currentTerm.termName} ({currentTerm.academicYear})
              </p>
            )}
            {!currentTerm && terms.length === 0 && !loadingTerms && (
              <p className="text-[10px] text-warning font-mono px-1">
                ⚠ No terms found — the backend will use its default term.
              </p>
            )}
          </div>

          <label className="flex items-center gap-2 px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={form.requireUnplaced}
              onChange={(e) => setForm({ ...form, requireUnplaced: e.target.checked })}
              className="checkbox checkbox-primary checkbox-xs"
            />
            Require student to be unplaced (recommended)
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4 disabled:opacity-70"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            {isLoading ? 'Linking…' : 'Link Student'}
          </button>
        </form>
      </div>

      {/* ─── Scenario playbook + tips ─── */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Scenario Playbook</h2>
          </div>
          <p className="text-xs opacity-70">One-click fill for the standard test cases.</p>
          <div className="space-y-2">
            {[
              { id: 'link',     label: '61a · Link unplaced student',      tone: 'bg-success/10 text-success' },
              { id: 'relink',   label: '61b · Re-link (should fail)',       tone: 'bg-error/10 text-error' },
              { id: 'transfer', label: '61c · Transfer between classes',    tone: 'bg-primary/10 text-primary' },
              { id: 'term',     label: '61d · Explicit termId',             tone: 'bg-warning/10 text-warning' },
              { id: 'cross',    label: '61e · Cross-school class',          tone: 'bg-error/10 text-error' },
              { id: 'invalid',  label: '61f · Invalid UUID',                tone: 'bg-base-300 text-base-content/70' },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => fillScenario(s.id as any)}
                className="flex w-full items-center justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-3 text-left text-xs font-bold hover:bg-base-200 transition-all cursor-pointer"
              >
                <span>{s.label}</span>
                <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg ${s.tone}`}>fill</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-3">
          <div className="flex items-center gap-3 pb-2">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Save className="w-5 h-5" /></div>
            <h2 className="text-lg font-black tracking-tight">Tips</h2>
          </div>
          <ul className="space-y-2 text-xs opacity-70">
            <li>• Students come from <span className="font-mono bg-base-300/50 px-1 rounded">studentApi</span>.</li>
            <li>• Teachers come from <span className="font-mono bg-base-300/50 px-1 rounded">usersApi</span>.</li>
            <li>• Terms come from <span className="font-mono bg-base-300/50 px-1 rounded">termApi</span>.</li>
            <li>• Leave term as <span className="font-mono">Use current term</span> for default linking.</li>
            <li>• Use <span className="font-mono">requireUnplaced=true</span> for safety.</li>
            <li>• Cross-school & invalid UUIDs return <span className="font-mono">400</span>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════════
type SectionProps = {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};

function MiniStat({ label, value, tone }: { label: string; value: string | number; tone: 'primary' | 'success' | 'warning' }) {
  const map = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[tone];
  return (
    <div className="p-3 bg-base-100 border border-base-300 rounded-2xl">
      <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-sm font-black truncate">{value}</span>
        <span className={`h-6 w-1 rounded-full ${map}`} />
      </div>
    </div>
  );
}