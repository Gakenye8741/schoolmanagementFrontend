import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  useGetStudentsBySchoolQuery,
  useGetStudentWithRelationsQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
  useEnrollStudentInClassMutation,
  useWithdrawStudentMutation,
  useReEnrollStudentMutation,
  usePromoteStudentMutation,
  useGraduateStudentMutation,
  useRepeatGradeMutation,
  useTransferOutStudentMutation,
  useBulkPromoteClassMutation,
  useAddGuardianMutation,
  useGetStudentGuardiansQuery,
  useSetPrimaryGuardianMutation,
  useRemoveGuardianMutation,
  useGetStudentEnrollmentsQuery,
  useGetCurrentEnrollmentQuery,
  useAddStudentDocumentMutation,
  useGetStudentDocumentsQuery,
  useAddHealthRecordMutation,
  useGetStudentHealthRecordsQuery,
  useGetGenderBreakdownQuery,
  useGetStudentStatisticsQuery,
} from '../../features/Apis/students.Api';
import { useGetClassesBySchoolIdQuery } from '../../features/Apis/Class.Api';
import { useGetSchoolUsersQuery } from '../../features/Apis/Users.Api';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  Users, PlusCircle, CheckCircle2, AlertCircle, Trash2, Sparkles, Building,
  RefreshCw, Eye, EyeOff, Wand2, X, Save, Loader2, Search, Pencil,
  FileText, Heart, GraduationCap, Calendar, MoreVertical, UserPlus,
  RotateCcw, Award, TrendingUp, ChevronRight, Ban, Archive, UserCheck,
  Link2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
};

const todayISO = () => new Date().toISOString().split('T')[0];
const inputCls =
  'w-full px-3.5 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition';

const extractList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.users)) return res.users;
  if (Array.isArray(res.students)) return res.students;
  if (Array.isArray(res.results)) return res.results;
  if (Array.isArray(res.guardians)) return res.guardians;
  if (res.data && typeof res.data === 'object') {
    if (Array.isArray(res.data.users)) return res.data.users;
    if (Array.isArray(res.data.students)) return res.data.students;
    if (Array.isArray(res.data.guardians)) return res.data.guardians;
  }
  return [];
};

const collectRoles = (u: any): string[] => {
  if (!u) return [];
  const out: string[] = [];
  const push = (v: any) => {
    if (v == null) return;
    if (typeof v === 'string') out.push(v);
    else if (typeof v === 'object' && typeof v.name === 'string') out.push(v.name);
  };
  push(u.role);
  if (Array.isArray(u.roles)) u.roles.forEach(push);
  return out.map((r) => r.toLowerCase().trim()).filter(Boolean);
};

const isParentUser = (u: any) => {
  const roles = collectRoles(u);
  return roles.some((r) => r === 'parent' || r === 'guardian');
};

const displayName = (s: any): string => {
  if (!s) return 'N/A';
  if (s.name) return s.name;
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ').trim() || 'N/A';
};

/** Try to read guardians from a student list row (multiple possible API shapes). */
const getStudentGuardiansFromRow = (s: any): any[] => {
  if (!s) return [];
  if (Array.isArray(s.guardians)) return s.guardians;
  if (Array.isArray(s.guardianLinks)) return s.guardianLinks;
  if (Array.isArray(s.guardianUsers)) return s.guardianUsers;
  if (Array.isArray(s.parents)) return s.parents;
  if (s.guardianUser) return [s.guardianUser];
  if (s.parent) return [s.parent];
  return [];
};

/** Detect if the row tells us guardians are definitely NOT linked (vs unknown). */
const isGuardianStatusKnown = (s: any): boolean =>
  Array.isArray(s?.guardians) ||
  Array.isArray(s?.guardianLinks) ||
  Array.isArray(s?.guardianUsers) ||
  Array.isArray(s?.parents);

