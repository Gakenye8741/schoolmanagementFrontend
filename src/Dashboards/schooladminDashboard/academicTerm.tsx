import React, { useState } from 'react';
import { 
  useCreateTermMutation, 
  useGetTermsBySchoolIdQuery, 
  useGetCurrentTermBySchoolIdQuery, 
  useUpdateTermMutation, 
  useCreateTermWindowMutation, 
  useGetWindowsByTermIdQuery, 
  useDeleteTermWindowMutation, 
  useDeleteTermMutation 
} from '../../features/Apis/Academic.Api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import { 
  Calendar, 
  Clock, 
  PlusCircle, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Layers, 
  Sparkles, 
  Building
} from 'lucide-react';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';

export default function TermManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, {
    skip: !currentSchoolId,
  });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  // API Hooks
  const { 
    data: termsData, 
    isLoading: isLoadingTerms, 
    error: termsError, 
    refetch: refetchTerms 
  } = useGetTermsBySchoolIdQuery(currentSchoolId, {
    skip: !currentSchoolId,
  });
  console.log(termsData, refetchTerms);
  const { data: currentTermData } = useGetCurrentTermBySchoolIdQuery(currentSchoolId, {
    skip: !currentSchoolId,
  });

  const [createTerm, { isLoading: isCreatingTerm }] = useCreateTermMutation();
  const [updateTerm, { isLoading: isUpdatingTerm }] = useUpdateTermMutation();
  const [deleteTerm] = useDeleteTermMutation();
  const [createTermWindow, { isLoading: isCreatingWindow }] = useCreateTermWindowMutation();
  const [deleteTermWindow] = useDeleteTermWindowMutation();

  // Local State
  const [activeTab, setActiveTab] = useState<'terms' | 'windows'>('terms');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);

  // Term Form State
  const [termForm, setTermForm] = useState({
    academicYear: '2026',
    termName: 'Term 1',
    startDate: '',
    endDate: '',
    status: 'active',
    isCurrentTerm: true,
  });

  // Window Form State matching backend Zod validator exactly: ["mid_term_break", "cat_week", "exam_week", "registration_deadline"]
  const [windowForm, setWindowForm] = useState({
    termId: '',
    windowType: 'mid_term_break',
    title: '',
    startDate: '',
    endDate: '',
  });

  // Windows query for selected term
  const { data: windowsData } = useGetWindowsByTermIdQuery(selectedTermId || currentTermData?.term?.id || '', {
    skip: !selectedTermId && !currentTermData?.term?.id,
  });

  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTermForm({ ...termForm, [e.target.name]: e.target.value });
  };

  const handleWindowChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setWindowForm({ ...windowForm, [e.target.name]: e.target.value });
  };

  const handleTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (isEditing && editingTermId) {
        await updateTerm({
          termId: editingTermId,
          patch: {
            termName: termForm.termName,
            status: termForm.status,
            startDate: termForm.startDate,
            endDate: termForm.endDate,
            academicYear: termForm.academicYear,
            isCurrentTerm: termForm.isCurrentTerm,
          }
        }).unwrap();
        setSuccessMessage(`Successfully updated term: ${termForm.termName}`);
        setIsEditing(false);
        setEditingTermId(null);
      } else {
        await createTerm({
          schoolId: currentSchoolId,
          ...termForm,
        }).unwrap();
        setSuccessMessage(`Successfully created term: ${termForm.termName}`);
      }

      setTermForm({
        academicYear: '2026',
        termName: 'Term 1',
        startDate: '',
        endDate: '',
        status: 'active',
        isCurrentTerm: true,
      });
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed. Please check your details.');
    }
  };

  const handleWindowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const targetTermId = windowForm.termId || selectedTermId || currentTermData?.term?.id;
    if (!targetTermId) {
      setErrorMessage('Please pick a term for this schedule first.');
      return;
    }

    try {
      await createTermWindow({
        termId: targetTermId,
        windowType: windowForm.windowType,
        title: windowForm.title,
        startDate: windowForm.startDate,
        endDate: windowForm.endDate,
      }).unwrap();

      setSuccessMessage(`Successfully created schedule: ${windowForm.title}`);
      setWindowForm({
        termId: '',
        windowType: 'mid_term_break',
        title: '',
        startDate: '',
        endDate: '',
      });
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to create schedule.');
    }
  };

  const handleEditTermClick = (term: any) => {
    setIsEditing(true);
    setEditingTermId(term.id);
    setTermForm({
      academicYear: term.academicYear,
      termName: term.termName,
      startDate: term.startDate ? term.startDate.split('T')[0] : '',
      endDate: term.endDate ? term.endDate.split('T')[0] : '',
      status: term.status,
      isCurrentTerm: term.isCurrentTerm,
    });
  };

  const handleDeleteTermClick = async (termId: string) => {
    if (window.confirm('Are you sure you want to delete this term?')) {
      try {
        await deleteTerm(termId).unwrap();
        setSuccessMessage('Term deleted successfully.');
      } catch (err: any) {
        setErrorMessage(err?.data?.message || 'Failed to delete term.');
      }
    }
  };

  const handleDeleteWindowClick = async (windowId: string) => {
    try {
      await deleteTermWindow(windowId).unwrap();
      setSuccessMessage('Schedule deleted successfully.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to delete schedule.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      
      {/* Top Banner */}
      <div 
        className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-8 sm:p-10 rounded-3xl border shadow-sm"
        style={{ borderColor: `${secondaryColor}40` }}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-xs"
              style={{ backgroundColor: secondaryColor }}
            >
              <Sparkles className="w-3.5 h-3.5" /> School Calendar
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Manage Terms & Schedules</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Set up school terms, exam weeks, breaks, and registration deadlines for {schoolName}.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Current Active Term</p>
              <p className="text-lg font-black text-primary">{currentTermData?.term?.termName || 'No Active Term'} ({currentTermData?.term?.academicYear || 'N/A'})</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-3 border-b border-base-300 pb-4">
        <button
          onClick={() => setActiveTab('terms')}
          className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'terms' 
              ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' 
              : 'bg-base-200/50 hover:bg-base-200 opacity-75'
          }`}
          style={activeTab === 'terms' ? { borderBottom: `4px solid ${secondaryColor}` } : {}}
        >
          <Calendar className="w-4 h-4" /> Academic Terms
        </button>
        <button
          onClick={() => setActiveTab('windows')}
          className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'windows' 
              ? 'bg-primary text-primary-content shadow-lg shadow-primary/20' 
              : 'bg-base-200/50 hover:bg-base-200 opacity-75'
          }`}
          style={activeTab === 'windows' ? { borderBottom: `4px solid ${secondaryColor}` } : {}}
        >
          <Layers className="w-4 h-4" /> Breaks & Exam Schedules
        </button>
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

      {/* TAB 1: ACADEMIC TERMS */}
      {activeTab === 'terms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Term Form */}
          <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Term' : 'Add New Term'}</h2>
              </div>
              {isEditing && (
                <button 
                  onClick={() => { setIsEditing(false); setEditingTermId(null); }}
                  className="text-xs text-error font-bold hover:underline cursor-pointer"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleTermSubmit} className="space-y-4">
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
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Academic Year</label>
                  <input
                    type="text"
                    name="academicYear"
                    value={termForm.academicYear}
                    onChange={handleTermChange}
                    placeholder="2026"
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Term Name</label>
                  <input
                    type="text"
                    name="termName"
                    value={termForm.termName}
                    onChange={handleTermChange}
                    placeholder="Term 1"
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={termForm.startDate}
                    onChange={handleTermChange}
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={termForm.endDate}
                    onChange={handleTermChange}
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Status</label>
                  <select
                    name="status"
                    value={termForm.status}
                    onChange={handleTermChange}
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2 px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termForm.isCurrentTerm}
                      onChange={(e) => setTermForm({ ...termForm, isCurrentTerm: e.target.checked })}
                      className="checkbox checkbox-primary checkbox-xs"
                    />
                    Make Current Term
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingTerm || isUpdatingTerm}
                className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {isCreatingTerm || isUpdatingTerm ? 'Saving...' : isEditing ? 'Update Term' : 'Create Term'}
              </button>
            </form>
          </div>

          {/* Terms List */}
          <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">All Academic Terms</h2>
              </div>
              <span className="text-xs font-mono font-bold opacity-60">{termsData?.count || 0} Terms</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {isLoadingTerms ? (
                <div className="p-8 text-center text-xs opacity-60">Loading terms...</div>
              ) : termsError ? (
                <div className="p-8 text-center text-xs text-error">Failed to load terms.</div>
              ) : termsData?.terms && termsData.terms.length > 0 ? (
                termsData.terms.map((term) => (
                  <div key={term.id} className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-primary">{term.termName} ({term.academicYear})</h3>
                        {term.isCurrentTerm && (
                          <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-extrabold uppercase rounded-lg">Current</span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg ${term.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-base-300 text-base-content/70'}`}>
                          {term.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono opacity-70">
                        {new Date(term.startDate).toLocaleDateString()} — {new Date(term.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => { setSelectedTermId(term.id); setActiveTab('windows'); }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}
                        title="View Schedules"
                      >
                        Schedules
                      </button>
                      <button
                        onClick={() => handleEditTermClick(term)}
                        className="p-2 bg-base-200 text-base-content rounded-xl hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
                        title="Edit Term"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTermClick(term.id)}
                        className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all cursor-pointer"
                        title="Delete Term"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                  No academic terms found for this school yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TERM WINDOWS & BREAKS */}
      {activeTab === 'windows' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Window Form using exact validator options: mid_term_break, cat_week, exam_week, registration_deadline */}
          <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-base-300">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Add Schedule / Break</h2>
            </div>

            <form onSubmit={handleWindowSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Select Term</label>
                <select
                  name="termId"
                  value={windowForm.termId || selectedTermId}
                  onChange={(e) => {
                    setWindowForm({ ...windowForm, termId: e.target.value });
                    setSelectedTermId(e.target.value);
                  }}
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose Academic Term --</option>
                  {termsData?.terms?.map((term) => (
                    <option key={term.id} value={term.id}>
                      {term.termName} ({term.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Schedule Type</label>
                  <select
                    name="windowType"
                    value={windowForm.windowType}
                    onChange={handleWindowChange}
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary cursor-pointer"
                  >
                    <option value="mid_term_break">Mid-Term Break</option>
                    <option value="cat_week">CAT Week</option>
                    <option value="exam_week">Exam Week</option>
                    <option value="registration_deadline">Registration Deadline</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={windowForm.title}
                    onChange={handleWindowChange}
                    placeholder="e.g., Term 1 Mid-Term Break"
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={windowForm.startDate}
                    onChange={handleWindowChange}
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={windowForm.endDate}
                    onChange={handleWindowChange}
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/25 focus:border-primary font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingWindow}
                className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-4"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {isCreatingWindow ? 'Adding Schedule...' : 'Add Schedule'}
              </button>
            </form>
          </div>

          {/* Windows List */}
          <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Layers className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Term Schedules & Breaks</h2>
              </div>
              <span className="text-xs font-mono font-bold opacity-60">{windowsData?.count || 0} Schedules</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {windowsData?.windows && windowsData.windows.length > 0 ? (
                windowsData.windows.map((windowItem) => (
                  <div key={windowItem.id} className="p-5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-primary">{windowItem.title}</h3>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-lg">
                          {windowItem.windowType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-mono opacity-70">
                        {new Date(windowItem.startDate).toLocaleDateString()} — {new Date(windowItem.endDate).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteWindowClick(windowItem.id)}
                      className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all cursor-pointer"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                  {selectedTermId ? 'No schedules found for this term.' : 'Please choose an academic term to see its breaks and exam weeks.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}