import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
  useGetSchoolUsersQuery,
  useGetAllUsersBySuperAdminQuery,
  useGetSchoolUserStatsQuery,
  useCreateSchoolUserMutation,
  useUpdateUserProfileMutation,
  useChangePrimaryRoleMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useBulkActivateUsersMutation,
  useBulkDeactivateUsersMutation,
  useResetUserPasswordMutation,
  useForcePasswordChangeMutation,
  useRevokeAllUserSessionsMutation,
  useGetUserSessionsQuery,
  useDeleteUserMutation,
} from '../../features/Apis/Users.Api';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Search,
  Pencil,
  KeyRound,
  X,
  Loader2,
  Save,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Wand2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════ */

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'school_admin', label: 'School admin' },
];

/** Roles that can be CREATED from this screen. Students are registered via the Student Manager instead. */
const CREATABLE_ROLES = ROLES.filter((r) => r.value !== 'student');

const ROLE_STYLE: Record<string, string> = {
  student: 'bg-info/10 text-info',
  teacher: 'bg-secondary/10 text-secondary',
  parent: 'bg-warning/10 text-warning',
  school_admin: 'bg-primary/10 text-primary',
  admin: 'bg-primary/10 text-primary',
  super_admin: 'bg-error/10 text-error',
};

const roleLabel = (r?: string) =>
  ROLES.find((x) => x.value === r)?.label || (r ? r.replace(/_/g, ' ') : 'User');

const inputCls =
  'w-full px-4 py-3 bg-base-100 border border-base-300 rounded-xl text-sm placeholder:text-base-content/30 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition disabled:opacity-60 disabled:cursor-not-allowed';

const PAGE_SIZE = 20;

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: 'teacher',
  schoolId: '',
  tscNumber: '',
});

const extractList = (res: any): any[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  return res.data || res.users || res.students || [];
};

const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
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

type ModalState =
  | { type: 'create' }
  | { type: 'edit'; user: any }
  | { type: 'security'; user: any }
  | { type: 'delete'; user: any }
  | { type: 'bulk'; activate: boolean }
  | null;

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

