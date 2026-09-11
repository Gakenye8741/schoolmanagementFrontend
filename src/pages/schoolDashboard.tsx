import { useSelector } from 'react-redux';
import { useGetSchoolByIdQuery } from '../features/Apis/School.Api';
import { Building2, Mail, Phone, MapPin, Award, UserCheck, ShieldCheck } from 'lucide-react';
import type { RootState } from '../App/store';

const SchoolDashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Automatically fetch school details using the schoolId from the logged-in user's token/profile
 const { data: school, isLoading, error } = useGetSchoolByIdQuery(user?.schoolId ?? '', {
  skip: !user?.schoolId,
});

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center p-6">
        <h2 className="text-2xl font-bold text-error mb-2">Failed to load school context</h2>
        <p className="text-base-content/70">Could not retrieve institution records for your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Dynamic Header styled with school's primary branding color */}
      <header 
        className="text-white p-6 shadow-lg transition-colors duration-300"
        style={{ backgroundColor: school.primaryColor || '#0F172A' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="School Logo" className="w-16 h-16 rounded-full bg-white p-1 object-cover shadow" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold">
                🏫
              </div>
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{school.name}</h1>
              <p className="text-sm italic opacity-90">{school.motto}</p>
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-right">
            <p className="font-semibold text-lg">{user?.name}</p>
            <span className="badge badge-sm uppercase tracking-wider bg-white/20 text-white border-none">
              {user?.role}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-base-100 shadow rounded-box border border-base-300">
            <div className="stat-figure text-primary"><Building2 size={28} /></div>
            <div className="stat-title">Curriculum Type</div>
            <div className="stat-value text-2xl">{school.curriculumType}</div>
            <div className="stat-desc">Type: {school.schoolType}</div>
          </div>

          <div className="stat bg-base-100 shadow rounded-box border border-base-300">
            <div className="stat-figure text-secondary"><UserCheck size={28} /></div>
            <div className="stat-title">Principal</div>
            <div className="stat-value text-xl truncate">{school.principalName}</div>
            <div className="stat-desc">Est. {school.establishedYear}</div>
          </div>

          <div className="stat bg-base-100 shadow rounded-box border border-base-300">
            <div className="stat-figure text-accent"><Award size={28} /></div>
            <div className="stat-title">Subscription</div>
            <div className="stat-value text-2xl uppercase">{school.subscriptionPlan}</div>
            <div className="stat-desc text-success font-medium">{school.subscriptionStatus}</div>
          </div>

          <div className="stat bg-base-100 shadow rounded-box border border-base-300">
            <div className="stat-figure text-info"><ShieldCheck size={28} /></div>
            <div className="stat-title">KNEC Code</div>
            <div className="stat-value text-2xl">{school.knecCode}</div>
            <div className="stat-desc">Reg: {school.registrationNumber}</div>
          </div>
        </div>

        {/* Detailed Info Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow border border-base-300 p-6 space-y-4">
            <h3 className="text-xl font-bold border-b pb-2">📍 Contact & Location</h3>
            <ul className="space-y-3 text-base-content/80">
              <li className="flex items-center space-x-3">
                <MapPin className="text-primary" size={20} />
                <span>{school.address}, {school.subCounty}, {school.county} County</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="text-primary" size={20} />
                <span>{school.phone}</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="text-primary" size={20} />
                <span>{school.email}</span>
              </li>
            </ul>
          </div>

          <div className="card bg-base-100 shadow border border-base-300 p-6 space-y-4">
            <h3 className="text-xl font-bold border-b pb-2">🎨 System Branding Configuration</h3>
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-semibold mb-1">Primary Theme Color</p>
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-full shadow border" style={{ backgroundColor: school.primaryColor }}></span>
                  <span className="font-mono text-sm">{school.primaryColor}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Secondary Theme Color</p>
                <div className="flex items-center space-x-2">
                  <span className="w-8 h-8 rounded-full shadow border" style={{ backgroundColor: school.secondaryColor }}></span>
                  <span className="font-mono text-sm">{school.secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SchoolDashboard;