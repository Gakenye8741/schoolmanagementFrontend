import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import {
  Calendar, CalendarDays, PartyPopper, Trophy, PlusCircle, Edit3, Trash2,
  CheckCircle2, AlertCircle, X, Sparkles, Building, ChevronDown, ChevronRight,
  Loader2, Save, Users, UserCheck, Search, Filter, BarChart3, ListChecks,
  Clock, MapPin, Tag, Award, Medal, Activity, Copy, Wand2, UserPlus,
  UserMinus, Calendar as CalIcon, Layers, Target,
} from 'lucide-react';

import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';
import { useGetTermsBySchoolIdQuery } from '../../features/Apis/Term.Api';
import { useGetTeachersBySchoolQuery } from '../../features/Apis/Users.Api';
import { useGetStudentsBySchoolQuery, type Student } from '../../features/Apis/students.Api';
import {
  useCreateEventMutation,
  useBulkCreateEventsMutation,
  useGetEventsForSchoolQuery,
  useGetUpcomingEventsQuery,
  useGetTodayEventsQuery,
  useGetEventsInRangeQuery,
  useGetEventCalendarQuery,
  useUpdateEventMutation,
  useGetEventStatsQuery,
  useDeleteEventMutation,
  useCreateActivityMutation,
  useGetActivitiesForSchoolQuery,
  useGetActivityCategoriesQuery,
  useGetActivitiesByPatronQuery,
  useAssignPatronMutation,
  useUpdateActivityMutation,
  useGetActivityStatsQuery,
  useAddActivityMemberMutation,
  useBulkAddActivityMembersMutation,
  useGetActivityMembersQuery,
  useGetTermMembershipsQuery,
  useGetStudentActivitiesQuery,
  useGetStudentActivitySummaryQuery,
  useUpdateMembershipRoleMutation,
  useGetStudentsNotInActivityQuery,
  useRemoveActivityMemberMutation,
  type SchoolEvent,
  type CoCurricularActivity,
  type ActivityMembership,
} from '../../features/Apis/Events.Api';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const EVENT_CATEGORIES = ['Academic', 'Sports', 'Meeting', 'Cultural', 'General'];
const ACTIVITY_CATEGORIES = ['Sports', 'Academic', 'Clubs', 'Arts', 'Cultural'];

const EVENT_TONES: Record<string, { bg: string; text: string; border: string }> = {
  Academic:   { bg: 'bg-primary/10',   text: 'text-primary',   border: 'border-primary/30' },
  Sports:     { bg: 'bg-success/10',   text: 'text-success',   border: 'border-success/30' },
  Meeting:    { bg: 'bg-info/10',      text: 'text-info',      border: 'border-info/30' },
  Cultural:   { bg: 'bg-warning/10',   text: 'text-warning',   border: 'border-warning/30' },
  General:    { bg: 'bg-base-300',     text: 'text-base-content/70', border: 'border-base-300' },
};

const ACTIVITY_TONES: Record<string, { bg: string; text: string }> = {
  Sports:   { bg: 'bg-success/10', text: 'text-success' },
  Academic: { bg: 'bg-primary/10', text: 'text-primary' },
  Clubs:    { bg: 'bg-warning/10', text: 'text-warning' },
  Arts:     { bg: 'bg-info/10',    text: 'text-info' },
  Cultural: { bg: 'bg-error/10',   text: 'text-error' },
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
type TeacherUser = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  tscNumber?: string;
  [key: string]: any;
};

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

