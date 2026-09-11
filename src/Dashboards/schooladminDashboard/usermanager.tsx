import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetStudentsBySchoolQuery,
  useGetTeachersBySchoolQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserStatusMutation,
  useBulkUpdateUserStatusMutation,
} from '../../features/Apis/Users.Api';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import { 
  Users, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Building,
  RefreshCw,
  Search,
  Filter,
  UserX
} from 'lucide-react';

export const UserManager: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth || {});
  const schoolId = user?.schoolId || user?.user?.schoolId || '';
  const userRole = user?.role || user?.user?.role || '';
  const isSuperAdmin = userRole === 'super_admin';

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !schoolId,
  });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';

  // Role-tailored fetching states & controls
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Fetching lists based on role context
  const { 
    data: studentsResponse, 
    isLoading: isLoadingStudents, 
    refetch: refetchStudents 
  } = useGetStudentsBySchoolQuery(schoolId, {
    skip: !schoolId || (!isSuperAdmin && userRole !== 'school_admin' && userRole !== 'admin'),
    refetchOnMountOrArgChange: true,
  });

  const { 
    data: teachersResponse, 
    isLoading: isLoadingTeachers, 
    refetch: refetchTeachers 
  } = useGetTeachersBySchoolQuery(schoolId, {
    skip: !schoolId || (!isSuperAdmin && userRole !== 'school_admin' && userRole !== 'admin'),
    refetchOnMountOrArgChange: true,
  });

  // General fallback / Super Admin query handler
  const { 
    data: generalUsersResponse, 
    isLoading: isLoadingGeneral, 
    refetch: refetchGeneral 
  } = useGetUsersQuery(
    isSuperAdmin ? { page: 1, limit: 100, ...(schoolId && { schoolId }) } : { schoolId, page: 1, limit: 100 },
    { skip: !schoolId && !isSuperAdmin }
  );

  const students = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse?.data || studentsResponse?.students || []);
  const teachers = Array.isArray(teachersResponse) ? teachersResponse : (teachersResponse?.data || teachersResponse?.users || []);
  const generalUsers = Array.isArray(generalUsersResponse) ? generalUsersResponse : (generalUsersResponse?.data || generalUsersResponse?.users || []);

  // Combine and de-duplicate lists for admin management view
  const combinedUsersMap = new Map();
  [...generalUsers, ...students, ...teachers].forEach((u: any) => {
    const id = u.id || u._id;
    if (id) combinedUsersMap.set(id, u);
  });
  const allManagedUsers = Array.from(combinedUsersMap.values());

  // Filter users by search term and role
  const filteredUsers = allManagedUsers.filter((u: any) => {
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.admissionNumber && u.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [bulkUpdateStatus] = useBulkUpdateUserStatusMutation();

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    admissionNumber: '',
    upiNumber: '',
    parentId: '',
    classId: '',
    dateOfBirth: '',
    gender: 'Male',
    enrollmentDate: new Date().toISOString().split('T')[0],
    isEnrolled: true,
  });

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await createUser({ ...formData, schoolId }).unwrap();
      setSuccessMessage('User created successfully!');
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'student',
        admissionNumber: '',
        upiNumber: '',
        parentId: '',
        classId: '',
        dateOfBirth: '',
        gender: 'Male',
        enrollmentDate: new Date().toISOString().split('T')[0],
        isEnrolled: true,
      });
      setActiveTab('list');
      refetchStudents();
      refetchTeachers();
      refetchGeneral();
    } catch (err: any) {
      console.error('Failed to create user:', err);
      setErrorMessage(err?.data?.message || 'Error creating user profile');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setSuccessMessage('');
      setErrorMessage('');
      try {
        await deleteUser(userId).unwrap();
        setSuccessMessage('User deleted successfully.');
        refetchStudents();
        refetchTeachers();
        refetchGeneral();
      } catch (err: any) {
        console.error('Failed to delete user:', err);
        setErrorMessage(err?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await updateUserStatus({ userId, isActive: !currentStatus }).unwrap();
      setSuccessMessage('User status updated successfully.');
      refetchStudents();
      refetchTeachers();
      refetchGeneral();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setErrorMessage(err?.data?.message || 'Failed to update user status.');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`Deactivate ${selectedUserIds.length} selected users?`)) {
      try {
        await bulkUpdateStatus({ schoolId, userIds: selectedUserIds, isActive: false }).unwrap();
        setSuccessMessage('Selected users deactivated successfully.');
        setSelectedUserIds([]);
        refetchStudents();
        refetchTeachers();
        refetchGeneral();
      } catch (err: any) {
        setErrorMessage(err?.data?.message || 'Bulk status update failed.');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u: any) => u.id || u._id));
    }
  };

  const toggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(item => item !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const isLoadingData = isLoadingStudents || isLoadingTeachers || isLoadingGeneral;

  if (!schoolId && !isSuperAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-error font-bold">
        Error: School ID not found in session. Please log in again.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-8 sm:p-10 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-content text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" /> Administration Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">School User Management</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Manage school admins, teachers, students, and parent accounts for {schoolName}.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => { refetchStudents(); refetchTeachers(); refetchGeneral(); }}
              className="p-3 bg-base-100/80 backdrop-blur-md rounded-2xl border border-base-300 shadow-sm hover:bg-base-200 transition-all cursor-pointer text-primary"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider opacity-65">Total Managed Users</p>
                <p className="text-lg font-black text-primary">{allManagedUsers.length} Users</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-base-300 pb-4 gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'list' 
              ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
              : 'bg-base-200 text-base-content hover:bg-base-300'
          }`}
        >
          User Directory
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'create' 
              ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
              : 'bg-base-200 text-base-content hover:bg-base-300'
          }`}
        >
          Add New User
        </button>
      </div>

      {/* Tab Content: List */}
      {activeTab === 'list' && (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Institution Users Directory</h2>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {selectedUserIds.length > 0 && (
                <button
                  onClick={handleBulkDeactivate}
                  className="px-4 py-2.5 bg-error/10 text-error hover:bg-error hover:text-error-content rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <UserX className="w-4 h-4" /> Deactivate Selected ({selectedUserIds.length})
                </button>
              )}
              
              <div className="relative flex-1 md:w-64">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search name, email, admission..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
                  <Filter className="w-3.5 h-3.5" />
                </span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-base-100 border border-base-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase tracking-wider cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="school_admin">School Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-300">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                      onChange={toggleSelectAll}
                      className="rounded border-base-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">User Details</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Admission / Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wider opacity-70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {isLoadingData ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs opacity-60">Loading users directory...</td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((userItem: any) => {
                    const userId = userItem.id || userItem._id;
                    const isSelected = selectedUserIds.includes(userId);
                    const isActive = userItem.isActive !== false;

                    return (
                      <tr key={userId} className="hover:bg-base-200/50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectUser(userId)}
                            className="rounded border-base-300 text-primary focus:ring-primary cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <div className="font-bold">{userItem.name || 'N/A'}</div>
                          <div className="text-[11px] opacity-60 font-mono">{userItem.email || 'No email'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-lg">
                            {userItem.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono opacity-80">
                          {userItem.admissionNumber || userItem.phone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          <span
                            className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full ${
                              isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                            }`}
                          >
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium space-x-2">
                          <button
                            onClick={() => handleToggleStatus(userId, isActive)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                              isActive ? 'bg-warning/10 text-warning hover:bg-warning hover:text-warning-content' : 'bg-success/10 text-success hover:bg-success hover:text-success-content'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(userId)}
                            className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all cursor-pointer inline-flex items-center"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                      No users found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: Create */}
      {activeTab === 'create' && (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Register New Institution User</h2>
          </div>

          <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">School</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={schoolName}
                  disabled
                  className="w-full pl-10 pr-3 py-3 bg-base-300/50 border border-base-300 rounded-2xl text-xs font-bold opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">User Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="school_admin">School Admin</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@school.com"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {formData.role === 'student' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={formData.admissionNumber}
                    onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                    placeholder="ADM/2026/001"
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">UPI Number</label>
                  <input
                    type="text"
                    value={formData.upiNumber}
                    onChange={(e) => setFormData({ ...formData, upiNumber: e.target.value })}
                    placeholder="UPI Number"
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Class ID</label>
                  <input
                    type="text"
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    placeholder="Class ID"
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-primary text-primary-content font-black py-3.5 px-8 rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {isCreating ? 'Creating User...' : 'Save User Account'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};