export const UserManager: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth || {});
  const schoolId: string = user?.schoolId || user?.user?.schoolId || '';
  const userRole: string = user?.role || user?.user?.role || '';
  const isSuperAdmin = userRole === 'super_admin';
  const currentUserId = user?.id || user?.user?.id;

  const { data: school } = useGetSchoolByIdQuery(schoolId, { skip: !schoolId });
  const schoolName =
    school?.name || user?.schoolName || user?.user?.schoolName || (isSuperAdmin ? 'All schools' : 'Your school');

  /* ── Filters & paging ── */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const baseParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(roleFilter !== 'all' && { role: roleFilter }),
      ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' }),
    }),
    [page, debouncedSearch, roleFilter, statusFilter]
  );

  /* ── Data ── */
  const schoolList = useGetSchoolUsersQuery(
    { schoolId, params: { ...baseParams, includeStudents: true } },
    { skip: isSuperAdmin || !schoolId }
  );
  const adminList = useGetAllUsersBySuperAdminQuery(
    { ...baseParams, ...(schoolId && { schoolId }) },
    { skip: !isSuperAdmin }
  );
  const listQuery = isSuperAdmin ? adminList : schoolList;
  const rows = extractList(listQuery.data);
  const total: number = (listQuery.data as any)?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const statsQuery = useGetSchoolUserStatsQuery(schoolId, { skip: !schoolId });
  const stats = statsQuery.data?.stats;

  /* ── Mutations ── */
  const [createSchoolUser, createState] = useCreateSchoolUserMutation();
  const [updateUserProfile, updateState] = useUpdateUserProfileMutation();
  const [changePrimaryRole] = useChangePrimaryRoleMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [bulkActivate, bulkActivateState] = useBulkActivateUsersMutation();
  const [bulkDeactivate, bulkDeactivateState] = useBulkDeactivateUsersMutation();
  const [deleteUser, deleteState] = useDeleteUserMutation();

  /* ── UI state ── */
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const notify = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    if (type === 'success') setTimeout(() => setToast(null), 4000);
  };
  const errText = (err: any, fallback: string) => err?.data?.message || fallback;

  // ESC closes modal + lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setModal(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!modal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modal]);

  /* ── Selection ── */
  const idOf = (u: any) => u.id || u._id;
  const allSelected = rows.length > 0 && rows.every((u) => selectedIds.includes(idOf(u)));
  const toggleAll = () =>
    setSelectedIds(allSelected ? [] : rows.map(idOf));
  const toggleOne = (id: string) =>
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const changeFilter = (fn: () => void) => {
    fn();
    setPage(1);
    setSelectedIds([]);
  };

  /* ── Actions ── */
  const handleToggleStatus = async (u: any) => {
    const id = idOf(u);
    const active = u.isActive !== false;
    setBusyId(id);
    try {
      await (active ? deactivateUser(id) : activateUser(id)).unwrap();
      notify('success', active ? `${u.name || 'User'} deactivated.` : `${u.name || 'User'} activated.`);
    } catch (err) {
      notify('error', errText(err, 'Could not update user status.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleBulk = async (activate: boolean) => {
    try {
      await (activate ? bulkActivate : bulkDeactivate)({ userIds: selectedIds }).unwrap();
      notify('success', `${selectedIds.length} users ${activate ? 'activated' : 'deactivated'}.`);
      setSelectedIds([]);
      setModal(null);
    } catch (err) {
      notify('error', errText(err, 'Bulk update failed.'));
      setModal(null);
    }
  };

  const handleDelete = async (u: any) => {
    try {
      await deleteUser(idOf(u)).unwrap();
      notify('success', `${u.name || 'User'} deleted.`);
      setSelectedIds((s) => s.filter((x) => x !== idOf(u)));
      setModal(null);
    } catch (err) {
      notify('error', errText(err, 'Failed to delete user.'));
      setModal(null);
    }
  };

  const refreshAll = () => {
    listQuery.refetch();
    if (schoolId) statsQuery.refetch();
  };

  /* ── Guard ── */
  if (!schoolId && !isSuperAdmin) {
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

  const statCards = [
    { label: 'Total users', value: stats?.total ?? (isSuperAdmin ? total : '—'), icon: Users, tone: 'bg-primary/10 text-primary' },
    { label: 'Active', value: stats?.active ?? '—', icon: UserCheck, tone: 'bg-success/10 text-success' },
    { label: 'Inactive', value: stats?.inactive ?? '—', icon: UserX, tone: 'bg-error/10 text-error' },
    { label: 'Never signed in', value: stats?.neverLoggedIn ?? '—', icon: UserMinus, tone: 'bg-warning/10 text-warning' },
  ];

  const bulkLoading = bulkActivateState.isLoading || bulkDeactivateState.isLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 bg-base-100 text-base-content min-h-screen">
      {/* ═════════ HEADER ═════════ */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Users</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Manage admins, teachers, students and parents at {schoolName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="p-3 rounded-xl border border-base-300 hover:bg-base-200 transition"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setModal({ type: 'create' })}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-content font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition"
          >
            <UserPlus className="w-4 h-4" /> Add user
          </button>
        </div>
      </header>

      {/* ═════════ STATS ═════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => {
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
            <button onClick={() => setToast(null)} className="ml-auto text-xs underline">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* ═════════ DIRECTORY ═════════ */}
      <section className="bg-base-200/50 border border-base-300 rounded-3xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row gap-3 lg:items-center border-b border-base-300">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or admission number"
              className={`${inputCls} pl-10 py-2.5`}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => changeFilter(() => setRoleFilter(e.target.value))}
            className={`${inputCls} py-2.5 lg:w-44`}
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => changeFilter(() => setStatusFilter(e.target.value as any))}
            className={`${inputCls} py-2.5 lg:w-40`}
            aria-label="Filter by status"
          >
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Bulk bar */}
        {selectedIds.length > 0 && (
          <div className="px-5 py-3 bg-primary/10 border-b border-primary/20 flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold text-primary">{selectedIds.length} selected</p>
            <button
              onClick={() => setModal({ type: 'bulk', activate: true })}
              className="px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs font-bold hover:bg-success hover:text-success-content transition"
            >
              Activate
            </button>
            <button
              onClick={() => setModal({ type: 'bulk', activate: false })}
              className="px-3 py-1.5 rounded-lg bg-warning/15 text-warning text-xs font-bold hover:bg-warning hover:text-warning-content transition"
            >
              Deactivate
            </button>
            <button onClick={() => setSelectedIds([])} className="ml-auto text-xs underline text-base-content/60">
              Clear selection
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto bg-base-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-base-content/50 border-b border-base-300">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="checkbox checkbox-sm checkbox-primary"
                    aria-label="Select all on this page"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Admission / phone</th>
                <th className="px-4 py-3 font-semibold">Last sign-in</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {listQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <span className="loading loading-spinner text-primary" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-base-content/50">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">No users match these filters</p>
                    <p className="text-xs mt-1">Try a different search, or add a new user.</p>
                  </td>
                </tr>
              ) : (
                rows.map((u: any) => {
                  const id = idOf(u);
                  const active = u.isActive !== false;
                  const isSelf = id === currentUserId;
                  return (
                    <tr key={id} className="hover:bg-base-200/40 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(id)}
                          onChange={() => toggleOne(id)}
                          disabled={isSelf}
                          className="checkbox checkbox-sm checkbox-primary"
                          aria-label={`Select ${u.name}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0">
                              {(u.name || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold truncate">
                              {u.name || 'Unnamed'} {isSelf && <span className="text-xs font-normal text-base-content/40">(you)</span>}
                            </p>
                            <p className="text-xs text-base-content/50 truncate">{u.email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ROLE_STYLE[u.role] || 'bg-base-300 text-base-content'}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-base-content/70">
                        {u.admissionNumber || u.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-base-content/60 whitespace-nowrap">
                        {timeAgo(u.lastLoginAt)}
                        {u.mustChangePassword && (
                          <span className="block text-warning font-semibold">Must change password</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            active ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-success' : 'bg-error'}`} />
                          {active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <IconBtn label="Edit user" onClick={() => setModal({ type: 'edit', user: u })}>
                            <Pencil className="w-4 h-4" />
                          </IconBtn>
                          <IconBtn label="Password & sessions" onClick={() => setModal({ type: 'security', user: u })}>
                            <KeyRound className="w-4 h-4" />
                          </IconBtn>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf || busyId === id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:opacity-40 ${
                              active
                                ? 'bg-warning/10 text-warning hover:bg-warning hover:text-warning-content'
                                : 'bg-success/10 text-success hover:bg-success hover:text-success-content'
                            }`}
                          >
                            {busyId === id ? '…' : active ? 'Deactivate' : 'Activate'}
                          </button>
                          <IconBtn
                            label="Delete user"
                            danger
                            disabled={isSelf}
                            onClick={() => setModal({ type: 'delete', user: u })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconBtn>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 flex items-center justify-between text-xs text-base-content/60 border-t border-base-300">
          <span>
            {total} {total === 1 ? 'user' : 'users'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); setSelectedIds([]); }}
              disabled={page <= 1}
              className="p-2 rounded-lg border border-base-300 hover:bg-base-200 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setSelectedIds([]); }}
              disabled={page >= totalPages}
              className="p-2 rounded-lg border border-base-300 hover:bg-base-200 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ═════════ MODALS (portal → whole screen blurred, sidebar included) ═════════ */}
      {modal?.type === 'create' && (
        <Modal title="Add user" subtitle={`New account for ${schoolName}.`} icon={UserPlus} onClose={() => setModal(null)}>
          <CreateUserForm
            schoolId={schoolId}
            schoolName={schoolName}
            isSuperAdmin={isSuperAdmin}
            loading={createState.isLoading}
            onCancel={() => setModal(null)}
            onSubmit={async (payload) => {
              try {
                await createSchoolUser(payload).unwrap();
                notify('success', 'User created successfully.');
                setModal(null);
              } catch (err) {
                notify('error', errText(err, 'Error creating user.'));
                setModal(null);
              }
            }}
          />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit user" subtitle={modal.user.email || modal.user.name} icon={Pencil} onClose={() => setModal(null)}>
          <EditUserForm
            user={modal.user}
            loading={updateState.isLoading}
            onCancel={() => setModal(null)}
            onSubmit={async (body, newRole) => {
              try {
                await updateUserProfile({ userId: idOf(modal.user), body }).unwrap();
                if (newRole && newRole !== modal.user.role) {
                  await changePrimaryRole({ userId: idOf(modal.user), role: newRole }).unwrap();
                }
                notify('success', 'User updated.');
                setModal(null);
              } catch (err) {
                notify('error', errText(err, 'Failed to update user.'));
                setModal(null);
              }
            }}
          />
        </Modal>
      )}

      {modal?.type === 'security' && (
        <Modal title="Password & sessions" subtitle={modal.user.name || modal.user.email} icon={KeyRound} onClose={() => setModal(null)}>
          <SecurityPanel
            user={modal.user}
            onDone={(type, text) => {
              notify(type, text);
              if (type === 'success') setModal(null);
            }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <Modal title="Delete user" subtitle="This cannot be undone from here." icon={ShieldAlert} danger onClose={() => setModal(null)}>
          <p className="text-sm">
            You are about to delete <strong>{modal.user.name || modal.user.email}</strong>. They will lose access immediately.
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 mt-5 border-t border-base-300">
            <button onClick={() => setModal(null)} disabled={deleteState.isLoading} className="px-6 py-3 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-sm transition disabled:opacity-50">
              Keep user
            </button>
            <button
              onClick={() => handleDelete(modal.user)}
              disabled={deleteState.isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-error text-error-content font-bold text-sm shadow-md disabled:opacity-60 transition"
            >
              {deleteState.isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</> : <><Trash2 className="w-4 h-4" /> Delete user</>}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'bulk' && (
        <Modal
          title={modal.activate ? 'Activate users' : 'Deactivate users'}
          subtitle={`${selectedIds.length} selected`}
          icon={modal.activate ? UserCheck : UserX}
          onClose={() => setModal(null)}
        >
          <p className="text-sm">
            {modal.activate
              ? `${selectedIds.length} users will be able to sign in again.`
              : `${selectedIds.length} users will be signed out and blocked from signing in until reactivated.`}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-5 mt-5 border-t border-base-300">
            <button onClick={() => setModal(null)} disabled={bulkLoading} className="px-6 py-3 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-sm transition disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={() => handleBulk(modal.activate)}
              disabled={bulkLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm shadow-md disabled:opacity-60 transition ${
                modal.activate ? 'bg-success text-success-content' : 'bg-warning text-warning-content'
              }`}
            >
              {bulkLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Working…</> : modal.activate ? 'Activate users' : 'Deactivate users'}
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        @keyframes um-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes um-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .um-fade { animation: um-fade 0.2s ease-out both; }
        .um-pop  { animation: um-pop 0.26s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .um-fade, .um-pop { animation: none !important; } }
      `}</style>
    </div>
  );
};

export default UserManager;

/* ═══════════════════════════════════════════════════════
   FORMS
   ═══════════════════════════════════════════════════════ */

function CreateUserForm({
  schoolId, schoolName, isSuperAdmin, loading, onSubmit, onCancel,
}: {
  schoolId: string;
  schoolName: string;
  isSuperAdmin: boolean;
  loading: boolean;
  onSubmit: (payload: any) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({ ...emptyForm(), schoolId });
  const set = (k: keyof ReturnType<typeof emptyForm>, v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: f.name.trim(),
      email: f.email.trim(),
      password: f.password,
      role: f.role,
      schoolId: f.schoolId,
    };
    if (f.phone) payload.phone = f.phone;
    if (f.role === 'teacher' && f.tscNumber) payload.tscNumber = f.tscNumber;
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="School">
          {isSuperAdmin && !schoolId ? (
            <input type="text" required value={f.schoolId} onChange={(e) => set('schoolId', e.target.value)} placeholder="School ID" className={inputCls} />
          ) : (
            <input type="text" value={schoolName} disabled className={inputCls} />
          )}
        </Field>
        <Field label="Role">
          <select data-autofocus value={f.role} onChange={(e) => set('role', e.target.value)} className={inputCls}>
            {CREATABLE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Full name *">
          <input type="text" required value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Mary Wanjiku" className={inputCls} />
        </Field>
        <Field label="Email *">
          <input type="email" required value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="user@school.com" className={inputCls} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="07…" className={inputCls} />
        </Field>
        <Field label="Temporary password *">
          <div className="flex gap-2">
            <input type="text" required minLength={8} value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="At least 8 characters" className={`${inputCls} font-mono`} />
            <button type="button" onClick={() => set('password', genPassword())} className="px-3 rounded-xl border border-base-300 hover:bg-base-200 transition shrink-0" title="Generate password" aria-label="Generate password">
              <Wand2 className="w-4 h-4" />
            </button>
          </div>
        </Field>

        {f.role === 'teacher' && (
          <Field label="TSC number">
            <input type="text" value={f.tscNumber} onChange={(e) => set('tscNumber', e.target.value)} className={inputCls} />
          </Field>
        )}
      </div>
      <ModalFooter onCancel={onCancel} loading={loading} label="Create user" />
    </form>
  );
}

function EditUserForm({
  user, loading, onSubmit, onCancel,
}: {
  user: any;
  loading: boolean;
  onSubmit: (body: any, role?: string) => void;
  onCancel: () => void;
}) {
  const [f, setF] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    tscNumber: user.tscNumber || '',
    role: user.role || 'teacher',
  });
  const isTeacher = f.role === 'teacher';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(
          {
            name: f.name.trim(),
            email: f.email.trim(),
            phone: f.phone || undefined,
            ...(isTeacher && { tscNumber: f.tscNumber || undefined }),
          },
          f.role
        );
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Full name *">
          <input type="text" data-autofocus required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Email *">
          <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Phone">
          <input type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Primary role">
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} className={inputCls}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            {!ROLES.some((r) => r.value === user.role) && <option value={user.role}>{roleLabel(user.role)}</option>}
          </select>
        </Field>
        {isTeacher && (
          <Field label="TSC number">
            <input type="text" value={f.tscNumber} onChange={(e) => setF({ ...f, tscNumber: e.target.value })} className={inputCls} />
          </Field>
        )}
      </div>
      <ModalFooter onCancel={onCancel} loading={loading} label="Save changes" />
    </form>
  );
}

function SecurityPanel({
  user, onDone, onCancel,
}: {
  user: any;
  onDone: (type: 'success' | 'error', text: string) => void;
  onCancel: () => void;
}) {
  const userId = user.id || user._id;
  const { data: sessionsRes, isLoading: loadingSessions } = useGetUserSessionsQuery({ userId, activeOnly: true });
  const [resetUserPassword, resetState] = useResetUserPasswordMutation();
  const [forcePasswordChange, forceState] = useForcePasswordChangeMutation();
  const [revokeAll, revokeState] = useRevokeAllUserSessionsMutation();

  const [pw, setPw] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const [revoke, setRevoke] = useState(true);

  const sessions = sessionsRes?.sessions || [];
  const err = (e: any, fb: string) => e?.data?.message || fb;

  return (
    <div className="space-y-6">
      {/* Reset password */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await resetUserPassword({ userId, newPassword: pw, mustChangePassword: mustChange, revokeSessions: revoke }).unwrap();
            onDone('success', 'Password reset.');
          } catch (error) {
            onDone('error', err(error, 'Could not reset password.'));
          }
        }}
        className="space-y-3"
      >
        <p className="text-sm font-bold">Reset password</p>
        <div className="flex gap-2">
          <input
            type="text"
            data-autofocus
            required
            minLength={8}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password (8+ characters)"
            className={`${inputCls} font-mono`}
          />
          <button type="button" onClick={() => setPw(genPassword())} className="px-3 rounded-xl border border-base-300 hover:bg-base-200 transition shrink-0" aria-label="Generate password" title="Generate password">
            <Wand2 className="w-4 h-4" />
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={mustChange} onChange={(e) => setMustChange(e.target.checked)} className="checkbox checkbox-sm checkbox-primary" />
          Ask them to change it at next sign-in
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} className="checkbox checkbox-sm checkbox-primary" />
          Sign them out of all devices
        </label>
        <button
          type="submit"
          disabled={resetState.isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-content font-bold text-sm shadow-md disabled:opacity-60 transition"
        >
          {resetState.isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : <><KeyRound className="w-4 h-4" /> Reset password</>}
        </button>
      </form>

      {/* Sessions */}
      <div className="pt-5 border-t border-base-300 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold">Active sessions</p>
          <span className="text-xs text-base-content/60">
            {loadingSessions ? 'Loading…' : `${sessions.length} active`}
          </span>
        </div>
        {sessions.length > 0 && (
          <ul className="space-y-2 max-h-40 overflow-y-auto">
            {sessions.map((s) => (
              <li key={s.id} className="px-3 py-2 rounded-xl bg-base-200/60 border border-base-300 text-xs">
                <p className="font-semibold truncate">{s.userAgent || 'Unknown device'}</p>
                <p className="text-base-content/50">
                  {s.ipAddress || 'Unknown IP'} · last used {timeAgo(s.lastUsedAt || s.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={async () => {
              try {
                await revokeAll(userId).unwrap();
                onDone('success', 'All sessions revoked.');
              } catch (error) {
                onDone('error', err(error, 'Could not revoke sessions.'));
              }
            }}
            disabled={revokeState.isLoading || sessions.length === 0}
            className="flex-1 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 text-sm font-bold transition disabled:opacity-40"
          >
            {revokeState.isLoading ? 'Revoking…' : 'Sign out everywhere'}
          </button>
          <button
            onClick={async () => {
              try {
                await forcePasswordChange(userId).unwrap();
                onDone('success', 'They will be asked to change their password.');
              } catch (error) {
                onDone('error', err(error, 'Could not force a password change.'));
              }
            }}
            disabled={forceState.isLoading}
            className="flex-1 py-2.5 rounded-xl border border-base-300 hover:bg-base-200 text-sm font-bold transition disabled:opacity-40"
          >
            {forceState.isLoading ? 'Working…' : 'Force password change'}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-base-300">
        <button onClick={onCancel} className="w-full py-3 rounded-xl border border-base-300 hover:bg-base-200 font-bold text-sm transition">
          Close
        </button>
      </div>
    </div>
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

/**
 * Rendered through a portal into <body>, so the blurred backdrop covers the
 * ENTIRE screen, including the sidebar and navbar.
 */
function Modal({
  title, subtitle, icon: Icon, danger, onClose, children,
}: {
  title: string;
  subtitle?: string;
  icon: any;
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
        className="absolute inset-0 bg-black/50 um-fade"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="relative w-full sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden bg-base-100 text-base-content rounded-t-3xl sm:rounded-3xl border border-base-300 shadow-2xl um-pop"
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