function extractEvents(data: any): SchoolEvent[] {
  if (!data) return [];
  const raw = data.events ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractActivities(data: any): CoCurricularActivity[] {
  if (!data) return [];
  const raw = data.activities ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function extractMemberships(data: any): ActivityMembership[] {
  if (!data) return [];
  const raw = data.memberships ?? data.members ?? data.data ?? data;
  return Array.isArray(raw) ? raw : [];
}

function teacherLabel(t: TeacherUser): string {
  const name = t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || 'Unnamed';
  return t.tscNumber ? `${name} · ${t.tscNumber}` : name;
}

function studentLabel(s: Student): string {
  const name = `${s.firstName ?? ''} ${s.middleName ? s.middleName + ' ' : ''}${s.lastName ?? ''}`.trim() || 'Unnamed';
  return s.admissionNumber ? `${name} · ${s.admissionNumber}` : name;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return d; }
}

function fmtTime(d?: string | null): string {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function fmtMonth(key: string): string {
  // key is "YYYY-MM"
  try {
    const [y, m] = key.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } catch { return key; }
}

function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(local: string): string {
  if (!local) return '';
  return new Date(local).toISOString();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

type Tab = 'events' | 'activities' | 'members' | 'insights';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function EventsManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, { skip: !currentSchoolId });
  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';
  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const [activeTab, setActiveTab] = useState<Tab>('events');
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
              <PartyPopper className="w-3.5 h-3.5" /> Events & Activities
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
              Events Manager
            </h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Schedule school events, manage clubs and societies, and track student memberships for {schoolName}.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl" style={{ borderLeft: `4px solid ${secondaryColor}` }}>
              <Building className="w-6 h-6" />
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
          { id: 'events' as Tab, label: 'School Events', icon: CalendarDays },
          { id: 'activities' as Tab, label: 'Activities & Clubs', icon: Trophy },
          { id: 'members' as Tab, label: 'Memberships', icon: Users },
          { id: 'insights' as Tab, label: 'Insights', icon: BarChart3 },
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
      {activeTab === 'events' && (
        <EventsTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'activities' && (
        <ActivitiesTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab
          schoolId={currentSchoolId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          setSuccessMessage={setSuccessMessage}
          setErrorMessage={setErrorMessage}
        />
      )}
      {activeTab === 'insights' && (
        <InsightsTab schoolId={currentSchoolId} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EVENTS TAB
   ════════════════════════════════════════════════════════════════ */
function EventsTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Academic',
    location: '',
    startDate: '',
    endDate: '',
  });

  // Filters
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filterCategory, setFilterCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Bulk import
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRows, setBulkRows] = useState<Array<{
    title: string; category: string; location: string; startDate: string; endDate: string;
  }>>([{ title: '', category: 'Academic', location: '', startDate: '', endDate: '' }]);

  // Today / upcoming widgets
  const { data: todayData } = useGetTodayEventsQuery(schoolId, { skip: !schoolId });
  const { data: upcomingData } = useGetUpcomingEventsQuery({ schoolId, withinDays: 30, limit: 5 }, { skip: !schoolId });
  const todayEvents = useMemo(() => extractEvents(todayData), [todayData]);
  const upcomingEvents = useMemo(() => extractEvents(upcomingData), [upcomingData]);

  // List query
  const listQuery = useGetEventsForSchoolQuery(
    { schoolId, category: filterCategory || undefined, limit: 100 },
    { skip: !schoolId || view !== 'list' }
  );

  // Range query
  const rangeQuery = useGetEventsInRangeQuery(
    { schoolId, from: toIso(dateFrom || todayStr()), to: toIso(dateTo || '2100-01-01') },
    { skip: !schoolId || view !== 'list' || (!dateFrom && !dateTo) }
  );

  const calendarQuery = useGetEventCalendarQuery(
    { schoolId, from: dateFrom ? toIso(dateFrom) : undefined, to: dateTo ? toIso(dateTo) : undefined },
    { skip: !schoolId || view !== 'calendar' }
  );

  const activeQuery = view === 'calendar'
    ? calendarQuery
    : (dateFrom || dateTo ? rangeQuery : listQuery);

  const events = useMemo(() => extractEvents(activeQuery.data), [activeQuery.data]);
  const calendar = (calendarQuery.data as any)?.calendar ?? {};

  const [createEvent, { isLoading: creating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();
  const [bulkCreate, { isLoading: bulkCreating }] = useBulkCreateEventsMutation();

  const resetForm = () => {
    setForm({ title: '', description: '', category: 'Academic', location: '', startDate: '', endDate: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (e: SchoolEvent) => {
    setForm({
      title: e.title,
      description: e.description ?? '',
      category: e.category,
      location: e.location ?? '',
      startDate: toLocalInput(e.startDate),
      endDate: toLocalInput(e.endDate),
    });
    setIsEditing(true);
    setEditingId(e.id);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!form.title.trim()) return setErrorMessage('Event title is required.');
    if (!form.startDate || !form.endDate) return setErrorMessage('Start and end date are required.');

    const startIso = toIso(form.startDate);
    const endIso = toIso(form.endDate);
    if (new Date(endIso) < new Date(startIso)) return setErrorMessage('End date must be after start date.');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      location: form.location.trim() || undefined,
      startDate: startIso,
      endDate: endIso,
    };

    try {
      if (isEditing && editingId) {
        await updateEvent({ eventId: editingId, patch: payload }).unwrap();
        setSuccessMessage(`Event "${payload.title}" updated.`);
      } else {
        await createEvent({ schoolId, ...payload }).unwrap();
        setSuccessMessage(`Event "${payload.title}" created.`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    try {
      await deleteEvent(id).unwrap();
      setSuccessMessage(`"${title}" deleted.`);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Delete failed.');
    }
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    const clean = bulkRows
      .filter((r) => r.title.trim() && r.startDate && r.endDate)
      .map((r) => ({
        title: r.title.trim(),
        category: r.category,
        location: r.location.trim() || undefined,
        startDate: toIso(r.startDate),
        endDate: toIso(r.endDate),
      }));

    if (clean.length === 0) return setErrorMessage('Add at least one valid event row.');

    try {
      await bulkCreate({ schoolId, events: clean }).unwrap();
      setSuccessMessage(`Created ${clean.length} events.`);
      setBulkRows([{ title: '', category: 'Academic', location: '', startDate: '', endDate: '' }]);
      setShowBulk(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk create failed.');
    }
  };

  const tone = (cat: string) => EVENT_TONES[cat] ?? EVENT_TONES.General;

  return (
    <div className="space-y-6">
      {/* Widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ZapIcon className="w-4 h-4 text-warning" />
            <h3 className="text-xs font-black uppercase tracking-wider">Happening Today</h3>
            <span className="ml-auto text-[10px] font-mono opacity-60">{todayEvents.length}</span>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-xs opacity-60">No events scheduled for today.</p>
          ) : (
            <ul className="space-y-1.5">
              {todayEvents.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${tone(e.category).bg} ${tone(e.category).text}`}>
                    {e.category}
                  </span>
                  <span className="font-bold truncate">{e.title}</span>
                  <span className="text-[10px] font-mono opacity-60 ml-auto shrink-0">{fmtTime(e.startDate)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-wider">Next 30 Days</h3>
            <span className="ml-auto text-[10px] font-mono opacity-60">{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-xs opacity-60">No upcoming events in the next 30 days.</p>
          ) : (
            <ul className="space-y-1.5">
              {upcomingEvents.slice(0, 3).map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-mono opacity-60 shrink-0">{fmtDate(e.startDate).slice(0, 6)}</span>
                  <span className="font-bold truncate">{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: Forms ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Create / edit event */}
          <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">{isEditing ? 'Edit Event' : 'Create Event'}</h2>
              </div>
              {isEditing && (
                <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">
                  Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Annual Prize Giving Day"
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description of the event…"
                  rows={2}
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
                    <Tag className="w-3 h-3" /> Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
                    <MapPin className="w-3 h-3" /> Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Main Hall"
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Start</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">End</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating || updating}
                className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2 disabled:opacity-60"
                style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
              >
                {creating || updating ? 'Saving…' : isEditing ? 'Update Event' : 'Create Event'}
              </button>
            </form>
          </div>

          {/* Bulk import collapsible */}
          <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
            <button
              type="button"
              onClick={() => setShowBulk(!showBulk)}
              className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-black tracking-tight">Bulk Import</h2>
                  <p className="text-[11px] opacity-60">Create multiple events at once</p>
                </div>
              </div>
              {showBulk ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
            </button>

            {showBulk && (
              <form onSubmit={handleBulk} className="space-y-3">
                {bulkRows.map((row, idx) => (
                  <div key={idx} className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={row.title}
                        onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, title: e.target.value } : r))}
                        placeholder="Event title"
                        className="flex-1 px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                      />
                      <select
                        value={row.category}
                        onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, category: e.target.value } : r))}
                        className="px-2 py-2 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                      >
                        {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setBulkRows(bulkRows.filter((_, i) => i !== idx))}
                          className="p-2 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={row.location}
                      onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, location: e.target.value } : r))}
                      placeholder="Location (optional)"
                      className="w-full px-3 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[11px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="datetime-local"
                        value={row.startDate}
                        onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, startDate: e.target.value } : r))}
                        className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono"
                      />
                      <input
                        type="datetime-local"
                        value={row.endDate}
                        onChange={(e) => setBulkRows(bulkRows.map((r, i) => i === idx ? { ...r, endDate: e.target.value } : r))}
                        className="px-2 py-1.5 bg-base-200 border border-base-300 rounded-lg text-[10px] font-mono"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setBulkRows([...bulkRows, { title: '', category: 'Academic', location: '', startDate: '', endDate: '' }])}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline"
                >
                  <PlusCircle className="w-3 h-3" /> Add row
                </button>
                <button
                  type="submit"
                  disabled={bulkCreating}
                  className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                  {bulkCreating ? 'Creating…' : `Create ${bulkRows.filter((r) => r.title.trim() && r.startDate && r.endDate).length} events`}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── RIGHT: List / Calendar ── */}
        <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                {view === 'calendar' ? <CalIcon className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
              </div>
              <h2 className="text-lg font-black tracking-tight">Events</h2>
            </div>
            <div className="flex gap-1 bg-base-100 border border-base-300 rounded-xl p-1">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer ${
                  view === 'list' ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer ${
                  view === 'calendar' ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                }`}
              >
                Calendar
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 text-xs font-bold bg-base-100 border border-base-300 rounded-xl cursor-pointer"
            >
              <option value="">All categories</option>
              {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 text-xs font-mono bg-base-100 border border-base-300 rounded-xl"
              placeholder="To"
            />
            {(filterCategory || dateFrom || dateTo) && (
              <button
                onClick={() => { setFilterCategory(''); setDateFrom(''); setDateTo(''); }}
                className="text-xs font-bold text-primary hover:underline px-2 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Content */}
          {activeQuery.isLoading ? (
            <div className="p-8 text-center text-xs opacity-60">
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading events…
            </div>
          ) : view === 'calendar' ? (
            Object.keys(calendar).length === 0 ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                No events in the calendar.
              </div>
            ) : (
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {Object.entries(calendar)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([monthKey, monthEvents]) => (
                    <div key={monthKey}>
                      <h3 className="text-xs font-black uppercase tracking-wider opacity-60 mb-2 sticky top-0 bg-base-100 py-1">
                        {fmtMonth(monthKey)} <span className="opacity-60">({(monthEvents as SchoolEvent[]).length})</span>
                      </h3>
                      <div className="space-y-2">
                        {(monthEvents as SchoolEvent[]).map((e) => (
                          <EventCard
                            key={e.id}
                            event={e}
                            primaryColor={primaryColor}
                            onEdit={() => handleEdit(e)}
                            onDelete={() => handleDelete(e.id, e.title)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )
          ) : events.length === 0 ? (
            <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
              {filterCategory || dateFrom || dateTo
                ? 'No events match the current filters.'
                : 'No events scheduled yet. Create one on the left.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {[...events]
                .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                .map((e) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    primaryColor={primaryColor}
                    onEdit={() => handleEdit(e)}
                    onDelete={() => handleDelete(e.id, e.title)}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event, primaryColor, onEdit, onDelete,
}: {
  event: SchoolEvent; primaryColor: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const tone = EVENT_TONES[event.category] ?? EVENT_TONES.General;
  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${tone.bg} ${tone.text}`}>
          <Calendar className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-primary truncate">{event.title}</h3>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${tone.bg} ${tone.text}`}>
              {event.category}
            </span>
          </div>
          {event.description && (
            <p className="mt-1 text-[11px] opacity-70 line-clamp-2">{event.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono opacity-60">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {fmtDate(event.startDate)} · {fmtTime(event.startDate)} → {fmtTime(event.endDate)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {event.location}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 bg-base-200 rounded-xl hover:bg-primary/20 hover:text-primary transition-all"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 bg-error/10 text-error rounded-xl hover:bg-error hover:text-error-content transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   ACTIVITIES TAB
   ════════════════════════════════════════════════════════════════ */
function ActivitiesTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Sports',
    patronTeacherId: '',
  });
  const [filterCategory, setFilterCategory] = useState('');

  const { data: activitiesData, isLoading } = useGetActivitiesForSchoolQuery(
    { schoolId, category: filterCategory || undefined },
    { skip: !schoolId }
  );
  const { data: catsData } = useGetActivityCategoriesQuery(schoolId, { skip: !schoolId });
  const { data: teachersData } = useGetTeachersBySchoolQuery(schoolId, { skip: !schoolId });

  const activities = useMemo(() => extractActivities(activitiesData), [activitiesData]);
  const categories = (catsData as any)?.categories ?? ACTIVITY_CATEGORIES;
  const teachers = useMemo(() => extractTeachers(teachersData), [teachersData]);

  const teacherMap = useMemo(() => {
    const m = new Map<string, TeacherUser>();
    teachers.forEach((t) => m.set(t.id, t));
    return m;
  }, [teachers]);

  const [createActivity, { isLoading: creating }] = useCreateActivityMutation();
  const [updateActivity, { isLoading: updating }] = useUpdateActivityMutation();
  const [assignPatron] = useAssignPatronMutation();

  const resetForm = () => {
    setForm({ name: '', category: 'Sports', patronTeacherId: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const handleEdit = (a: CoCurricularActivity) => {
    setForm({
      name: a.name,
      category: a.category,
      patronTeacherId: a.patronTeacherId ?? '',
    });
    setIsEditing(true);
    setEditingId(a.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!form.name.trim()) return setErrorMessage('Activity name is required.');

    try {
      if (isEditing && editingId) {
        await updateActivity({
          activityId: editingId,
          patch: { name: form.name.trim(), category: form.category },
        }).unwrap();
        await assignPatron({
          activityId: editingId,
          patronTeacherId: form.patronTeacherId || null,
        }).unwrap();
        setSuccessMessage(`Activity "${form.name}" updated.`);
      } else {
        await createActivity({
          schoolId,
          name: form.name.trim(),
          category: form.category,
          patronTeacherId: form.patronTeacherId || null,
        }).unwrap();
        setSuccessMessage(`Activity "${form.name}" created.`);
      }
      resetForm();
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Operation failed.');
    }
  };

  const handleUnassignPatron = async (activityId: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await assignPatron({ activityId, patronTeacherId: null }).unwrap();
      setSuccessMessage('Patron unassigned.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to unassign patron.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* ── LEFT: Form ── */}
      <div className="lg:col-span-5 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">
              {isEditing ? 'Edit Activity' : 'Create Activity'}
            </h2>
          </div>
          {isEditing && (
            <button onClick={resetForm} className="text-xs text-error font-bold hover:underline cursor-pointer">
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Football Club"
              required
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
              <Tag className="w-3 h-3" /> Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              {ACTIVITY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
              <UserCheck className="w-3 h-3" /> Patron Teacher
            </label>
            <select
              value={form.patronTeacherId}
              onChange={(e) => setForm({ ...form, patronTeacherId: e.target.value })}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">— No patron assigned —</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{teacherLabel(t)}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={creating || updating}
            className="w-full text-white font-black py-3.5 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer mt-2 disabled:opacity-60"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            {creating || updating ? 'Saving…' : isEditing ? 'Update Activity' : 'Create Activity'}
          </button>
        </form>
      </div>

      {/* ── RIGHT: Grid ── */}
      <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-base-300 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Activities</h2>
          </div>
          <span className="text-xs font-mono font-bold opacity-60">{activities.length} total</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
              !filterCategory ? 'bg-primary text-primary-content' : 'bg-base-100 border border-base-300 hover:bg-base-200'
            }`}
          >
            All
          </button>
          {categories.map((c: string) => (
            <button
              key={c}
              onClick={() => setFilterCategory(c)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                filterCategory === c ? 'bg-primary text-primary-content' : 'bg-base-100 border border-base-300 hover:bg-base-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs opacity-60">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading activities…
          </div>
        ) : activities.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
            {filterCategory ? `No ${filterCategory} activities yet.` : 'No activities yet. Create one on the left.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {activities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                patronName={a.patronTeacherId ? (teacherMap.get(a.patronTeacherId)?.name ?? 'Unknown teacher') : null}
                onEdit={() => handleEdit(a)}
                onUnassignPatron={() => handleUnassignPatron(a.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityCard({
  activity, patronName, onEdit, onUnassignPatron,
}: {
  activity: CoCurricularActivity;
  patronName: string | null;
  onEdit: () => void;
  onUnassignPatron: () => void;
}) {
  const tone = ACTIVITY_TONES[activity.category] ?? { bg: 'bg-base-300', text: 'text-base-content/70' };
  const { data: statsData } = useGetActivityStatsQuery(activity.id);
  const memberCount = (statsData as any)?.stats?.totalMembers ?? 0;

  return (
    <div className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary transition-all">
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-xl grid place-items-center ${tone.bg} ${tone.text}`}>
          <Trophy className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-black text-sm text-primary truncate">{activity.name}</h3>
            <span className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${tone.bg} ${tone.text}`}>
              {activity.category}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <UserCheck className="w-3 h-3 text-primary/70" />
            <span className={patronName ? 'font-bold opacity-80' : 'italic opacity-50'}>
              {patronName ?? 'No patron assigned'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono opacity-60">
            <Users className="w-3 h-3" /> {memberCount} member{memberCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-base-300 flex justify-end gap-1.5">
        {activity.patronTeacherId && (
          <button
            onClick={onUnassignPatron}
            className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-all cursor-pointer"
          >
            Unassign patron
          </button>
        )}
        <button
          onClick={onEdit}
          className="text-[10px] font-black uppercase px-2 py-1 rounded-lg bg-base-200 hover:bg-primary/20 hover:text-primary transition-all cursor-pointer"
        >
          <Edit3 className="w-3 h-3 inline mr-1" /> Edit
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MEMBERS TAB
   ════════════════════════════════════════════════════════════════ */
function MembersTab({
  schoolId, primaryColor, secondaryColor, setSuccessMessage, setErrorMessage,
}: SectionProps) {
  const [activityId, setActivityId] = useState('');
  const [termId, setTermId] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Add single
  const [addForm, setAddForm] = useState({
    studentId: '',
    performanceRole: '',
  });
  const [addSearch, setAddSearch] = useState('');

  // Bulk add
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRole, setBulkRole] = useState('');
  const [bulkStudentIds, setBulkStudentIds] = useState<string[]>([]);
  const [bulkSearch, setBulkSearch] = useState('');

  // Data
  const { data: activitiesData } = useGetActivitiesForSchoolQuery({ schoolId }, { skip: !schoolId });
  const { data: termsData } = useGetTermsBySchoolIdQuery(schoolId, { skip: !schoolId });
  const { data: studentsData } = useGetStudentsBySchoolQuery(schoolId, { skip: !schoolId });

  const activities = useMemo(() => extractActivities(activitiesData), [activitiesData]);
  const terms = termsData?.terms ?? [];
  const students = useMemo(() => extractStudents(studentsData), [studentsData]);

  // Default term = current
  useEffect(() => {
    if (!termId && terms.length > 0) {
      const current = terms.find((t) => t.isCurrentTerm) ?? terms[0];
      setTermId(current.id);
    }
  }, [terms, termId]);

  const studentMap = useMemo(() => {
    const m = new Map<string, Student>();
    students.forEach((s) => m.set(s.id, s));
    return m;
  }, [students]);

  // Members query
  const { data: membersData, isLoading } = useGetActivityMembersQuery(
    { activityId, termId },
    { skip: !activityId || !termId }
  );
  const members = useMemo(() => extractMemberships(membersData), [membersData]);

  // Students not in activity
  const { data: notInData } = useGetStudentsNotInActivityQuery(
    { activityId, schoolId, termId },
    { skip: !activityId || !termId || !showAdd }
  );
  const candidates = useMemo(() => extractStudents(notInData), [notInData]);

  // Mutations
  const [addMember, { isLoading: adding }] = useAddActivityMemberMutation();
  const [bulkAdd, { isLoading: bulkAdding }] = useBulkAddActivityMembersMutation();
  const [updateRole, { isLoading: updatingRole }] = useUpdateMembershipRoleMutation();
  const [removeMember] = useRemoveActivityMemberMutation();

  const filteredCandidates = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((s) => {
      const name = `${s.firstName ?? ''} ${s.middleName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
      return name.includes(q) || (s.admissionNumber ?? '').toLowerCase().includes(q);
    });
  }, [candidates, addSearch]);

  const filteredForBulk = useMemo(() => {
    const q = bulkSearch.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((s) => {
      const name = `${s.firstName ?? ''} ${s.middleName ?? ''} ${s.lastName ?? ''}`.toLowerCase();
      return name.includes(q) || (s.admissionNumber ?? '').toLowerCase().includes(q);
    });
  }, [candidates, bulkSearch]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!activityId) return setErrorMessage('Pick an activity first.');
    if (!termId) return setErrorMessage('Pick a term first.');
    if (!addForm.studentId) return setErrorMessage('Pick a student.');

    try {
      await addMember({
        schoolId,
        activityId,
        termId,
        studentId: addForm.studentId,
        performanceRole: addForm.performanceRole.trim() || undefined,
      }).unwrap();
      setSuccessMessage('Student added to activity.');
      setAddForm({ studentId: '', performanceRole: '' });
      setAddSearch('');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to add member.');
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(''); setErrorMessage('');

    if (!activityId || !termId) return setErrorMessage('Pick activity + term first.');
    if (bulkStudentIds.length === 0) return setErrorMessage('Pick at least one student.');

    try {
      const res = await bulkAdd({
        schoolId,
        activityId,
        termId,
        studentIds: bulkStudentIds,
        performanceRole: bulkRole.trim() || undefined,
      }).unwrap();
      const added = (res as any)?.added ?? bulkStudentIds.length;
      const skipped = (res as any)?.skipped ?? 0;
      setSuccessMessage(`Added ${added} student${added === 1 ? '' : 's'}${skipped > 0 ? `, ${skipped} skipped` : ''}.`);
      setBulkStudentIds([]);
      setBulkRole('');
      setShowBulk(false);
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Bulk add failed.');
    }
  };

  const handleUpdateRole = async (membershipId: string, role: string) => {
    setSuccessMessage(''); setErrorMessage('');
    try {
      await updateRole({ membershipId, performanceRole: role }).unwrap();
      setSuccessMessage('Role updated.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to update role.');
    }
  };

  const handleRemove = async (membershipId: string, studentId: string) => {
    const s = studentMap.get(studentId);
    const name = s ? `${s.firstName ?? ''} ${s.lastName ?? ''}` : 'this student';
    if (!window.confirm(`Remove ${name} from this activity?`)) return;
    setSuccessMessage(''); setErrorMessage('');
    try {
      await removeMember(membershipId).unwrap();
      setSuccessMessage('Member removed.');
    } catch (err: any) {
      setErrorMessage(err?.data?.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Scope selectors */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-6 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Activity</label>
            <select
              value={activityId}
              onChange={(e) => setActivityId(e.target.value)}
              className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="">-- Choose activity --</option>
              {activities.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Term</label>
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

      {!activityId || !termId ? (
        <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl bg-base-200/20">
          Pick an activity and a term to manage members.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT: Add forms ── */}
          <div className="lg:col-span-5 space-y-4">
            {/* Single add */}
            <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Add a Student</h2>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider opacity-70">
                    <Search className="w-3.5 h-3.5" /> Student
                    <span className="ml-auto font-mono normal-case opacity-60">{candidates.length} eligible</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-primary">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={addSearch}
                      onChange={(e) => setAddSearch(e.target.value)}
                      placeholder="Search…"
                      className="w-full pl-10 pr-3 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <select
                    value={addForm.studentId}
                    onChange={(e) => setAddForm({ ...addForm, studentId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                  >
                    <option value="">
                      {filteredCandidates.length === 0
                        ? 'No matching students'
                        : `-- Choose from ${filteredCandidates.length} student${filteredCandidates.length === 1 ? '' : 's'} --`}
                    </option>
                    {filteredCandidates.slice(0, 200).map((s) => (
                      <option key={s.id} value={s.id}>{studentLabel(s)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Performance Role (optional)</label>
                  <input
                    type="text"
                    value={addForm.performanceRole}
                    onChange={(e) => setAddForm({ ...addForm, performanceRole: e.target.value })}
                    placeholder="e.g. Striker, Captain"
                    className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={adding}
                  className="w-full text-white font-black py-3 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                  style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
                >
                  {adding ? 'Adding…' : 'Add Student'}
                </button>
              </form>
            </div>

            {/* Bulk add collapsible */}
            <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-4">
              <button
                type="button"
                onClick={() => setShowBulk(!showBulk)}
                className="w-full flex items-center justify-between gap-3 pb-2 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg font-black tracking-tight">Bulk Add</h2>
                    <p className="text-[11px] opacity-60">Add many students at once</p>
                  </div>
                </div>
                {showBulk ? <ChevronDown className="w-4 h-4 opacity-60" /> : <ChevronRight className="w-4 h-4 opacity-60" />}
              </button>

              {showBulk && (
                <form onSubmit={handleBulkAdd} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Search & pick students</label>
                    <input
                      type="text"
                      value={bulkSearch}
                      onChange={(e) => setBulkSearch(e.target.value)}
                      placeholder="Filter students…"
                      className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-[11px] focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-base-100 border border-base-300 rounded-xl p-2 space-y-1">
                    {filteredForBulk.length === 0 ? (
                      <p className="text-[11px] opacity-60 text-center py-4">No eligible students.</p>
                    ) : (
                      filteredForBulk.slice(0, 100).map((s) => {
                        const checked = bulkStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[11px] transition-all ${
                              checked ? 'bg-primary/10' : 'hover:bg-base-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) setBulkStudentIds([...bulkStudentIds, s.id]);
                                else setBulkStudentIds(bulkStudentIds.filter((id) => id !== s.id));
                              }}
                              className="checkbox checkbox-primary checkbox-xs"
                            />
                            <span className="truncate">{studentLabel(s)}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  {bulkStudentIds.length > 0 && (
                    <p className="text-[10px] font-mono opacity-60">{bulkStudentIds.length} selected</p>
                  )}
                  <input
                    type="text"
                    value={bulkRole}
                    onChange={(e) => setBulkRole(e.target.value)}
                    placeholder="Common performance role (optional)"
                    className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-xl text-[11px]"
                  />
                  <button
                    type="submit"
                    disabled={bulkAdding || bulkStudentIds.length === 0}
                    className="w-full text-white font-black py-2.5 rounded-2xl hover:opacity-95 transition-all shadow-lg text-xs uppercase tracking-wider cursor-pointer disabled:opacity-60"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {bulkAdding ? 'Adding…' : `Add ${bulkStudentIds.length} student${bulkStudentIds.length === 1 ? '' : 's'}`}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* ── RIGHT: Roster ── */}
          <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-base-300">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black tracking-tight">Roster</h2>
              </div>
              <span className="text-xs font-mono font-bold opacity-60">{members.length} members</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs opacity-60">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
              </div>
            ) : members.length === 0 ? (
              <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-3xl">
                No members yet. Add some on the left.
              </div>
            ) : (
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    student={studentMap.get(m.studentId)}
                    primaryColor={primaryColor}
                    onUpdateRole={(role) => handleUpdateRole(m.id, role)}
                    onRemove={() => handleRemove(m.id, m.studentId)}
                    updatingRole={updatingRole}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member, student, primaryColor, onUpdateRole, onRemove, updatingRole,
}: {
  member: ActivityMembership;
  student?: Student;
  primaryColor: string;
  onUpdateRole: (role: string) => void;
  onRemove: () => void;
  updatingRole: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.performanceRole ?? '');

  const name = student
    ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()
    : 'Unknown student';
  const initials = `${student?.firstName?.[0] ?? '?'}${student?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="p-3 bg-base-100 border border-base-300 rounded-xl flex items-center gap-3 hover:border-primary transition-all">
      <div className="shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary grid place-items-center font-black text-[11px]">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black truncate">{name}</p>
        <p className="text-[10px] font-mono opacity-60 truncate">
          ADM {student?.admissionNumber ?? '—'}
        </p>
        {editing ? (
          <div className="mt-1.5 flex gap-1.5">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role"
              className="flex-1 px-2 py-1 bg-base-200 border border-base-300 rounded-lg text-[10px]"
              autoFocus
            />
            <button
              onClick={() => { onUpdateRole(role); setEditing(false); }}
              disabled={updatingRole}
              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white"
              style={{ backgroundColor: primaryColor }}
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setRole(member.performanceRole ?? ''); }}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-base-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          member.performanceRole && (
            <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-primary/10 text-primary">
              {member.performanceRole}
            </span>
          )
        )}
      </div>
      {!editing && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 bg-base-200 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
            title="Edit role"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 bg-error/10 text-error rounded-lg hover:bg-error hover:text-error-content transition-all"
            title="Remove"
          >
            <UserMinus className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   INSIGHTS TAB
   ════════════════════════════════════════════════════════════════ */
function InsightsTab({ schoolId, primaryColor, secondaryColor }: {
  schoolId: string; primaryColor: string; secondaryColor: string;
}) {
  const { data: statsData, isLoading: loadingStats } = useGetEventStatsQuery(schoolId, { skip: !schoolId });
  const { data: activitiesData } = useGetActivitiesForSchoolQuery({ schoolId }, { skip: !schoolId });
  const { data: calendarData } = useGetEventCalendarQuery({ schoolId }, { skip: !schoolId });

  const stats = (statsData as any)?.stats ?? {};
  const activities = useMemo(() => extractActivities(activitiesData), [activitiesData]);
  const calendar = (calendarData as any)?.calendar ?? {};

  const totalEvents = stats.total ?? 0;
  const byCategory = stats.byCategory ?? {};
  const upcoming = stats.upcoming ?? 0;
  const thisMonth = stats.thisMonth ?? 0;

  // Activity category breakdown
  const activityByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      map[a.category] = (map[a.category] ?? 0) + 1;
    });
    return map;
  }, [activities]);

  // Month counts for mini chart
  const monthKeys = Object.keys(calendar).sort();

  return (
    <div className="space-y-6">
      {/* Stats tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={CalendarDays} label="Total events" value={loadingStats ? '…' : totalEvents} tone="primary" />
        <StatTile icon={Clock} label="Upcoming" value={loadingStats ? '…' : upcoming} tone="warning" />
        <StatTile icon={CalIcon} label="This month" value={loadingStats ? '…' : thisMonth} tone="success" />
        <StatTile icon={Trophy} label="Activities" value={activities.length} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by category */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-base-300">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Events by Category</h2>
          </div>
          {Object.keys(byCategory).length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              No events yet.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(byCategory).map(([cat, count]) => {
                const tone = EVENT_TONES[cat] ?? EVENT_TONES.General;
                const pct = totalEvents > 0 ? ((count as number) / totalEvents) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase ${tone.text}`}>{cat}</span>
                      <span className="text-xs font-mono font-black">{count as number}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-base-200 overflow-hidden">
                      <div className={`h-full rounded-full ${tone.bg.replace('/10', '')}`} style={{ width: `${pct}%`, backgroundColor: primaryColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activities by category */}
        <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-base-300 border-b">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${secondaryColor}20`, color: secondaryColor }}>
              <Trophy className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">Activities by Category</h2>
          </div>
          {Object.keys(activityByCategory).length === 0 ? (
            <div className="p-8 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
              No activities yet.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(activityByCategory).map(([cat, count]) => {
                const tone = ACTIVITY_TONES[cat] ?? { bg: 'bg-base-300', text: 'text-base-content/70' };
                const pct = activities.length > 0 ? (count / activities.length) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-black uppercase ${tone.text}`}>{cat}</span>
                      <span className="text-xs font-mono font-black">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-base-200 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: secondaryColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Month volume chart */}
      <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 rounded-3xl shadow-xl space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-base-300">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Events by Month</h2>
            <p className="text-[11px] opacity-60">Full calendar</p>
          </div>
        </div>

        {monthKeys.length === 0 ? (
          <div className="p-10 text-center text-xs opacity-60 border-2 border-dashed border-base-300 rounded-2xl">
            No events scheduled.
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2 h-40 px-2">
              {monthKeys.map((k) => {
                const count = (calendar[k] as SchoolEvent[]).length;
                const maxCount = Math.max(1, ...monthKeys.map((mk) => (calendar[mk] as SchoolEvent[]).length));
                const h = (count / maxCount) * 100;
                return (
                  <div key={k} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <span className="absolute -top-4 text-[9px] font-mono font-black opacity-0 group-hover:opacity-100">
                      {count}
                    </span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{ height: `${h}%`, backgroundColor: primaryColor, minHeight: count > 0 ? 4 : 0 }}
                      title={`${fmtMonth(k)}: ${count}`}
                    />
                    <span className="mt-1 text-[9px] font-mono opacity-60 truncate w-full text-center">
                      {k.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono opacity-50 px-2">
              <span>{fmtMonth(monthKeys[0])}</span>
              <span>{fmtMonth(monthKeys[monthKeys.length - 1])}</span>
            </div>
          </>
        )}
      </div>
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

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
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