import React, { useState } from 'react';
import { useRegisterSchoolAdminMutation } from '../../features/Apis/Auth.Api';
import { useGetAllSchoolsQuery } from '../../features/Apis/School.Api';


interface SchoolAdminFormData {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  tscNumber: string;
  password: string;
}

export default function SchoolAdminManager() {
  const [formData, setFormData] = useState<SchoolAdminFormData>({
    schoolId: '',
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    tscNumber: '',
    password: '',
  });

  const [searchCode, setSearchCode] = useState<string>('');
  const [adminsList, setAdminsList] = useState<SchoolAdminFormData[]>([]);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [registerSchoolAdmin, { isLoading, error }] = useRegisterSchoolAdminMutation();
  const { data: schoolsData, isLoading: isSchoolsLoading } = useGetAllSchoolsQuery();
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');
    try {
      await registerSchoolAdmin(formData).unwrap();
      setSuccessMessage('School Admin registered successfully!');
      setAdminsList((prev) => [...prev, formData]);
      setFormData({
        schoolId: '',
        name: '',
        email: '',
        phone: '',
        nationalId: '',
        tscNumber: '',
        password: '',
      });
    } catch (err) {
      console.error('Failed to register school admin:', err);
    }
  };

  const filteredAdmins = adminsList.filter((admin) => {
    const query = searchCode.toLowerCase();
    return (
      admin.nationalId.toLowerCase().includes(query) ||
      admin.tscNumber.toLowerCase().includes(query) ||
      admin.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 text-base leading-relaxed bg-base-100 text-base-content transition-colors duration-300 min-h-screen">
      {/* Header Banner */}
      <div className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent border border-base-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-wider">Super Admin Portal</span>
          <h1 className="text-3xl font-black text-primary mt-2">School Admin Command Center</h1>
          <p className="text-sm opacity-75 mt-1">Manage institutional principals, credentials, and access keys in one unified workspace.</p>
        </div>
        <div className="stats bg-base-200 border border-base-300 shadow-sm">
          <div className="stat px-6 py-3">
            <div className="stat-title text-xs font-semibold opacity-70">Active Sessions</div>
            <div className="stat-value text-2xl text-primary">{adminsList.length}</div>
            <div className="stat-desc text-[10px]">Registered in session</div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Split into Registration & Lookup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Registration Form (7 cols) */}
        <div className="lg:col-span-7 bg-base-200/50 backdrop-blur-md border border-base-300 p-8 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-300">
              <div className="w-3 h-8 bg-primary rounded-full"></div>
              <div>
                <h2 className="text-xl font-bold">New Administrator Profile</h2>
                <p className="text-xs opacity-60">Complete all required credentials for authorization.</p>
              </div>
            </div>

            {successMessage && (
              <div className="mb-6 p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-success animate-ping"></span>
                <span className="text-sm font-semibold">{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-sm">
                <span className="text-sm font-semibold">{(error as any)?.data?.message || 'Registration failed. Please check inputs.'}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Target School</label>
                <select
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium shadow-sm"
                >
                  <option value="">{isSchoolsLoading ? 'Loading schools...' : 'Select Target Institution...'}</option>
                  {schoolsData?.schools?.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} {school.shortName ? `(${school.shortName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Full Name</label>
                  <input type="text" name="name" placeholder="School Principal" value={formData.name} onChange={handleChange} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Email Address</label>
                  <input type="email" name="email" placeholder="principal1@school.edu" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Phone</label>
                  <input type="text" name="phone" placeholder="+254..." value={formData.phone} onChange={handleChange} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">National ID</label>
                  <input type="text" name="nationalId" placeholder="222222223" value={formData.nationalId} onChange={handleChange} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70 mb-1">TSC Number</label>
                  <input type="text" name="tscNumber" placeholder="TSC9876542" value={formData.tscNumber} onChange={handleChange} required className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Secure Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-primary hover:underline font-bold focus:outline-none"
                  >
                    {showPassword ? 'Hide Secret' : 'Reveal Secret'}
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="securepassword123"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
                />
              </div>

              <div className="pt-2">
                <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-content font-bold py-3.5 px-6 rounded-2xl hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm tracking-wide">
                  {isLoading ? 'Authorizing & Registering...' : 'Initialize & Register Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Search & Quick Directory (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-base-200/50 backdrop-blur-md border border-base-300 p-8 rounded-3xl shadow-xl flex-1">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-300">
              <div className="w-3 h-8 bg-secondary rounded-full"></div>
              <div>
                <h2 className="text-xl font-bold">Directory Search</h2>
                <p className="text-xs opacity-60">Find admin by unique code identifiers.</p>
              </div>
            </div>

            <div className="relative mb-6">
              <input
                type="text"
                placeholder="Filter by ID, TSC, or Email..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all text-sm shadow-sm"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin, idx) => (
                  <div key={idx} className="p-4 bg-base-100 border border-base-300 rounded-2xl shadow-sm hover:border-primary transition-all space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm">{admin.name}</h3>
                      <span className="badge badge-primary badge-sm text-[10px] font-bold">Active</span>
                    </div>
                    <p className="text-xs opacity-70 truncate">{admin.email}</p>
                    <div className="flex gap-2 pt-1 border-t border-base-200 text-[11px] font-mono opacity-80">
                      <span className="bg-base-200 px-2 py-0.5 rounded-lg">ID: {admin.nationalId}</span>
                      <span className="bg-base-200 px-2 py-0.5 rounded-lg">TSC: {admin.tscNumber}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm opacity-60 border border-dashed border-base-300 rounded-2xl">
                  No registered administrators match your lookup query.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}