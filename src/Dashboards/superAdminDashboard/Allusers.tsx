import { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  Trash2, 
  Edit, 
  Mail, 
  Phone, 
  Building2, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  AlertTriangle,
  Eye,
  Calendar,
  Shield,
  CreditCard,
  Hash,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { 
  useGetAllUsersBySuperAdminQuery, 
  useUpdateUserMutation, 
  useDeleteUserMutation, 
  useUpdateUserStatusMutation, 
  useBulkUpdateUserStatusMutation 
} from "../../features/Apis/Users.Api"; 
import { useGetAllSchoolsQuery } from "../../features/Apis/School.Api";

export default function SuperAdminUsersPage() {
  // Local state for pagination, search, filters, and modals
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [schoolIdFilter, setSchoolIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Selection state for bulk operations
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Notification / Confirmation Toast States
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
    isDestructive?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDestructive: false,
  });

  // Form states (Edit only - Creation modal completely removed)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    phone: "",
    schoolId: "",
    nationalId: "",
    tscNumber: "",
    admissionNumber: "",
  });

  // RTK Query Hooks
  const { data: usersResponse, isLoading, isError, refetch } = useGetAllUsersBySuperAdminQuery({
    page,
    limit,
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(schoolIdFilter && { schoolId: schoolIdFilter }),
    ...(statusFilter !== "" && { isActive: statusFilter === "true" }),
  });

  const { data: schoolsData } = useGetAllSchoolsQuery();
  const schoolsList = schoolsData?.schools || [];

  // Map school ID to school name dynamically
  const getSchoolName = (schoolId: string) => {
    if (!schoolId) return 'Global / System';
    const foundSchool = schoolsList.find((s) => s.id === schoolId);
    return foundSchool ? foundSchool.name : `${schoolId.slice(0, 10)}...`;
  };

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [bulkUpdateStatus] = useBulkUpdateUserStatusMutation();

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handlers
  const handleSelectAll = () => {
    const usersList = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || usersResponse?.users || [];
    if (selectedUserIds.length === usersList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(usersList.map((u: any) => u.id));
    }
  };

  const handleSelectUser = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleStatus = (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? "Deactivate User Account" : "Activate User Account",
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`,
      isDestructive: currentStatus,
      onConfirm: async () => {
        try {
          await updateUserStatus({ userId: id, isActive: !currentStatus }).unwrap();
          showToast('success', `User successfully ${currentStatus ? 'deactivated' : 'activated'}.`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast('error', err?.data?.message || 'Failed to update user status.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: "Delete User",
      message: "Are you sure you want to permanently delete this user? This action cannot be undone.",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteUser(id).unwrap();
          showToast('success', 'User deleted successfully.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast('error', err?.data?.message || 'Failed to delete user.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkStatusChange = (isActive: boolean) => {
    if (selectedUserIds.length === 0) return;
    if (!schoolIdFilter) {
      showToast('error', 'Please select a specific School filter when performing bulk operations.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: isActive ? "Bulk Activate Users" : "Bulk Deactivate Users",
      message: `Are you sure you want to ${isActive ? 'activate' : 'deactivate'} ${selectedUserIds.length} selected users?`,
      isDestructive: !isActive,
      onConfirm: async () => {
        try {
          await bulkUpdateStatus({
            schoolId: schoolIdFilter,
            userIds: selectedUserIds,
            isActive,
          }).unwrap();
          setSelectedUserIds([]);
          showToast('success', `Successfully ${isActive ? 'activated' : 'deactivated'} selected users.`);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err: any) {
          showToast('error', err?.data?.message || 'Bulk operation failed.');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        schoolId: formData.schoolId || undefined,
        nationalId: formData.nationalId || undefined,
        tscNumber: formData.tscNumber || undefined,
        admissionNumber: formData.admissionNumber || undefined,
      };

      await updateUser({
        userId: currentUser.id,
        body: payload
      }).unwrap();

      setIsEditModalOpen(false);
      setCurrentUser(null);
      showToast('success', 'User profile updated successfully.');
    } catch (err: any) {
      showToast('error', err?.data?.message || 'Failed to update user profile.');
    }
  };

  const openEditModal = (user: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "student",
      phone: user.phone || "",
      schoolId: user.schoolId || "",
      nationalId: user.nationalId || "",
      tscNumber: user.tscNumber || "",
      admissionNumber: user.admissionNumber || "",
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (user: any) => {
    setCurrentUser(user);
    setIsDetailModalOpen(true);
  };

  const usersList = Array.isArray(usersResponse) ? usersResponse : usersResponse?.data || usersResponse?.users || [];
  const totalPages = Math.ceil((usersList.length) / limit) || 1;
  const totalUsers =  usersList.length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1"><Shield className="w-3 h-3" /> Super Admin</span>;
      case 'school_admin':
      case 'admin':
        return <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Admin</span>;
      case 'teacher':
        return <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-black rounded-full uppercase tracking-wider">Teacher</span>;
      case 'bursar':
        return <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black rounded-full uppercase tracking-wider">Bursar</span>;
      case 'student':
        return <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black rounded-full uppercase tracking-wider">Student</span>;
      default:
        return <span className="px-2.5 py-0.5 bg-base-300 text-base-content text-[11px] font-black rounded-full uppercase tracking-wider">{role?.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-base-200/40 p-4 sm:p-8 space-y-8 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-bounce">
          <div className={`alert ${toastMessage.type === 'success' ? 'alert-success' : 'alert-error'} shadow-xl text-white font-bold rounded-2xl flex items-center gap-2`}>
            {toastMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-100 p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-base-300  mt-9">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" /> Super Admin Control Panel
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content">
            System-Wide User Directory ({totalUsers} total)
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70">
            Monitor users across all institutions, inspect school assignments, and manage system access privileges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()} 
            className="btn btn-ghost btn-circle bg-base-200/80 hover:bg-base-300 border border-base-300"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-base-100 p-5 rounded-3xl shadow-lg border border-base-300 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input 
            type="text" 
            placeholder="Search name, email, admission..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input input-bordered w-full pl-11 rounded-2xl bg-base-200/50 text-sm font-medium border-base-300 focus:border-primary"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <select 
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="select select-bordered w-full pl-11 rounded-2xl bg-base-200/50 text-sm font-medium border-base-300 focus:border-primary"
          >
            <option value="">All Roles (Global)</option>
            <option value="super_admin">Super Admin</option>
            <option value="school_admin">School Admin</option>
            <option value="teacher">Teacher</option>
            <option value="bursar">Bursar</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="select select-bordered w-full pl-11 rounded-2xl bg-base-200/50 text-sm font-medium border-base-300 focus:border-primary"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* School Filter using School Names instead of UUID */}
        <div className="relative">
          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <select 
            value={schoolIdFilter}
            onChange={(e) => { setSchoolIdFilter(e.target.value); setPage(1); }}
            className="select select-bordered w-full pl-11 rounded-2xl bg-base-200/50 text-sm font-medium border-base-300 focus:border-primary"
          >
            <option value="">All Schools</option>
            {schoolsList.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Bulk Actions Toolbar (Conditional) */}
      {selectedUserIds.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-2xl flex items-center justify-between animate-fadeIn">
          <span className="text-xs font-black uppercase tracking-wider text-primary px-2">
            {selectedUserIds.length} users selected
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleBulkStatusChange(true)}
              className="btn btn-sm bg-success text-success-content font-bold rounded-xl border-none"
            >
              Activate Selected
            </button>
            <button 
              onClick={() => handleBulkStatusChange(false)}
              className="btn btn-sm bg-error text-error-content font-bold rounded-xl border-none"
            >
              Deactivate Selected
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 overflow-hidden">
        {isLoading ? (
          <div className="py-24 text-center space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-xs font-bold uppercase tracking-widest text-base-content/60">Loading System Users...</p>
          </div>
        ) : isError ? (
          <div className="py-24 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-error mx-auto" />
            <p className="text-sm font-bold text-base-content">Failed to load system users repository.</p>
            <button onClick={() => refetch()} className="btn btn-sm btn-outline btn-primary rounded-xl">Try Again</button>
          </div>
        ) : usersList.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <Users className="w-12 h-12 text-base-content/30 mx-auto" />
            <p className="text-base font-bold text-base-content/70">No users found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="border-b border-base-300 bg-base-200/40 text-xs uppercase font-black text-base-content/60">
                  <th className="w-12 text-center">
                    <button onClick={handleSelectAll} className="cursor-pointer">
                      {selectedUserIds.length === usersList.length ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th>User Profile</th>
                  <th>Role &amp; Status</th>
                  <th>Contact Information</th>
                  <th>Identifiers</th>
                  <th>Assigned School</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {usersList.map((user: any) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => openDetailModal(user)}
                      className="hover:bg-base-200/40 transition-colors cursor-pointer"
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <button onClick={(e) => handleSelectUser(user.id, e)} className="cursor-pointer">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-base-content/40" />}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase shadow-sm">
                            {user.name?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-base-content">{user.name}</div>
                            <div className="text-xs text-base-content/60 font-mono">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {getRoleBadge(user.role)}
                          <div>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${user.isActive !== false ? 'text-success' : 'text-error'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-success' : 'bg-error'}`}></span>
                              {user.isActive !== false ? 'Active' : 'Deactivated'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-base-content/80">
                            <Mail className="w-3.5 h-3.5 text-primary" /> {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-base-content/60">
                              <Phone className="w-3.5 h-3.5" /> {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="space-y-1 text-xs">
                          {user.nationalId && (
                            <div className="flex items-center gap-1 text-base-content/80 font-mono">
                              <CreditCard className="w-3 h-3 text-primary" /> <span>NatID: {user.nationalId}</span>
                            </div>
                          )}
                          {user.tscNumber && (
                            <div className="flex items-center gap-1 text-base-content/80 font-mono">
                              <Hash className="w-3 h-3 text-secondary" /> <span>TSC: {user.tscNumber}</span>
                            </div>
                          )}
                          {user.admissionNumber && (
                            <div className="flex items-center gap-1 text-base-content/80 font-mono">
                              <Hash className="w-3 h-3 text-accent" /> <span>Adm: {user.admissionNumber}</span>
                            </div>
                          )}
                          {!user.nationalId && !user.tscNumber && !user.admissionNumber && (
                            <span className="italic opacity-40">None specified</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-bold text-base-content/80 bg-base-200/70 px-3 py-1.5 rounded-xl border border-base-300 inline-block">
                          {getSchoolName(user.schoolId)}
                        </div>
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openDetailModal(user)}
                            className="btn btn-square btn-ghost btn-sm rounded-xl text-info hover:bg-info/10"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleToggleStatus(user.id, user.isActive !== false, e)}
                            className={`btn btn-square btn-ghost btn-sm rounded-xl ${user.isActive !== false ? 'text-warning hover:bg-warning/10' : 'text-success hover:bg-success/15'}`}
                            title={user.isActive !== false ? 'Deactivate User' : 'Activate User'}
                          >
                            {user.isActive !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={(e) => openEditModal(user, e)}
                            className="btn btn-square btn-ghost btn-sm rounded-xl text-primary hover:bg-primary/10"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(user.id, e)}
                            className="btn btn-square btn-ghost btn-sm rounded-xl text-error hover:bg-error/10"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <div className="p-4 border-t border-base-300 flex items-center justify-between bg-base-200/20">
          <span className="text-xs font-bold text-base-content/60">
            Page {page} of {totalPages} ({totalUsers} total users)
          </span>
          <div className="join">
            <button 
              onClick={() => setPage(p => Math.max(p - 1, 1))} 
              disabled={page === 1}
              className="join-item btn btn-sm rounded-xl"
            >
              Prev
            </button>
            <button 
              onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
              disabled={page >= totalPages}
              className="join-item btn btn-sm rounded-xl"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="modal modal-open backdrop-blur-sm bg-black/40 z-50">
          <div className="modal-box bg-base-100 rounded-3xl p-6 sm:p-8 space-y-4 max-w-sm border border-base-300 shadow-2xl text-center">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${confirmModal.isDestructive ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-base-content">{confirmModal.title}</h3>
            <p className="text-xs text-base-content/70">{confirmModal.message}</p>
            <div className="modal-action grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} 
                className="btn btn-ghost rounded-2xl font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={confirmModal.onConfirm} 
                className={`btn rounded-2xl font-black text-white ${confirmModal.isDestructive ? 'btn-error' : 'btn-primary'}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {isDetailModalOpen && currentUser && (
        <div className="modal modal-open backdrop-blur-sm bg-black/40">
          <div className="modal-box bg-base-100 rounded-3xl p-8 space-y-6 max-w-xl border border-base-300 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-base-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black uppercase text-xl">
                  {currentUser.name?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-black text-base-content">{currentUser.name}</h3>
                  <p className="text-xs text-base-content/60">{currentUser.email}</p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">User ID</span>
                <span className="font-mono text-xs text-base-content/80 break-all">{currentUser.id}</span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Assigned School</span>
                <span className="font-bold text-xs text-primary">{getSchoolName(currentUser.schoolId)}</span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Role &amp; Privileges</span>
                <div className="pt-1">{getRoleBadge(currentUser.role)}</div>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Account Status</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold pt-1 ${currentUser.isActive !== false ? 'text-success' : 'text-error'}`}>
                  <span className={`w-2 h-2 rounded-full ${currentUser.isActive !== false ? 'bg-success' : 'bg-error'}`}></span>
                  {currentUser.isActive !== false ? 'Active Account' : 'Deactivated'}
                </span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Phone Number</span>
                <span className="text-xs text-base-content/80">{currentUser.phone || 'Not Provided'}</span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">National ID</span>
                <span className="text-xs font-mono text-base-content/80">{currentUser.nationalId || 'Not Provided'}</span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">TSC Number</span>
                <span className="text-xs font-mono text-base-content/80">{currentUser.tscNumber || 'Not Provided'}</span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Admission Number</span>
                <span className="text-xs font-mono text-base-content/80">{currentUser.admissionNumber || 'Not Provided'}</span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Last Login</span>
                <span className="text-xs text-base-content/80 flex items-center gap-1.5 pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {currentUser.lastLoginAt ? new Date(currentUser.lastLoginAt).toLocaleString() : 'Never'}
                </span>
              </div>

              <div className="bg-base-200/50 p-4 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] text-base-content/50 uppercase font-bold tracking-wider block">Created Date</span>
                <span className="text-xs text-base-content/80 flex items-center gap-1.5 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="modal-action pt-4">
              <button onClick={() => setIsDetailModalOpen(false)} className="btn btn-primary w-full rounded-2xl font-bold">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="modal modal-open backdrop-blur-sm bg-black/40">
          <div className="modal-box bg-base-100 rounded-3xl p-8 space-y-6 max-w-lg border border-base-300 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-base-content">Edit User Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="btn btn-sm btn-circle btn-ghost">✕</button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input input-bordered rounded-2xl bg-base-200/50" 
                />
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="input input-bordered rounded-2xl bg-base-200/50" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label text-xs font-bold uppercase tracking-wider">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="select select-bordered rounded-2xl bg-base-200/50"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="school_admin">School Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="bursar">Bursar</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label text-xs font-bold uppercase tracking-wider">Phone</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input input-bordered rounded-2xl bg-base-200/50" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="form-control">
                  <label className="label text-[10px] font-bold uppercase tracking-wider">National ID</label>
                  <input 
                    type="text" 
                    value={formData.nationalId}
                    onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
                    className="input input-bordered rounded-2xl bg-base-200/50 text-xs font-mono" 
                  />
                </div>
                <div className="form-control">
                  <label className="label text-[10px] font-bold uppercase tracking-wider">TSC Number</label>
                  <input 
                    type="text" 
                    value={formData.tscNumber}
                    onChange={(e) => setFormData({...formData, tscNumber: e.target.value})}
                    className="input input-bordered rounded-2xl bg-base-200/50 text-xs font-mono" 
                  />
                </div>
                <div className="form-control">
                  <label className="label text-[10px] font-bold uppercase tracking-wider">Admission No.</label>
                  <input 
                    type="text" 
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({...formData, admissionNumber: e.target.value})}
                    className="input input-bordered rounded-2xl bg-base-200/50 text-xs font-mono" 
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label text-xs font-bold uppercase tracking-wider">School Assignment</label>
                <select 
                  value={formData.schoolId}
                  onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                  className="select select-bordered rounded-2xl bg-base-200/50 text-sm font-medium"
                >
                  <option value="">Global / No School</option>
                  {schoolsList.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-action pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-ghost rounded-2xl font-bold">Cancel</button>
                <button type="submit" disabled={isUpdating} className="btn btn-primary rounded-2xl font-black px-6 shadow-lg shadow-primary/20">
                  {isUpdating ? <span className="loading loading-spinner"></span> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}