import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  BookOpen, GraduationCap, Layers, PlusCircle, CheckCircle2, AlertCircle,
  X, Sparkles, Building, ChevronDown, ChevronRight, Search, Loader2,
  Save, BarChart3, TrendingUp, Layers3, ListTree, FileText, Target,
  Plus, Minus, Trash2, Wand2, Percent, Hash,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import {
  useGetGradeLevelsBySchoolQuery,
  useGetSubjectsBySchoolQuery,
  type GradeLevel,
  type Subject,
} from '../../features/Apis/academicStructure.Api';

import {
  useGetCurriculumTreeQuery,
  useCreateStrandMutation,
  useBulkCreateStrandsMutation,
  useBulkCreateSubStrandsMutation,
  useSearchSubStrandsQuery,
  useGetCurriculumStatsQuery,
  useGetCurriculumCoverageQuery,
  type CurriculumTreeNode,
  type SubStrand,
} from '../../features/Apis/Curriculum.Api';
import { useGetTermsBySchoolIdQuery } from '../../features/Apis/Term.Api';

type Tab = 'tree' | 'search' | 'insights';

export default function CurriculumManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('tree');
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
              <Sparkles className="w-3.5 h-3.5" /> Curriculum Structure
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Curriculum Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Build the curriculum tree for {schoolName} — strands, sub-strands, learning outcomes, and term-by-term coverage.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <BookOpen className="w-6 h-6" />
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
          { id: 'tree' as Tab, label: 'Curriculum Tree', icon: ListTree },
          { id: 'search' as Tab, label: 'Search Sub-Strands', icon: Search },
          { id: 'insights' as Tab, label: 'Stats & Coverage', icon: BarChart3 },
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
      {activeTab === 'tree' && (
        <TreeTab
          schoolId={currentSchoolId}
          schoolName={schoolName}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'search' && (
        <SearchTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'insights' && (
        <InsightsTab
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

/* ════════════════════════════════════════════════════════════════
   TREE TAB
   ════════════════════════════════════════════════════════════════ */
function TreeTab({
  schoolId, schoolName, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps & { schoolName: string }) {
  const [subjectId, setSubjectId] = useState('');
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [expandedStrands, setExpandedStrands] = useState<Record<string, boolean>>({});
  const [showBulkStrands, setShowBulkStrands] = useState(false);
  const [showBulkSubStrands, setShowBulkSubStrands] = useState(false);

  // Create strand form
  const [strandName, setStrandName] = useState('');
  // Bulk strands form
  const [bulkStrandRows, setBulkStrandRows] = useState<Array<{ name: string }>>([
    { name: '' },
  ]);
  // Bulk sub-strands form
  const [bulkSubStrandId, setBulkSubStrandId] = useState('');
  const [bulkSubStrandRows, setBulkSubStrandRows] = useState<
    Array<{ name: string; learningOutcomes: string }>
  >([{ name: '', learningOutcomes: '' }]);

  // Lookups
  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId);
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId);

  const subjects: Subject[] = useMemo(() => {
    const raw = (subjectsData as any)?.subjects ?? (subjectsData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [subjectsData]);

  const grades: GradeLevel[] = useMemo(() => {
    const raw = (gradesData as any)?.gradeLevels ?? (gradesData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [gradesData]);

  const canLoadTree = !!subjectId && !!gradeLevelId;

  const { data: treeData, isLoading: loadingTree, refetch: refetchTree } =
    useGetCurriculumTreeQuery(
      { schoolId, subjectId, gradeLevelId },
      { skip: !canLoadTree }
    );

  const tree: CurriculumTreeNode[] = useMemo(() => {
    if (!treeData) return [];
    const raw = (treeData as any).strands ?? (treeData as any).tree ?? (treeData as any).data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [treeData]);

  const [createStrand, { isLoading: creating }] = useCreateStrandMutation();
  const [bulkCreateStrands, { isLoading: bulkCreatingStrands }] = useBulkCreateStrandsMutation();
  const [bulkCreateSubStrands, { isLoading: bulkCreatingSub }] = useBulkCreateSubStrandsMutation();

  const totalSubStrands = tree.reduce(
    (sum, s) => sum + (Array.isArray(s.subStrands) ? s.subStrands.length : 0),
    0
  );

  const toggleStrand = (id: string) => {
    setExpandedStrands((m) => ({ ...m, [id]: !m[id] }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    tree.forEach((s) => (next[s.id] = true));
    setExpandedStrands(next);
  };

  const collapseAll = () => setExpandedStrands({});

  /* ─── Create single strand ─── */
  const handleCreateStrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!subjectId) return setErrorMessage('Select a subject first.');
    if (!gradeLevelId) return setErrorMessage('Select a grade level first.');
    if (!strandName.trim()) return setErrorMessage('Strand name is required.');

    try {
      await createStrand({
        schoolId,
        subjectId,
        gradeLevelId,
        name: strandName.trim(),
      }).unwrap();
      setSuccessMessage(`Strand "${strandName.trim()}" created.`);
      setStrandName('');
      refetchTree();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to create strand.');
    }
  };

  /* ─── Bulk create strands ─── */
  const handleBulkStrands = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!subjectId || !gradeLevelId) return setErrorMessage('Pick subject and grade level first.');

    const clean = bulkStrandRows
      .map((r) => ({ name: r.name.trim() }))
      .filter((r) => r.name);

    if (clean.length === 0) return setErrorMessage('Add at least one strand name.');

    try {
      await bulkCreateStrands({
        schoolId,
        subjectId,
        gradeLevelId,
        strands: clean,
      }).unwrap();
      setSuccessMessage(`Created ${clean.length} strand${clean.length === 1 ? '' : 's'}.`);
      setBulkStrandRows([{ name: '' }]);
      setShowBulkStrands(false);
      refetchTree();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk create failed.');
    }
  };

  /* ─── Bulk create sub-strands ─── */
  const handleBulkSubStrands = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (!bulkSubStrandId) return setErrorMessage('Pick a strand first.');

    const clean = bulkSubStrandRows
      .map((r) => ({
        name: r.name.trim(),
        learningOutcomes: r.learningOutcomes.trim() || undefined,
      }))
      .filter((r) => r.name);

    if (clean.length === 0) return setErrorMessage('Add at least one sub-strand.');

    try {
      await bulkCreateSubStrands({
        schoolId,
        strandId: bulkSubStrandId,
        subStrands: clean,
      }).unwrap();
      setSuccessMessage(`Created ${clean.length} sub-strand${clean.length === 1 ? '' : 's'}.`);
      setBulkSubStrandRows([{ name: '', learningOutcomes: '' }]);
      setShowBulkSubStrands(false);
      refetchTree();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk create failed.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Forms ── */}
      <div className="lg:col-span-5 space-y-6">
        {/* Context selectors */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Subject & Grade</h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Grade Level</label>
            <select
              value={gradeLevelId}
              onChange={(e) => setGradeLevelId(e.target.value)}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose grade level --</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

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
        </div>

        {/* Create single strand */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Create Strand</h2>
          </div>

          <form onSubmit={handleCreateStrand} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Strand Name</label>
              <input
                type="text"
                value={strandName}
                onChange={(e) => setStrandName(e.target.value)}
                placeholder="e.g. Numbers"
                required
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !canLoadTree}
              className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
            >
              {creating ? 'Creating…' : 'Create Strand'}
            </button>
            {!canLoadTree && (
              <p className="text-[10px] text-warning font-mono">
                ⚠ Select subject & grade level above first.
              </p>
            )}
          </form>
        </div>

        {/* Bulk import strands */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <button
            type="button"
            onClick={() => setShowBulkStrands(!showBulkStrands)}
            className="w-full flex items-center justify-between gap-3 pb-2"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Wand2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Bulk Import Strands</h2>
            </div>
            {showBulkStrands ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
          </button>

          {showBulkStrands && (
            <form onSubmit={handleBulkStrands} className="space-y-3">
              {bulkStrandRows.map((row, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) =>
                      setBulkStrandRows(bulkStrandRows.map((r, i) => i === idx ? { name: e.target.value } : r))
                    }
                    placeholder={`Strand ${idx + 1} name`}
                    className="flex-1 px-4 py-2.5 bg-base-100 border border-base-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  {bulkStrandRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBulkStrandRows(bulkStrandRows.filter((_, i) => i !== idx))}
                      className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setBulkStrandRows([...bulkStrandRows, { name: '' }])}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> Add row
              </button>
              <button
                type="submit"
                disabled={bulkCreatingStrands || !canLoadTree}
                className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {bulkCreatingStrands ? 'Creating…' : `Create ${bulkStrandRows.filter((r) => r.name.trim()).length} strands`}
              </button>
            </form>
          )}
        </div>

        {/* Bulk import sub-strands */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
          <button
            type="button"
            onClick={() => setShowBulkSubStrands(!showBulkSubStrands)}
            className="w-full flex items-center justify-between gap-3 pb-2"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Layers3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black tracking-tight">Bulk Import Sub-Strands</h2>
            </div>
            {showBulkSubStrands ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
          </button>

          {showBulkSubStrands && (
            <form onSubmit={handleBulkSubStrands} className="space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Parent Strand</label>
                <select
                  value={bulkSubStrandId}
                  onChange={(e) => setBulkSubStrandId(e.target.value)}
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                >
                  <option value="">-- Choose strand --</option>
                  {tree.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {canLoadTree && tree.length === 0 && !loadingTree && (
                  <p className="text-[10px] text-warning font-mono">
                    ⚠ No strands yet — create one first.
                  </p>
                )}
              </div>

              {bulkSubStrandRows.map((row, idx) => (
                <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) =>
                        setBulkSubStrandRows(
                          bulkSubStrandRows.map((r, i) => i === idx ? { ...r, name: e.target.value } : r)
                        )
                      }
                      placeholder={`Sub-strand ${idx + 1} name`}
                      className="flex-1 px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20"
                    />
                    {bulkSubStrandRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setBulkSubStrandRows(bulkSubStrandRows.filter((_, i) => i !== idx))}
                        className="p-2 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={row.learningOutcomes}
                    onChange={(e) =>
                      setBulkSubStrandRows(
                        bulkSubStrandRows.map((r, i) => i === idx ? { ...r, learningOutcomes: e.target.value } : r)
                      )
                    }
                    placeholder="Learning outcomes (optional)"
                    rows={2}
                    className="w-full px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setBulkSubStrandRows([...bulkSubStrandRows, { name: '', learningOutcomes: '' }])
                }
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
              >
                <Plus className="w-3 h-3" /> Add row
              </button>
              <button
                type="submit"
                disabled={bulkCreatingSub || !bulkSubStrandId}
                className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {bulkCreatingSub ? 'Creating…' : `Create ${bulkSubStrandRows.filter((r) => r.name.trim()).length} sub-strands`}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── RIGHT: Tree ── */}
      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <ListTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Curriculum Tree</h2>
              <p className="text-[11px] font-mono opacity-60">
                {tree.length} strands · {totalSubStrands} sub-strands
              </p>
            </div>
          </div>
          {tree.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200"
              >
                Expand all
              </button>
              <button
                onClick={collapseAll}
                className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-base-100 border border-base-300 hover:bg-base-200"
              >
                Collapse
              </button>
            </div>
          )}
        </div>

        {!canLoadTree ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            Select a subject and grade level to load its curriculum tree.
          </div>
        ) : loadingTree ? (
          <div className="p-8 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading tree…
          </div>
        ) : tree.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            No strands yet for this subject / grade level. Create one on the left.
          </div>
        ) : (
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {tree.map((strand) => {
              const subStrands = Array.isArray(strand.subStrands) ? strand.subStrands : [];
              const expanded = !!expandedStrands[strand.id];
              return (
                <div
                  key={strand.id}
                  className="bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleStrand(strand.id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-base-200/50 transition-all"
                  >
                    <span className="shrink-0">
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-primary" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-sm text-primary truncate">{strand.name}</h3>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-extrabold uppercase rounded-lg shrink-0">
                          {subStrands.length} {subStrands.length === 1 ? 'sub' : 'subs'}
                        </span>
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-base-300 bg-base-200/30 px-5 py-3 space-y-2">
                      {subStrands.length === 0 ? (
                        <p className="text-[11px] italic opacity-60 py-2">
                          No sub-strands yet under this strand.
                        </p>
                      ) : (
                        subStrands.map((sub, idx) => (
                          <SubStrandRow key={sub.id ?? idx} sub={sub} index={idx + 1} />
                        ))
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setBulkSubStrandId(strand.id);
                          setShowBulkSubStrands(true);
                          // Scroll left panel into view
                          setTimeout(() => {
                            document.querySelector('select')?.focus();
                          }, 50);
                        }}
                        className="w-full mt-1 text-[11px] font-bold text-primary hover:underline flex items-center justify-center gap-1.5 py-2 border border-dashed border-primary/40 rounded-xl"
                      >
                        <Plus className="w-3 h-3" /> Add sub-strands to "{strand.name}"
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SubStrandRow({ sub, index }: { sub: SubStrand; index: number }) {
  return (
    <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
      <div className="flex items-start gap-2">
        <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black grid place-items-center mt-0.5">
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-base-content truncate">{sub.name}</p>
          {sub.learningOutcomes && (
            <p className="mt-1 text-[11px] leading-relaxed opacity-70 line-clamp-2">
              {sub.learningOutcomes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SEARCH TAB
   ════════════════════════════════════════════════════════════════ */
function SearchTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [query, setQuery] = useState('');
  const [committedQuery, setCommittedQuery] = useState('');

  const { data, isFetching, error } = useSearchSubStrandsQuery(
    { schoolId, q: committedQuery },
    { skip: !schoolId || !committedQuery || committedQuery.trim().length < 2 }
  );

  const results: SubStrand[] = useMemo(() => {
    if (!data) return [];
    const raw = (data as any).subStrands ?? (data as any).data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');
    if (query.trim().length < 2) {
      setErrorMessage('Type at least 2 characters to search.');
      return;
    }
    setCommittedQuery(query.trim());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-base-300">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black tracking-tight">Find Sub-Strands</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Search Query</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. fraction"
                className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <p className="text-[10px] opacity-60">Searches across sub-strand names and outcomes.</p>
          </div>

          <button
            type="submit"
            disabled={isFetching}
            className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            {isFetching ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="pt-4 border-t border-base-300 space-y-2 text-[11px] opacity-70">
          <p className="font-bold uppercase tracking-wider">Example queries</p>
          {['fraction', 'whole numbers', 'decimal', 'geometry'].map((q) => (
            <button
              key={q}
              onClick={() => { setQuery(q); setCommittedQuery(q); }}
              className="block text-left w-full px-2 py-1 rounded hover:bg-base-200 font-mono"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Search Results</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{results.length} found</span>
        </div>

        {!committedQuery ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            Enter a query to search across sub-strands.
          </div>
        ) : isFetching ? (
          <div className="p-8 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Searching…
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-error">Search failed.</div>
        ) : results.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            No sub-strands matched "{committedQuery}".
          </div>
        ) : (
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {results.map((sub, idx) => (
              <div
                key={sub.id ?? idx}
                className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 text-primary grid place-items-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm text-primary truncate">{sub.name}</h3>
                    {sub.learningOutcomes && (
                      <p className="mt-1 text-[11px] leading-relaxed opacity-70">
                        {sub.learningOutcomes}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {sub.strandId && (
                        <span className="px-2 py-0.5 bg-base-200 text-[10px] font-mono rounded">
                          strand: {String(sub.strandId).slice(0, 8)}…
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSIGHTS TAB
   ════════════════════════════════════════════════════════════════ */
function InsightsTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [subjectId, setSubjectId] = useState('');
  const [gradeLevelId, setGradeLevelId] = useState('');
  const [termId, setTermId] = useState('');

  const { data: subjectsData } = useGetSubjectsBySchoolQuery(schoolId);
  const { data: gradesData } = useGetGradeLevelsBySchoolQuery(schoolId);
  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId, { skip: !schoolId });

  const subjects: Subject[] = useMemo(() => {
    const raw = (subjectsData as any)?.subjects ?? (subjectsData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [subjectsData]);

  const grades: GradeLevel[] = useMemo(() => {
    const raw = (gradesData as any)?.gradeLevels ?? (gradesData as any)?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [gradesData]);

  const terms = termsData?.terms ?? [];

  const { data: statsData, isLoading: loadingStats } = useGetCurriculumStatsQuery(schoolId, {
    skip: !schoolId,
  });

  const stats = (statsData as any)?.stats ?? {};

  const canLoadCoverage = !!subjectId && !!gradeLevelId && !!termId;
  const { data: coverageData, isLoading: loadingCoverage } = useGetCurriculumCoverageQuery(
    { schoolId, subjectId, gradeLevelId, termId },
    { skip: !canLoadCoverage }
  );

  const coverage = (coverageData as any)?.coverage ?? {};
  const pct = Number(coverage.percentage ?? 0);

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          icon={Layers}
          label="Strands"
          value={loadingStats ? '…' : (stats.strandCount ?? stats.totalStrands ?? '—')}
          tone="primary"
        />
        <StatTile
          icon={Layers3}
          label="Sub-Strands"
          value={loadingStats ? '…' : (stats.subStrandCount ?? stats.totalSubStrands ?? '—')}
          tone="warning"
        />
        <StatTile
          icon={BookOpen}
          label="Subjects Covered"
          value={loadingStats ? '…' : (stats.subjectsCovered ?? '—')}
          tone="success"
        />
        <StatTile
          icon={GraduationCap}
          label="Grades Covered"
          value={loadingStats ? '…' : (stats.gradeLevelsCovered ?? '—')}
          tone="primary"
        />
      </div>

      {/* Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Coverage Scope</h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose subject --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Grade Level</label>
              <select
                value={gradeLevelId}
                onChange={(e) => setGradeLevelId(e.target.value)}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose grade level --</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Academic Term</label>
              <select
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="">-- Choose term --</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.termName} ({t.academicYear}){t.isCurrentTerm ? ' · current' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Percent className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Coverage Report</h2>
          </div>

          {!canLoadCoverage ? (
            <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
              Pick a subject, grade level, and term to see coverage.
            </div>
          ) : loadingCoverage ? (
            <div className="p-8 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Calculating coverage…
            </div>
          ) : (
            <>
              <div className="p-6 bg-base-100 border border-base-300 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Completion</p>
                  <p className="text-3xl font-black text-primary">{pct.toFixed(1)}%</p>
                </div>
                <div className="h-3 w-full rounded-full bg-base-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 80 ? 'bg-success' : pct >= 50 ? 'bg-warning' : 'bg-error'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatTile
                  icon={Layers3}
                  label="Total Sub-Strands"
                  value={coverage.totalSubStrands ?? '—'}
                  tone="primary"
                />
                <StatTile
                  icon={CheckCircle2}
                  label="Covered"
                  value={coverage.coveredSubStrands ?? '—'}
                  tone="success"
                />
              </div>

              {/* Raw extras */}
              {Object.keys(coverage).length > 2 && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-bold opacity-60 hover:opacity-100 select-none">
                    Raw coverage data
                  </summary>
                  <pre className="mt-2 p-3 bg-base-100 border border-base-300 rounded-xl text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(coverage, null, 2)}
                  </pre>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon, label, value, tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  tone: 'primary' | 'success' | 'warning';
}) {
  const toneMap = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  }[tone];

  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${toneMap}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider opacity-60">{label}</p>
      </div>
      <p className="text-xl font-black text-base-content truncate">{value}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHARED
   ════════════════════════════════════════════════════════════════ */
type SectionProps = {
  schoolId: string;
  primaryColor: string;
  secondaryColor: string;
  setSuccessMessage: (v: string) => void;
  setErrorMessage: (v: string) => void;
};