type ModalState = null | 'create' | 'edit' | 'detail' | 'lifecycle' | 'bulkPromote' | 'linkParent';
type LifecycleAction = 'enroll' | 'withdraw' | 'reEnroll' | 'promote' | 'graduate' | 'repeat' | 'transfer';
type DetailTab = 'profile' | 'guardians' | 'enrollments' | 'documents' | 'health';

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export const StudentManager: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth || {});
  const schoolId = user?.schoolId || user?.user?.schoolId || '';
  const { data: school } = useGetSchoolByIdQuery(schoolId, { skip: !schoolId });
  const schoolName = school?.name || 'Your School';

  /* ── Students ── */
  const { data: studentsRes, isLoading, error, refetch: refetchStudents } =
    useGetStudentsBySchoolQuery(schoolId, { skip: !schoolId, refetchOnMountOrArgChange: true });
  const students = extractList(studentsRes);

  /* ── Classes ── */
  const { data: classesRes } = useGetClassesBySchoolIdQuery({ schoolId }, { skip: !schoolId });
  const classes = extractList(classesRes);

  /* ── Parents ── */
  const { data: usersRes, refetch: refetchUsers } = useGetSchoolUsersQuery(
    { schoolId, params: { page: 1, limit: 100 } },
    { skip: !schoolId }
  );
  const allUsers = useMemo(() => extractList(usersRes), [usersRes]);
  const parents = useMemo(() => allUsers.filter(isParentUser), [allUsers]);

  /* ── Stats ── */
  const { data: genderRes } = useGetGenderBreakdownQuery(schoolId, { skip: !schoolId });
  const genderStats = genderRes || { male: 0, female: 0, total: 0 };

  /* ── Mutations ── */
  const [createStudent, createState] = useCreateStudentMutation();
  const [updateStudent, updateState] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const [enrollInClass] = useEnrollStudentInClassMutation();
  const [withdrawStudent] = useWithdrawStudentMutation();
  const [reEnrollStudent] = useReEnrollStudentMutation();
  const [promoteStudent] = usePromoteStudentMutation();
  const [graduateStudent] = useGraduateStudentMutation();
  const [repeatGrade] = useRepeatGradeMutation();
  const [transferOut] = useTransferOutStudentMutation();
  const [bulkPromote] = useBulkPromoteClassMutation();
  const [addGuardian] = useAddGuardianMutation();

  /* ── State ── */
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [lifecycleAction, setLifecycleAction] = useState<LifecycleAction | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'inactive'>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState<DetailTab>('profile');
  const [linkTargetStudentId, setLinkTargetStudentId] = useState<string>('');

  const notify = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    if (type === 'success') setTimeout(() => setToast(null), 3500);
  };
  const errMsg = (err: any, fb: string) => err?.data?.message || fb;

  /* ── Filtered list ── */
  const filteredStudents = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((s: any) => {
        const name = displayName(s).toLowerCase();
        const admn = (s.admissionNumber || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        return name.includes(q) || admn.includes(q) || email.includes(q);
      });
    }
    if (classFilter) list = list.filter((s: any) => (s.classId || s.class?.id) === classFilter);
    if (statusFilter === 'enrolled') list = list.filter((s: any) => s.isEnrolled === true);
    if (statusFilter === 'inactive') list = list.filter((s: any) => s.isEnrolled === false);
    return list;
  }, [students, search, classFilter, statusFilter]);

  /* ── Register form ── */
  const emptyForm = () => ({
    firstName: '', lastName: '', middleName: '', email: '', password: '',
    admissionNumber: '', upiNumber: '', parentId: '', classId: '',
    dateOfBirth: '', gender: 'Male', enrollmentDate: todayISO(), isEnrolled: true,
  });
  const [formData, setFormData] = useState(emptyForm());

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        schoolId,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        admissionNumber: formData.admissionNumber.trim(),
        gender: formData.gender,
        isEnrolled: formData.isEnrolled,
        enrollmentDate: formData.enrollmentDate,
      };
      if (formData.middleName.trim()) payload.middleName = formData.middleName.trim();
      if (formData.upiNumber.trim()) payload.upiNumber = formData.upiNumber.trim();
      if (formData.classId) payload.classId = formData.classId;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;

      const created: any = await createStudent(payload).unwrap();
      const newStudentId = created?.student?.id || created?.data?.id || created?.id || null;

      if (formData.parentId && newStudentId) {
        try {
          await addGuardian({
            studentId: newStudentId,
            guardianUserId: formData.parentId,
            relationship: 'Parent',
            isPrimary: true,
            isFeePayer: true,
          }).unwrap();
        } catch (err) { console.warn('Guardian link failed:', err); }
      }
      notify('success', 'Student created!');
      setFormData(emptyForm());
      setModal(null);
      refetchStudents();
    } catch (err) {
      notify('error', errMsg(err, 'Failed to create student'));
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await updateStudent({
        studentId: selectedStudent.id || selectedStudent._id,
        ...formData,
      }).unwrap();
      notify('success', 'Student updated!');
      setModal(null);
      refetchStudents();
    } catch (err) {
      notify('error', errMsg(err, 'Failed to update student'));
    }
  };

  const handleDelete = async (student: any) => {
    if (!window.confirm(`Delete ${displayName(student)}?`)) return;
    try {
      await deleteStudent(student.id || student._id).unwrap();
      notify('success', 'Student deleted.');
      refetchStudents();
    } catch (err) {
      notify('error', errMsg(err, 'Failed to delete student'));
    }
  };

  const openEdit = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      middleName: student.middleName || '',
      email: student.email || '',
      password: '',
      admissionNumber: student.admissionNumber || '',
      upiNumber: student.upiNumber || '',
      parentId: '',
      classId: student.classId || '',
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      gender: student.gender || 'Male',
      enrollmentDate: student.enrollmentDate?.split('T')[0] || todayISO(),
      isEnrolled: student.isEnrolled !== false,
    });
    setModal('edit');
  };

  const openDetail = (student: any, initialTab: DetailTab = 'profile') => {
    setSelectedStudent(student);
    setDetailInitialTab(initialTab);
    setModal('detail');
  };

  const openLifecycle = (student: any, action: LifecycleAction) => {
    setSelectedStudent(student);
    setLifecycleAction(action);
    setMenuOpenId(null);
    setModal('lifecycle');
  };

  const openLinkFor = (student: any | null) => {
    setLinkTargetStudentId(student ? (student.id || student._id) : '');
    setModal('linkParent');
  };

  /* Close menu on outside click */
  useEffect(() => {
    const close = () => setMenuOpenId(null);
    if (menuOpenId) {
      window.addEventListener('click', close);
      return () => window.removeEventListener('click', close);
    }
  }, [menuOpenId]);

  if (!schoolId) {
    return <div className="p-12 text-center text-error font-bold">School ID missing</div>;
  }

  const parentField = (value: string, onChange: (v: string) => void) => (
    <Field label={`Parent (optional) · ${parents.length} available`}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">No parent selected</option>
        {parents.map((p: any) => (
          <option key={p.id || p._id} value={p.id || p._id}>
            {displayName(p)} — {p.email || p.phone || 'No contact'}
          </option>
        ))}
      </select>
    </Field>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-base-100 text-base-content min-h-screen">

      {/* ═════ HEADER ═════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-6 sm:p-8 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-content text-[10px] font-black rounded-full uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Student Registry
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary">
              Student Management
            </h1>
            <p className="text-xs opacity-70 max-w-xl">
              Full lifecycle management for {schoolName}.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { refetchStudents(); refetchUsers(); }} className="p-2.5 bg-base-100 border border-base-300 rounded-xl hover:bg-base-200 text-primary transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => openLinkFor(null)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-base-100 border border-base-300 hover:bg-base-200 text-xs font-black uppercase tracking-wider transition">
              <Link2 className="w-4 h-4" /> Link Parent
            </button>
            <button onClick={() => { setSelectedStudent(null); setFormData(emptyForm()); setModal('create'); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-content text-xs font-black uppercase tracking-wider hover:opacity-90 shadow-md shadow-primary/20 transition">
              <PlusCircle className="w-4 h-4" /> Register
            </button>
          </div>
        </div>
      </div>

      {/* ═════ STATS ═════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Students" value={students.length} color="primary" />
        <StatCard icon={UserCheck} label="Enrolled" value={students.filter((s: any) => s.isEnrolled).length} color="success" />
        <StatCard icon={Users} label="Male" value={genderStats.male ?? '—'} color="info" />
        <StatCard icon={Users} label="Female" value={genderStats.female ?? '—'} color="secondary" />
      </div>

      {/* ═════ TOAST ═════ */}
      {toast && (
        <div className={`p-3 rounded-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* ═════ LIST ═════ */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, admission no, or email"
              className={`${inputCls} pl-10`}
            />
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`${inputCls} md:w-48`}>
            <option value="">All classes</option>
            {classes.map((c: any) => (
              <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.className}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={`${inputCls} md:w-40`}>
            <option value="all">Any status</option>
            <option value="enrolled">Enrolled</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto bg-base-100 rounded-2xl">
          <table className="min-w-full divide-y divide-base-300 text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider opacity-60">
                <th className="px-4 py-3 text-left font-black">Adm No</th>
                <th className="px-4 py-3 text-left font-black">Name / Email</th>
                <th className="px-4 py-3 text-left font-black">Class</th>
                <th className="px-4 py-3 text-left font-black">Gender</th>
                <th className="px-4 py-3 text-left font-black">Guardian</th>
                <th className="px-4 py-3 text-left font-black">Status</th>
                <th className="px-4 py-3 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {isLoading ? (
                <tr><td colSpan={7} className="py-12 text-center opacity-60">Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="py-12 text-center text-error">Failed to load students.</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center opacity-60">
                  {students.length === 0 ? 'No students registered yet.' : 'No matches for your filters.'}
                </td></tr>
              ) : filteredStudents.map((s: any) => {
                const id = s.id || s._id;
                const cls = classes.find((c: any) => (c.id || c._id) === (s.classId || s.class?.id));
                return (
                  <tr key={id} className="hover:bg-base-200/40 transition-colors">
                    <td className="px-4 py-3 font-black text-primary whitespace-nowrap">{s.admissionNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{displayName(s)}</div>
                      <div className="text-[10px] opacity-60 font-mono">{s.email || 'no email'}</div>
                    </td>
                    <td className="px-4 py-3 opacity-80">{cls?.name || cls?.className || '—'}</td>
                    <td className="px-4 py-3 opacity-80">{s.gender || '—'}</td>
                    <td className="px-4 py-3">
                      <GuardianCell
                        student={s}
                        onViewGuardians={() => openDetail(s, 'guardians')}
                        onLink={() => openLinkFor(s)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${s.isEnrolled ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {s.isEnrolled ? 'Enrolled' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconBtn label="View" onClick={() => openDetail(s, 'profile')}><Eye className="w-4 h-4" /></IconBtn>
                        <IconBtn label="Edit" onClick={() => openEdit(s)}><Pencil className="w-4 h-4" /></IconBtn>
                        <div className="relative">
                          <IconBtn label="Lifecycle" onClick={(e?: any) => { e?.stopPropagation?.(); setMenuOpenId(menuOpenId === id ? null : id); }}>
                            <MoreVertical className="w-4 h-4" />
                          </IconBtn>
                          {menuOpenId === id && (
                            <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-base-100 border border-base-300 rounded-xl shadow-2xl overflow-hidden">
                              <MenuItem icon={GraduationCap} label="Enroll in class" onClick={() => openLifecycle(s, 'enroll')} />
                              <MenuItem icon={Ban} label="Withdraw" onClick={() => openLifecycle(s, 'withdraw')} />
                              <MenuItem icon={RotateCcw} label="Re-enroll" onClick={() => openLifecycle(s, 'reEnroll')} />
                              <MenuItem icon={TrendingUp} label="Promote" onClick={() => openLifecycle(s, 'promote')} />
                              <MenuItem icon={Award} label="Graduate" onClick={() => openLifecycle(s, 'graduate')} />
                              <MenuItem icon={RotateCcw} label="Repeat grade" onClick={() => openLifecycle(s, 'repeat')} />
                              <MenuItem icon={Archive} label="Transfer out" onClick={() => openLifecycle(s, 'transfer')} />
                            </div>
                          )}
                        </div>
                        <IconBtn label="Delete" danger onClick={() => handleDelete(s)}><Trash2 className="w-4 h-4" /></IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-base-300 flex items-center justify-between">
          <p className="text-[11px] opacity-60">{filteredStudents.length} of {students.length} students</p>
          <button onClick={() => setModal('bulkPromote')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider hover:bg-secondary hover:text-secondary-content transition">
            <TrendingUp className="w-3 h-3" /> Bulk promote a class
          </button>
        </div>
      </div>

      {/* ═════ MODALS ═════ */}
      {modal === 'create' && (
        <Modal title="Register New Student" subtitle={schoolName} icon={PlusCircle} size="lg" onClose={() => setModal(null)}>
          <StudentForm
            mode="create"
            formData={formData}
            setFormData={setFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            classes={classes}
            parents={parents}
            parentField={parentField}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            loading={createState.isLoading}
          />
        </Modal>
      )}

      {modal === 'edit' && selectedStudent && (
        <Modal title="Edit Student" subtitle={displayName(selectedStudent)} icon={Pencil} size="lg" onClose={() => setModal(null)}>
          <EditStudentModalContent
            student={selectedStudent}
            formData={formData}
            setFormData={setFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            classes={classes}
            parents={parents}
            parentField={parentField}
            onSubmit={handleEdit}
            onCancel={() => setModal(null)}
            loading={updateState.isLoading}
            onManageGuardians={() => { setDetailInitialTab('guardians'); setModal('detail'); }}
          />
        </Modal>
      )}

      {modal === 'detail' && selectedStudent && (
        <DetailModal
          student={selectedStudent}
          schoolId={schoolId}
          classes={classes}
          parents={parents}
          initialTab={detailInitialTab}
          onClose={() => setModal(null)}
          notify={notify}
        />
      )}

      {modal === 'lifecycle' && selectedStudent && lifecycleAction && (
        <LifecycleModal
          student={selectedStudent}
          action={lifecycleAction}
          classes={classes}
          onClose={() => setModal(null)}
          notify={notify}
          refetch={refetchStudents}
          mutations={{
            enrollInClass, withdrawStudent, reEnrollStudent, promoteStudent,
            graduateStudent, repeatGrade, transferOut,
          }}
        />
      )}

      {modal === 'bulkPromote' && (
        <BulkPromoteModal
          schoolId={schoolId}
          classes={classes}
          onClose={() => setModal(null)}
          notify={notify}
          refetch={refetchStudents}
          mutate={bulkPromote}
        />
      )}

      {modal === 'linkParent' && (
        <LinkParentModal
          students={students}
          parents={parents}
          initialStudentId={linkTargetStudentId}
          onClose={() => { setModal(null); setLinkTargetStudentId(''); }}
          notify={notify}
          refetch={() => { refetchStudents(); }}
          mutate={addGuardian}
        />
      )}

      <style>{`
        @keyframes smFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes smPop { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .sm-fade { animation: smFade 0.2s ease-out both; }
        .sm-pop  { animation: smPop 0.26s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .sm-fade, .sm-pop { animation: none !important; } }
      `}</style>
    </div>
  );
};

export default StudentManager;

/* ═══════════════════════════════════════════════════════
   GUARDIAN CELL — shows linked status in the table
   ═══════════════════════════════════════════════════════ */

function GuardianCell({
  student, onViewGuardians, onLink,
}: {
  student: any;
  onViewGuardians: () => void;
  onLink: () => void;
}) {
  const rowGuardians = getStudentGuardiansFromRow(student);
  const known = isGuardianStatusKnown(student);

  if (rowGuardians.length > 0) {
    const first = rowGuardians[0];
    const primary = rowGuardians.find((g: any) => g.isPrimary) || first;
    const primaryName = displayName(primary) || 'Guardian';
    return (
      <button
        onClick={onViewGuardians}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-success/10 text-success hover:bg-success hover:text-success-content transition max-w-[160px]"
        title={rowGuardians.map((g: any) => displayName(g)).join(', ')}
      >
        <UserCheck className="w-3 h-3 shrink-0" />
        <span className="truncate">{primaryName}</span>
        {rowGuardians.length > 1 && (
          <span className="shrink-0 opacity-70">+{rowGuardians.length - 1}</span>
        )}
      </button>
    );
  }

  if (known) {
    return (
      <button
        onClick={onLink}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-warning/10 text-warning hover:bg-warning hover:text-warning-content transition"
      >
        <Link2 className="w-3 h-3" /> Link
      </button>
    );
  }

  return (
    <button
      onClick={onViewGuardians}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-base-200 text-base-content/60 hover:bg-primary/10 hover:text-primary transition"
    >
      <UserCheck className="w-3 h-3" /> View
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   LINK PARENT MODAL
   ═══════════════════════════════════════════════════════ */

function LinkParentModal({ students, parents, initialStudentId, onClose, notify, refetch, mutate }: any) {
  const [studentId, setStudentId] = useState(initialStudentId || '');
  const [guardianUserId, setGuardianUserId] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isFeePayer, setIsFeePayer] = useState(false);
  const [canPickup, setCanPickup] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await mutate({ studentId, guardianUserId, relationship, isPrimary, isFeePayer, canPickup }).unwrap();
      notify('success', 'Parent linked successfully.');
      refetch();
      onClose();
    } catch (err: any) {
      notify('error', err?.data?.message || 'Failed to link parent.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Link Parent to Student" subtitle="Connect a registered parent to a student" icon={Link2} onClose={onClose}>
      <div className="space-y-3">
        <Field label={`Student * (${students.length} registered)`}>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className={inputCls}>
            <option value="">Select student…</option>
            {students.map((s: any) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {displayName(s)} — {s.admissionNumber || 'no adm'}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`Parent * (${parents.length} available)`}>
          <select value={guardianUserId} onChange={(e) => setGuardianUserId(e.target.value)} className={inputCls}>
            <option value="">
              {parents.length === 0 ? 'No parents found — create one via Users page' : 'Select parent…'}
            </option>
            {parents.map((p: any) => (
              <option key={p.id || p._id} value={p.id || p._id}>
                {displayName(p)} — {p.email || p.phone || 'no contact'}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Relationship">
          <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputCls}>
            <option>Parent</option><option>Father</option><option>Mother</option><option>Guardian</option>
            <option>Uncle</option><option>Aunt</option><option>Grandparent</option><option>Other</option>
          </select>
        </Field>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
            <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} className="checkbox checkbox-xs checkbox-primary" /> Primary
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
            <input type="checkbox" checked={isFeePayer} onChange={(e) => setIsFeePayer(e.target.checked)} className="checkbox checkbox-xs checkbox-primary" /> Fee payer
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer">
            <input type="checkbox" checked={canPickup} onChange={(e) => setCanPickup(e.target.checked)} className="checkbox checkbox-xs checkbox-primary" /> Pickup
          </label>
        </div>

        {parents.length === 0 && (
          <p className="text-[11px] text-warning bg-warning/10 border border-warning/20 rounded-lg p-2">
            ⚠ No parents found in this school. Go to the <strong>Users</strong> page and create a user with role <strong>parent</strong> first.
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 mt-2 border-t border-base-300">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-xs uppercase disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={loading || !studentId || !guardianUserId}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-2.5 px-5 rounded-xl hover:opacity-95 shadow-lg shadow-primary/20 text-xs uppercase disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Linking…</> : <><Link2 className="w-4 h-4" /> Link Parent</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   EDIT MODAL — with guardian preview strip
   ═══════════════════════════════════════════════════════ */

function EditStudentModalContent({
  student, formData, setFormData, showPassword, setShowPassword, classes, parents,
  parentField, onSubmit, onCancel, loading, onManageGuardians,
}: any) {
  const id = student.id || student._id;
  const { data: guardiansRes, isLoading: loadingGuardians } = useGetStudentGuardiansQuery(id);
  const guardians = extractList(guardiansRes);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Read-only guardian preview at top */}
      <div className="p-3 rounded-xl bg-base-200/60 border border-base-300">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-black uppercase tracking-wider opacity-60 flex items-center gap-1.5">
            <UserCheck className="w-3 h-3" /> Currently Linked Guardians
          </p>
          <button type="button" onClick={onManageGuardians} className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider">
            Manage →
          </button>
        </div>
        {loadingGuardians ? (
          <p className="text-[11px] opacity-60 flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Loading…</p>
        ) : guardians.length === 0 ? (
          <p className="text-[11px] text-warning">No guardians linked yet — use "Manage" to link one.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {guardians.map((g: any, i: number) => (
              <span key={g.guardianUserId || g.id || i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold">
                <span className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center text-[8px] font-black">
                  {displayName(g).charAt(0).toUpperCase()}
                </span>
                {displayName(g)}
                {g.isPrimary && <span className="opacity-60">· P</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Admission No *">
          <input required value={formData.admissionNumber} onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Gender *">
          <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={inputCls}>
            <option>Male</option><option>Female</option>
          </select>
        </Field>
        <Field label="First Name *">
          <input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Last Name *">
          <input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputCls} />
        </Field>
        <div className="md:col-span-2">
          <Field label="Middle Name">
            <input value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field label="Email *">
          <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="UPI Number">
          <input value={formData.upiNumber} onChange={(e) => setFormData({ ...formData, upiNumber: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Class">
          <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className={inputCls}>
            <option value="">No class</option>
            {classes.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.className}</option>)}
          </select>
        </Field>
        <Field label="Date of Birth">
          <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 mt-2 border-t border-base-300">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-xs uppercase disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-2.5 px-5 rounded-xl hover:opacity-95 shadow-lg shadow-primary/20 text-xs uppercase disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════════════════
   DETAIL MODAL
   ═══════════════════════════════════════════════════════ */

function DetailModal({ student, schoolId, classes, parents, initialTab = 'profile', onClose, notify }: any) {
  const id = student.id || student._id;
  const [tab, setTab] = useState<DetailTab>(initialTab);

  useEffect(() => { setTab(initialTab); }, [initialTab]);

  const { data: statsRes } = useGetStudentStatisticsQuery(id);
  const { data: guardiansRes, refetch: refetchGuardians } = useGetStudentGuardiansQuery(id);
  const { data: enrollmentsRes } = useGetStudentEnrollmentsQuery(id);
  const { data: currentEnrollRes } = useGetCurrentEnrollmentQuery(id);
  const { data: docsRes, refetch: refetchDocs } = useGetStudentDocumentsQuery(id);
  const { data: healthRes, refetch: refetchHealth } = useGetStudentHealthRecordsQuery(id);

  const [addGuardian, { isLoading: addingGuardian }] = useAddGuardianMutation();
  const [setPrimary] = useSetPrimaryGuardianMutation();
  const [removeGuardian] = useRemoveGuardianMutation();
  const [addDoc, { isLoading: addingDoc }] = useAddStudentDocumentMutation();
  const [addHealth, { isLoading: addingHealth }] = useAddHealthRecordMutation();

  const guardians = extractList(guardiansRes);
  const enrollments = extractList(enrollmentsRes);
  const docs = extractList(docsRes);
  const health = extractList(healthRes);

  const [guardianForm, setGuardianForm] = useState({ guardianUserId: '', relationship: 'Parent', isPrimary: false, isFeePayer: false });
  const [docForm, setDocForm] = useState({ category: 'BirthCertificate', title: '', fileUrl: '', isVisibleToParent: true });
  const [healthForm, setHealthForm] = useState({ recordType: 'Allergy', title: '', description: '' });

  const tabs = [
    { key: 'profile', label: 'Profile', icon: Users },
    { key: 'guardians', label: `Guardians (${guardians.length})`, icon: UserCheck },
    { key: 'enrollments', label: 'History', icon: GraduationCap },
    { key: 'documents', label: `Docs (${docs.length})`, icon: FileText },
    { key: 'health', label: `Health (${health.length})`, icon: Heart },
  ] as const;

  return (
    <Modal title={displayName(student)} subtitle={`Admission: ${student.admissionNumber || '—'}`} icon={Eye} size="lg" onClose={onClose}>
      <div className="flex gap-1 border-b border-base-300 mb-4 overflow-x-auto">
        {tabs.map((t: any) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-black whitespace-nowrap border-b-2 transition ${active ? 'border-primary text-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profile' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <InfoTile label="Admission No" value={student.admissionNumber} />
            <InfoTile label="Gender" value={student.gender} />
            <InfoTile label="Email" value={student.email} />
            <InfoTile label="Date of Birth" value={student.dateOfBirth?.split('T')[0]} />
            <InfoTile label="Class" value={classes.find((c: any) => (c.id || c._id) === student.classId)?.name || '—'} />
            <InfoTile label="Status" value={student.isEnrolled ? 'Enrolled' : 'Inactive'} />
          </div>

          {/* ── Linked Guardians PREVIEW ── */}
          <div className="pt-3 border-t border-base-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase opacity-60 flex items-center gap-1.5">
                <UserCheck className="w-3 h-3" /> Linked Guardians
              </p>
              <button onClick={() => setTab('guardians')} className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider">
                Manage →
              </button>
            </div>
            {guardians.length === 0 ? (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-[11px] text-warning font-semibold">No guardian linked yet.</p>
                <button onClick={() => setTab('guardians')} className="mt-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-wider">
                  + Link a guardian
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {guardians.map((g: any, i: number) => (
                  <div key={g.guardianUserId || g.id || i} className="p-2.5 rounded-xl bg-success/5 border border-success/20 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center font-black text-xs shrink-0">
                      {displayName(g).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate">{displayName(g)}</p>
                      <p className="text-[9px] opacity-60 truncate">{g.relationship || 'Guardian'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      {g.isPrimary && <span className="text-[8px] font-black bg-success/15 text-success px-1 rounded">P</span>}
                      {g.isFeePayer && <span className="text-[8px] font-black bg-info/15 text-info px-1 rounded">F</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {statsRes?.stats && (
            <div className="pt-3 border-t border-base-300">
              <p className="text-[10px] font-black uppercase opacity-60 mb-2">Statistics</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statsRes.stats).slice(0, 6).map(([k, v]) => (
                  <InfoTile key={k} label={k} value={String(v)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'guardians' && (
        <div className="space-y-3">
          <div className="space-y-2">
            {guardians.length === 0 ? (
              <p className="text-xs opacity-60 text-center py-4">No guardians linked yet.</p>
            ) : guardians.map((g: any) => (
              <div key={g.guardianUserId || g.id} className="p-3 rounded-xl bg-base-200/60 border border-base-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                  {displayName(g).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold truncate">{displayName(g)}</p>
                  <p className="text-[10px] opacity-60">{g.relationship || 'Guardian'} · {g.email || g.phone || 'no contact'}</p>
                </div>
                <div className="flex items-center gap-1">
                  {g.isPrimary && <span className="text-[9px] font-black bg-success/10 text-success px-1.5 py-0.5 rounded">Primary</span>}
                  {g.isFeePayer && <span className="text-[9px] font-black bg-info/10 text-info px-1.5 py-0.5 rounded">Fee</span>}
                  <button onClick={async () => {
                    try {
                      await setPrimary({ studentId: id, guardianUserId: g.guardianUserId || g.id }).unwrap();
                      refetchGuardians(); notify('success', 'Primary guardian updated.');
                    } catch (e) { notify('error', 'Failed to set primary'); }
                  }} className="p-1 text-xs hover:bg-base-300 rounded" title="Set primary">★</button>
                  <button onClick={async () => {
                    if (!confirm('Remove guardian?')) return;
                    try {
                      await removeGuardian({ studentId: id, guardianUserId: g.guardianUserId || g.id }).unwrap();
                      refetchGuardians(); notify('success', 'Guardian removed.');
                    } catch (e) { notify('error', 'Failed to remove'); }
                  }} className="p-1 text-error hover:bg-error/10 rounded" title="Remove"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-base-300 space-y-2">
            <p className="text-[10px] font-black uppercase opacity-60">Add Guardian</p>
            <select value={guardianForm.guardianUserId} onChange={(e) => setGuardianForm({ ...guardianForm, guardianUserId: e.target.value })} className={inputCls}>
              <option value="">Select parent…</option>
              {parents.map((p: any) => <option key={p.id || p._id} value={p.id || p._id}>{displayName(p)} ({p.email || 'no email'})</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input value={guardianForm.relationship} onChange={(e) => setGuardianForm({ ...guardianForm, relationship: e.target.value })} placeholder="Relationship" className={inputCls} />
              <label className="flex items-center gap-1.5 text-[11px]">
                <input type="checkbox" checked={guardianForm.isPrimary} onChange={(e) => setGuardianForm({ ...guardianForm, isPrimary: e.target.checked })} className="checkbox checkbox-xs" /> Primary
              </label>
            </div>
            <button disabled={!guardianForm.guardianUserId || addingGuardian} onClick={async () => {
              try {
                await addGuardian({ studentId: id, ...guardianForm }).unwrap();
                setGuardianForm({ guardianUserId: '', relationship: 'Parent', isPrimary: false, isFeePayer: false });
                refetchGuardians(); notify('success', 'Guardian added.');
              } catch (e: any) { notify('error', e?.data?.message || 'Failed to add'); }
            }} className="w-full bg-primary text-primary-content py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5">
              {addingGuardian ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />} Add Guardian
            </button>
          </div>
        </div>
      )}

      {tab === 'enrollments' && (
        <div className="space-y-2">
          {currentEnrollRes && (
            <div className="p-3 rounded-xl bg-success/10 border border-success/30">
              <p className="text-[10px] font-black uppercase text-success">Current Enrollment</p>
              <p className="text-xs font-bold mt-1">
                {classes.find((c: any) => (c.id || c._id) === (currentEnrollRes as any)?.classId)?.name || (currentEnrollRes as any)?.classId || '—'}
              </p>
            </div>
          )}
          {enrollments.length === 0 ? (
            <p className="text-xs opacity-60 text-center py-4">No enrollment history.</p>
          ) : enrollments.map((e: any, i: number) => (
            <div key={e.id || i} className="p-3 rounded-xl bg-base-200/60 border border-base-300 text-xs">
              <p className="font-bold">{classes.find((c: any) => (c.id || c._id) === e.classId)?.name || e.classId || 'Class'}</p>
              <p className="text-[10px] opacity-60">{e.action || e.type || 'Enrollment'} · {e.createdAt?.split('T')[0] || '—'}</p>
              {e.reason && <p className="text-[10px] italic opacity-60 mt-1">"{e.reason}"</p>}
            </div>
          ))}
        </div>
      )}

      {tab === 'documents' && (
        <div className="space-y-3">
          {docs.length === 0 ? (
            <p className="text-xs opacity-60 text-center py-4">No documents.</p>
          ) : docs.map((d: any, i: number) => (
            <a key={d.id || i} href={d.fileUrl} target="_blank" rel="noreferrer"
              className="p-3 rounded-xl bg-base-200/60 border border-base-300 flex items-center gap-3 hover:bg-base-200 transition">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold truncate">{d.title}</p>
                <p className="text-[10px] opacity-60">{d.category}</p>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </a>
          ))}
          <div className="pt-3 border-t border-base-300 space-y-2">
            <p className="text-[10px] font-black uppercase opacity-60">Add Document</p>
            <input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} placeholder="Document title" className={inputCls} />
            <input value={docForm.fileUrl} onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })} placeholder="https://… (file URL)" className={inputCls} />
            <select value={docForm.category} onChange={(e) => setDocForm({ ...docForm, category: e.target.value })} className={inputCls}>
              <option>BirthCertificate</option><option>ReportCard</option><option>TransferLetter</option><option>Other</option>
            </select>
            <button disabled={!docForm.title || !docForm.fileUrl || addingDoc} onClick={async () => {
              try {
                await addDoc({ studentId: id, schoolId, ...docForm }).unwrap();
                setDocForm({ category: 'BirthCertificate', title: '', fileUrl: '', isVisibleToParent: true });
                refetchDocs(); notify('success', 'Document added.');
              } catch (e: any) { notify('error', e?.data?.message || 'Failed'); }
            }} className="w-full bg-primary text-primary-content py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5">
              {addingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />} Add Document
            </button>
          </div>
        </div>
      )}

      {tab === 'health' && (
        <div className="space-y-3">
          {health.length === 0 ? (
            <p className="text-xs opacity-60 text-center py-4">No health records.</p>
          ) : health.map((h: any, i: number) => (
            <div key={h.id || i} className="p-3 rounded-xl bg-base-200/60 border border-base-300 text-xs">
              <div className="flex items-start gap-2">
                <Heart className="w-4 h-4 text-error shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold">{h.title}</p>
                  <p className="text-[10px] opacity-60">{h.recordType}</p>
                  {h.description && <p className="text-[10px] mt-1">{h.description}</p>}
                </div>
              </div>
            </div>
          ))}
          <div className="pt-3 border-t border-base-300 space-y-2">
            <p className="text-[10px] font-black uppercase opacity-60">Add Health Record</p>
            <input value={healthForm.title} onChange={(e) => setHealthForm({ ...healthForm, title: e.target.value })} placeholder="Title" className={inputCls} />
            <select value={healthForm.recordType} onChange={(e) => setHealthForm({ ...healthForm, recordType: e.target.value })} className={inputCls}>
              <option>Allergy</option><option>Medical Condition</option><option>Vaccination</option><option>Other</option>
            </select>
            <textarea value={healthForm.description} onChange={(e) => setHealthForm({ ...healthForm, description: e.target.value })} placeholder="Description (optional)" rows={2} className={inputCls} />
            <button disabled={!healthForm.title || addingHealth} onClick={async () => {
              try {
                await addHealth({ studentId: id, schoolId, ...healthForm }).unwrap();
                setHealthForm({ recordType: 'Allergy', title: '', description: '' });
                refetchHealth(); notify('success', 'Health record added.');
              } catch (e: any) { notify('error', e?.data?.message || 'Failed'); }
            }} className="w-full bg-primary text-primary-content py-2 rounded-xl text-xs font-black uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5">
              {addingHealth ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className="w-3.5 h-3.5" />} Add Health Record
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   LIFECYCLE MODAL  ← FIXED (config[action as LifecycleAction])
   ═══════════════════════════════════════════════════════ */

function LifecycleModal({ student, action, classes, onClose, notify, refetch, mutations }: any) {
  const id = student.id || student._id;
  const [classId, setClassId] = useState('');
  const [reason, setReason] = useState('');
  const [toSchool, setToSchool] = useState('');
  const [loading, setLoading] = useState(false);

  const config: Record<LifecycleAction, { title: string; icon: any; cta: string }> = {
    enroll: { title: 'Enroll in Class', icon: GraduationCap, cta: 'Enroll' },
    withdraw: { title: 'Withdraw Student', icon: Ban, cta: 'Withdraw' },
    reEnroll: { title: 'Re-enroll Student', icon: RotateCcw, cta: 'Re-enroll' },
    promote: { title: 'Promote Student', icon: TrendingUp, cta: 'Promote' },
    graduate: { title: 'Graduate Student', icon: Award, cta: 'Graduate' },
    repeat: { title: 'Repeat Grade', icon: RotateCcw, cta: 'Repeat' },
    transfer: { title: 'Transfer Out', icon: Archive, cta: 'Transfer' },
  };
  const cfg = config[action as LifecycleAction];   // ✅ FIX
  const Icon = cfg.icon;

  const submit = async () => {
    setLoading(true);
    try {
      if (action === 'enroll') await mutations.enrollInClass({ studentId: id, classId, requireUnplaced: true }).unwrap();
      if (action === 'withdraw') await mutations.withdrawStudent({ studentId: id, reason }).unwrap();
      if (action === 'reEnroll') await mutations.reEnrollStudent(id).unwrap();
      if (action === 'promote') await mutations.promoteStudent({ studentId: id }).unwrap();
      if (action === 'graduate') await mutations.graduateStudent({ studentId: id }).unwrap();
      if (action === 'repeat') await mutations.repeatGrade({ studentId: id }).unwrap();
      if (action === 'transfer') await mutations.transferOut({ studentId: id, toSchool, reason }).unwrap();
      notify('success', `${cfg.title} successful.`);
      refetch(); onClose();
    } catch (err: any) {
      notify('error', err?.data?.message || 'Operation failed.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title={cfg.title} subtitle={displayName(student)} icon={Icon} onClose={onClose}>
      <div className="space-y-3">
        {action === 'enroll' && (
          <Field label="Class *">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
              <option value="">Select class…</option>
              {classes.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.className}</option>)}
            </select>
          </Field>
        )}
        {action === 'withdraw' && (
          <Field label="Reason">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason for withdrawal…" className={inputCls} />
          </Field>
        )}
        {action === 'transfer' && (
          <>
            <Field label="To School *">
              <input value={toSchool} onChange={(e) => setToSchool(e.target.value)} placeholder="Nairobi Academy" className={inputCls} />
            </Field>
            <Field label="Reason">
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className={inputCls} />
            </Field>
          </>
        )}
        {['promote', 'graduate', 'repeat', 'reEnroll'].includes(action) && (
          <p className="text-xs opacity-70">Confirm to proceed with <strong>{cfg.title.toLowerCase()}</strong>?</p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 mt-2 border-t border-base-300">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-xs uppercase disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={loading || (action === 'enroll' && !classId) || (action === 'transfer' && !toSchool)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-2.5 px-5 rounded-xl hover:opacity-95 shadow-lg shadow-primary/20 text-xs uppercase disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Working…</> : <>{cfg.cta}</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   BULK PROMOTE MODAL
   ═══════════════════════════════════════════════════════ */

function BulkPromoteModal({ schoolId, classes, onClose, notify, refetch, mutate }: any) {
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await mutate({ schoolId, fromClassId, toClassId }).unwrap();
      notify('success', 'Class promoted successfully.');
      refetch(); onClose();
    } catch (err: any) { notify('error', err?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <Modal title="Bulk Promote Class" subtitle="Move all students from one class to another" icon={TrendingUp} onClose={onClose}>
      <div className="space-y-3">
        <Field label="From Class *">
          <select value={fromClassId} onChange={(e) => setFromClassId(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {classes.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.className}</option>)}
          </select>
        </Field>
        <Field label="To Class *">
          <select value={toClassId} onChange={(e) => setToClassId(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {classes.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.className}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 pt-3 mt-2 border-t border-base-300">
          <button onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-xs uppercase disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={loading || !fromClassId || !toClassId}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-2.5 px-5 rounded-xl hover:opacity-95 shadow-lg shadow-primary/20 text-xs uppercase disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Promoting…</> : <>Promote</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARED UI
   ═══════════════════════════════════════════════════════ */

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success',
    info: 'bg-info/10 text-info', secondary: 'bg-secondary/10 text-secondary',
  };
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-base-200/50 border border-base-300">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-black leading-none">{value}</p>
        <p className="text-[10px] uppercase font-black tracking-wider opacity-60 mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function IconBtn({ children, label, onClick, danger }: any) {
  return (
    <button onClick={onClick} title={label} aria-label={label}
      className={`p-1.5 rounded-lg transition ${danger ? 'text-error hover:bg-error hover:text-error-content' : 'text-base-content/60 hover:bg-base-300'}`}>
      {children}
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-base-200 text-left">
      <Icon className="w-3.5 h-3.5 text-primary" /> {label}
    </button>
  );
}

function Field({ label, children }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-black uppercase tracking-wider opacity-60">{label}</label>
      {children}
    </div>
  );
}

function StudentForm({
  mode, formData, setFormData, showPassword, setShowPassword,
  classes, parents, parentField, onSubmit, onCancel, loading,
}: any) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Field label="Admission No *">
        <input required value={formData.admissionNumber} onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Gender *">
        <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={inputCls}>
          <option>Male</option><option>Female</option>
        </select>
      </Field>
      <Field label="First Name *">
        <input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Last Name *">
        <input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputCls} />
      </Field>
      <div className="md:col-span-2">
        <Field label="Middle Name">
          <input value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} className={inputCls} />
        </Field>
      </div>
      <Field label="Email *">
        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
      </Field>
      {mode === 'create' && (
        <Field label="Temporary Password *">
          <div className="flex gap-2">
            <input required minLength={8} type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={`${inputCls} font-mono`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="px-2 rounded-xl border border-base-300 hover:bg-base-200 shrink-0" aria-label="Toggle">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button type="button" onClick={() => setFormData({ ...formData, password: genPassword() })} className="px-2 rounded-xl border border-base-300 hover:bg-base-200 shrink-0" aria-label="Generate">
              <Wand2 className="w-4 h-4" />
            </button>
          </div>
        </Field>
      )}
      <Field label="UPI Number">
        <input value={formData.upiNumber} onChange={(e) => setFormData({ ...formData, upiNumber: e.target.value })} className={inputCls} />
      </Field>
      <Field label="Class">
        <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className={inputCls}>
          <option value="">No class</option>
          {classes.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{c.name || c.className}</option>)}
        </select>
      </Field>
      {mode === 'create' && (
        <div className="md:col-span-2">{parentField(formData.parentId, (v: string) => setFormData({ ...formData, parentId: v }))}</div>
      )}
      <Field label="Date of Birth">
        <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} className={inputCls} />
      </Field>
      <div className="md:col-span-2 flex flex-col-reverse sm:flex-row gap-3 pt-3 mt-2 border-t border-base-300">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-xs uppercase disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-2.5 px-5 rounded-xl hover:opacity-95 shadow-lg shadow-primary/20 text-xs uppercase disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Create</>}
        </button>
      </div>
    </form>
  );
}

function InfoTile({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2.5 rounded-xl bg-base-200/60 border border-base-300/60">
      <p className="text-[9px] font-black uppercase opacity-50">{label}</p>
      <p className="text-xs font-bold mt-0.5 truncate">{value || '—'}</p>
    </div>
  );
}

function Modal({ title, subtitle, icon: Icon, size = 'md', onClose, children }: any) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/55 sm-fade" style={{ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }} onClick={onClose} />
      <div className={`relative w-full ${size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] flex flex-col overflow-hidden bg-base-100 text-base-content rounded-t-3xl sm:rounded-3xl border border-base-300 shadow-2xl sm-pop`}>
        <div className="flex items-start gap-3 p-5 border-b border-base-300 shrink-0 bg-base-200/30">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black truncate">{title}</h3>
            {subtitle && <p className="text-[11px] opacity-60 truncate">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-base-200 shrink-0" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}