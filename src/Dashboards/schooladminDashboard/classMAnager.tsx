import React, { useState, useEffect } from 'react';
import { 
  useGetClassesBySchoolIdQuery, 
  useCreateClassMutation, 
  useUpdateClassMutation, 
  useUpdateClassTeacherMutation, 
  useDeleteClassMutation 
} from '../../features/Apis/Class.Api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import { 
  Users, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Building,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';

export default function ClassManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, {
    skip: !currentSchoolId,
  });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';

  const [academicYearFilter, setAcademicYearFilter] = useState('2026');

  // API Hooks
  const { 
    data: classesData, 
    isLoading: isLoadingClasses, 
    error: classesError, 
    refetch: refetchClasses 
  } = useGetClassesBySchoolIdQuery({ 
    schoolId: currentSchoolId, 
    academicYear: academicYearFilter 
  }, {
    skip: !currentSchoolId,
    refetchOnMountOrArgChange: true,
  });

  const [createClass, { isLoading: isCreatingClass }] = useCreateClassMutation();
  const [updateClass, { isLoading: isUpdatingClass }] = useUpdateClassMutation();
  const [updateClassTeacher] = useUpdateClassTeacherMutation();
  const [deleteClass] = useDeleteClassMutation();

  // Local State
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // Class Form State
  const [classForm, setClassForm] = useState({
    gradeLevel: 'Grade 5',
    stream: 'East',
    classTeacherId: '',
    academicYear: '2026',
  });

  useEffect(() => {
    if (currentSchoolId) {
      refetchClasses();
    }
  }, [currentSchoolId, academicYearFilter, refetchClasses]);

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setClassForm({ ...classForm, [e.target.name]: e.target.value });
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (isEditing && editingClassId) {
        await updateClass({
          classId: editingClassId,
          patch: {
            gradeLevel: classForm.gradeLevel,
            stream: classForm.stream,
            academicYear: classForm.academicYear,
          }
        }).unwrap();

        // If teacher is provided, update teacher as well
        if (classForm.classTeacherId) {
          await updateClassTeacher({
            classId: editingClassId,
            classTeacherId: classForm.classTeacherId,
          }).unwrap();
        }

        setSuccessMessage(`Successfully updated class: ${classForm.gradeLevel} ${classForm.stream}`);
        setIsEditing(false);
        setEditingClassId(null);
      } else {
        await createClass({
          schoolId: currentSchoolId,
          ...classForm,
        }).unwrap();
        setSuccessMessage(`Successfully created class: ${classForm.gradeLevel} ${classForm.stream}`);
      }

      setClassForm({
        gradeLevel: 'Grade 5',
        stream: 'East',
        classTeacherId: '',
        academicYear: '2026',
      });

      refetchClasses();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed. Please check your details.');
    }
  };

  const handleEditClassClick = (cls: any) => {
    setIsEditing(true);
    setEditingClassId(cls.id || cls._id);
    setClassForm({
      gradeLevel: cls.gradeLevel || '',
      stream: cls.stream || '',
      classTeacherId: cls.classTeacherId || '',
      academicYear: cls.academicYear || '2026',
    });
  };

  const handleDeleteClassClick = async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await deleteClass(classId).unwrap();
        setSuccessMessage('Class deleted successfully.');
        refetchClasses();
      } catch (err: any) {
        setErrorMessage(err?.data?.message || 'Failed to delete class.');
      }
    }
  };

  const classesList = Array.isArray(classesData) ? classesData : (classesData?.classes || classesData?.data || []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-8 sm:p-10 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-content text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" /> School Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Manage Classes & Streams</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Create and manage classes, streams, and class teachers for {schoolName}.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => refetchClasses()}
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
                <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Total Classes</p>
                <p className="text-lg font-black text-primary">{classesList.length} Classes</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Class Form */}
        <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Class' : 'Add New Class'}</h2>
            </div>
            {isEditing && (
              <button 
                onClick={() => { setIsEditing(false); setEditingClassId(null); }}
                className="text-xs text-error font-bold hover:underline cursor-pointer"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleClassSubmit} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Grade Level</label>
                <input
                  type="text"
                  name="gradeLevel"
                  value={classForm.gradeLevel}
                  onChange={handleClassChange}
                  placeholder="Grade 5"
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Stream</label>
                <input
                  type="text"
                  name="stream"
                  value={classForm.stream}
                  onChange={handleClassChange}
                  placeholder="East"
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Academic Year</label>
                <input
                  type="text"
                  name="academicYear"
                  value={classForm.academicYear}
                  onChange={handleClassChange}
                  placeholder="2026"
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Teacher ID (Optional)</label>
                <input
                  type="text"
                  name="classTeacherId"
                  value={classForm.classTeacherId}
                  onChange={handleClassChange}
                  placeholder="Teacher ID"
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingClass || isUpdatingClass}
              className="w-full bg-primary text-primary-content font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-wider cursor-pointer mt-4"
            >
              {isCreatingClass || isUpdatingClass ? 'Saving...' : isEditing ? 'Update Class' : 'Create Class'}
            </button>
          </form>
        </div>

        {/* Classes List */}
        <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">School Classes</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold opacity-75">Year:</span>
              <input
                type="text"
                value={academicYearFilter}
                onChange={(e) => setAcademicYearFilter(e.target.value)}
                className="w-24 px-3 py-1.5 bg-base-100 border border-base-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {isLoadingClasses ? (
              <div className="p-8 text-center text-xs opacity-60">Loading classes...</div>
            ) : classesError ? (
              <div className="p-8 text-center text-xs text-error">Failed to load classes.</div>
            ) : classesList.length > 0 ? (
              classesList.map((cls: any) => (
                <div key={cls.id || cls._id} className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-primary">{cls.gradeLevel} — {cls.stream}</h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-lg">
                        {cls.academicYear}
                      </span>
                    </div>
                    <p className="text-xs font-mono opacity-70">
                      Teacher ID: {cls.classTeacherId || 'Not Assigned'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleEditClassClick(cls)}
                      className="p-2 bg-base-200 text-base-content rounded-xl hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
                      title="Edit Class"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClassClick(cls.id || cls._id)}
                      className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all cursor-pointer"
                      title="Delete Class"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                No classes found for academic year {academicYearFilter}.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}