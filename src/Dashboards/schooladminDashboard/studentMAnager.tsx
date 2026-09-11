import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetStudentsBySchoolQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useDeleteStudentMutation,
} from '../../features/Apis/students.Api';
import { useLinkParentMutation } from '../../features/Apis/Auth.Api';
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
  UserCheck
} from 'lucide-react';

export const StudentManager: React.FC = () => {
  const { user } = useSelector((state: any) => state.auth || {});
  const schoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !schoolId,
  });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';

  const { 
    data: studentsResponse, 
    isLoading, 
    error, 
    refetch: refetchStudents 
  } = useGetStudentsBySchoolQuery(schoolId, {
    skip: !schoolId,
    refetchOnMountOrArgChange: true,
  });

  const students = Array.isArray(studentsResponse) 
    ? studentsResponse 
    : (studentsResponse?.data || studentsResponse?.students || []);

  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent] = useUpdateStudentMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const [linkParent] = useLinkParentMutation();

  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    admissionNumber: '',
    upiNumber: '',
    parentId: '',
    classId: '',
    dateOfBirth: '',
    gender: 'Male',
    enrollmentDate: new Date().toISOString().split('T')[0],
    isEnrolled: true,
  });

  const [linkData, setLinkData] = useState({
    studentId: '',
    parentId: '',
  });

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'link'>('list');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await createStudent({ ...formData, schoolId }).unwrap();
      setSuccessMessage('Student created successfully!');
      setFormData({
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
    } catch (err: any) {
      console.error('Failed to create student:', err);
      setErrorMessage(err?.data?.message || 'Error creating student');
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    try {
      await linkParent(linkData).unwrap();
      setSuccessMessage('Parent linked successfully!');
      setLinkData({ studentId: '', parentId: '' });
      setActiveTab('list');
    } catch (err: any) {
      console.error('Failed to link parent:', err);
      setErrorMessage(err?.data?.message || 'Error linking parent');
    }
  };

  const handleDelete = async (studentId: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      setSuccessMessage('');
      setErrorMessage('');
      try {
        await deleteStudent(studentId).unwrap();
        setSuccessMessage('Student deleted successfully.');
        refetchStudents();
      } catch (err: any) {
        console.error('Failed to delete student:', err);
        setErrorMessage(err?.data?.message || 'Failed to delete student.');
      }
    }
  };

  if (!schoolId) {
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
              <Sparkles className="w-3.5 h-3.5" /> Student Registry
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Student Management Portal</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Register students, track enrollments, and link parent profiles for {schoolName}.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => refetchStudents()}
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
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Total Students</p>
                <p className="text-lg font-black text-primary">{students.length} Students</p>
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
          Student List
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'create' 
              ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
              : 'bg-base-200 text-base-content hover:bg-base-300'
          }`}
        >
          Register Student
        </button>
        <button
          onClick={() => setActiveTab('link')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'link' 
              ? 'bg-primary text-primary-content shadow-md shadow-primary/20' 
              : 'bg-base-200 text-base-content hover:bg-base-300'
          }`}
        >
          Link Parent
        </button>
      </div>

      {/* Tab Content: List */}
      {activeTab === 'list' && (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Registered Students</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-300">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Admission No</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Name / Email</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider opacity-70">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wider opacity-70">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs opacity-60">Loading students...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-error">Failed to load student data.</td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student: any) => (
                    <tr key={student.id || student._id} className="hover:bg-base-200/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-primary">
                        {student.admissionNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <div className="font-bold">{student.name || 'N/A'}</div>
                        <div className="text-[11px] opacity-60 font-mono">{student.email || 'No email provided'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium opacity-80">{student.gender || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        <span
                          className={`px-3 py-1 inline-flex text-[10px] font-black uppercase tracking-wider rounded-full ${
                            student.isEnrolled ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                          }`}
                        >
                          {student.isEnrolled ? 'Enrolled' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <button
                          onClick={() => handleDelete(student.id || student._id)}
                          className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all cursor-pointer"
                          title="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                      No students found for this institution.
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
            <h2 className="text-lg font-black tracking-tight">Register New Student</h2>
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
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Admission Number</label>
              <input
                type="text"
                required
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="ADM/2026/001"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Parent ID (Optional)</label>
              <input
                type="text"
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                placeholder="Parent ID"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={isCreating}
                className="bg-primary text-primary-content font-black py-3.5 px-8 rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
              >
                {isCreating ? 'Saving...' : 'Save Student Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Content: Link Parent */}
      {activeTab === 'link' && (
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Link Parent to Student</h2>
          </div>

          <form onSubmit={handleLinkSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Student ID</label>
              <input
                type="text"
                required
                value={linkData.studentId}
                onChange={(e) => setLinkData({ ...linkData, studentId: e.target.value })}
                placeholder="Student ID"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Parent ID</label>
              <input
                type="text"
                required
                value={linkData.parentId}
                onChange={(e) => setLinkData({ ...linkData, parentId: e.target.value })}
                placeholder="Parent ID"
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                className="w-full bg-primary text-primary-content font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-wider cursor-pointer"
              >
                Link Parent to Student
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};