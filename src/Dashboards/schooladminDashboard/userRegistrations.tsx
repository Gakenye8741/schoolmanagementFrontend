import React, { useState, useEffect } from 'react';
import { useRegisterSchoolMemberMutation } from '../../features/Apis/Auth.Api';
import { useSelector } from 'react-redux';
import type { RootState } from '../../App/store';
import { 
  UserPlus, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  UserCheck, 
  GraduationCap, 
  DollarSign, 
  Users, 
  Building, 
  Mail, 
  Phone, 
  Lock, 
  CreditCard, 
  Hash, 
  Sparkles,
  Award
} from 'lucide-react';
import { useGetSchoolByIdQuery } from '../../features/Apis/School.Api';

type MemberRole = 'teacher' | 'student' | 'bursar' | 'parent';

interface MemberFormData {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  tscNumber: string;
  admissionNumber: string;
  role: MemberRole;
  password: string;
}

export default function RegisterSchoolMemberManager() {
  const { user } = useSelector((state: RootState) => state.auth);
  const currentSchoolId = user?.schoolId || user?.user?.schoolId || '';

  const { data: school } = useGetSchoolByIdQuery(currentSchoolId, {
    skip: !currentSchoolId,
  });

  const schoolName = school?.name || user?.schoolName || user?.user?.schoolName || 'Your Institution';

  const [selectedRole, setSelectedRole] = useState<MemberRole>('teacher');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [registeredMembers, setRegisteredMembers] = useState<MemberFormData[]>([]);

  const [formData, setFormData] = useState<MemberFormData>({
    schoolId: currentSchoolId,
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    tscNumber: '',
    admissionNumber: '',
    role: 'teacher',
    password: '',
  });

  useEffect(() => {
    if (currentSchoolId) {
      setFormData((prev) => ({ ...prev, schoolId: currentSchoolId }));
    }
  }, [currentSchoolId]);

  const [registerSchoolMember, { isLoading, error }] = useRegisterSchoolMemberMutation();

  const handleRoleSwitch = (role: MemberRole) => {
    setSelectedRole(role);
    setSuccessMessage('');
    setFormData((prev) => ({
      ...prev,
      role,
      schoolId: currentSchoolId,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMessage('');

    const payload: any = {
      schoolId: currentSchoolId,
      name: formData.name,
      email: formData.email,
      role: selectedRole,
      password: formData.password,
    };

    if (selectedRole === 'teacher') {
      payload.phone = formData.phone;
      payload.nationalId = formData.nationalId;
      payload.tscNumber = formData.tscNumber;
    } else if (selectedRole === 'student') {
      payload.admissionNumber = formData.admissionNumber;
    } else if (selectedRole === 'parent') {
      payload.phone = formData.phone;
    }

    try {
      await registerSchoolMember(payload).unwrap();
      setSuccessMessage(`Successfully registered ${selectedRole}: ${formData.name}`);
      setRegisteredMembers((prev) => [...prev, { ...formData, schoolId: currentSchoolId }]);
      
      setFormData({
        schoolId: currentSchoolId,
        name: '',
        email: '',
        phone: '',
        nationalId: '',
        tscNumber: '',
        admissionNumber: '',
        role: selectedRole,
        password: '',
      });
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-base-100 text-base-content min-h-screen">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-base-200 to-secondary/15 p-8 sm:p-10 rounded-3xl border border-base-300 shadow-sm">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-primary-content text-xs font-black rounded-full uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" /> Institutional Provisioning
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">Member Onboarding Suite</h1>
            <p className="text-sm sm:text-base opacity-75 max-w-xl">
              Provision credential profiles, map administrative roles, and onboard academic personnel securely into your ecosystem.
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-base-100/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-base-300 shadow-sm">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider opacity-60">Registered This Session</p>
              <p className="text-2xl font-black text-primary">{registeredMembers.length} <span className="text-xs font-semibold opacity-70">Profiles</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => handleRoleSwitch('teacher')}
          className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all text-left group shadow-xs ${
            selectedRole === 'teacher'
              ? 'bg-primary text-primary-content border-primary shadow-xl shadow-primary/25 scale-[1.02]'
              : 'bg-base-200/50 border-base-300 hover:bg-base-200 opacity-80'
          }`}
        >
          <div className={`p-3 rounded-xl transition-colors ${selectedRole === 'teacher' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Configure</p>
            <p className="text-sm font-black">Teacher Portal</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleRoleSwitch('student')}
          className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all text-left group shadow-xs ${
            selectedRole === 'student'
              ? 'bg-primary text-primary-content border-primary shadow-xl shadow-primary/25 scale-[1.02]'
              : 'bg-base-200/50 border-base-300 hover:bg-base-200 opacity-80'
          }`}
        >
          <div className={`p-3 rounded-xl transition-colors ${selectedRole === 'student' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Configure</p>
            <p className="text-sm font-black">Student Portal</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleRoleSwitch('bursar')}
          className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all text-left group shadow-xs ${
            selectedRole === 'bursar'
              ? 'bg-primary text-primary-content border-primary shadow-xl shadow-primary/25 scale-[1.02]'
              : 'bg-base-200/50 border-base-300 hover:bg-base-200 opacity-80'
          }`}
        >
          <div className={`p-3 rounded-xl transition-colors ${selectedRole === 'bursar' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Configure</p>
            <p className="text-sm font-black">Bursar Portal</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleRoleSwitch('parent')}
          className={`flex items-center gap-3 p-4 sm:p-5 rounded-2xl border transition-all text-left group shadow-xs ${
            selectedRole === 'parent'
              ? 'bg-primary text-primary-content border-primary shadow-xl shadow-primary/25 scale-[1.02]'
              : 'bg-base-200/50 border-base-300 hover:bg-base-200 opacity-80'
          }`}
        >
          <div className={`p-3 rounded-xl transition-colors ${selectedRole === 'parent' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Configure</p>
            <p className="text-sm font-black">Parent Portal</p>
          </div>
        </button>
      </div>

      {/* Form Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Registration Form Card */}
        <div className="lg:col-span-7 bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-base-300">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-primary/10 text-primary rounded-2xl shadow-xs">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black capitalize tracking-tight">Register New {selectedRole}</h2>
                <p className="text-xs opacity-60 font-medium">Complete all required credential fields below.</p>
              </div>
            </div>
            <span className="text-[11px] font-mono px-3 py-1.5 bg-base-300/80 rounded-xl font-bold uppercase tracking-wider text-base-content/70">
              POST /register/member
            </span>
          </div>

          {successMessage && (
            <div className="p-4 bg-success/10 border border-success/20 text-success rounded-2xl flex items-center gap-3 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 text-error rounded-2xl flex items-center gap-3 shadow-xs animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{(error as any)?.data?.message || 'Registration failed. Check inputs.'}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Institution Context Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Assigned Institution</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-primary">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={schoolName}
                  disabled
                  className="w-full pl-11 pr-4 py-3.5 bg-base-300/50 border border-base-300 rounded-2xl text-sm font-bold opacity-90 cursor-not-allowed shadow-inner"
                />
              </div>
              <span className="text-[10px] opacity-50 block font-medium">Linked automatically via secure active administrator session.</span>
            </div>

            {/* Name and Email Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Full Legal Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-base-content/40">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={selectedRole === 'teacher' ? 'Jane Teacher' : selectedRole === 'student' ? 'John Student' : selectedRole === 'bursar' ? 'Bursar Officer' : 'Parent Guardian'}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-base-content/40">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={`${selectedRole}@school.edu`}
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Role-Specific Fields */}
            {selectedRole === 'teacher' && (
              <div className="space-y-4 p-5 bg-base-100/80 rounded-2xl border border-base-300/60 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Teacher Credentials</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-base-content/40">
                        <Phone className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+254712345678"
                        required
                        className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-medium shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">National ID</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-base-content/40">
                        <CreditCard className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleChange}
                        placeholder="12345678"
                        required
                        className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-medium shadow-2xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">TSC Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-base-content/40">
                        <Hash className="w-3.5 h-3.5" />
                      </span>
                      <input
                        type="text"
                        name="tscNumber"
                        value={formData.tscNumber}
                        onChange={handleChange}
                        placeholder="TSC123456"
                        required
                        className="w-full pl-10 pr-3 py-3 bg-base-100 border border-base-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs font-medium shadow-2xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'student' && (
              <div className="space-y-4 p-5 bg-base-100/80 rounded-2xl border border-base-300/60 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Student Enrollment Data</span>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">Admission Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-base-content/40">
                      <Hash className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={handleChange}
                      placeholder="ADM/2026/001"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono shadow-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === 'parent' && (
              <div className="space-y-4 p-5 bg-base-100/80 rounded-2xl border border-base-300/60 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 border-b border-base-200">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Parent Contact Information</span>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-base-content/40">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+254798765432"
                      required
                      className="w-full pl-11 pr-4 py-3.5 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-70">Secure Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-primary hover:underline font-bold focus:outline-none flex items-center gap-1.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide Secret' : 'Reveal Secret'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-base-content/40">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="securepassword123"
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-base-100 border border-base-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Action Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-primary-content font-black py-4 px-6 rounded-2xl hover:opacity-95 active:scale-[0.99] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm tracking-wide uppercase cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Registering {selectedRole}...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Register {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Directory List Preview Card */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center gap-3.5 pb-5 border-b border-base-300">
              <div className="p-3 bg-secondary/10 text-secondary rounded-2xl shadow-xs">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">Session Manifest</h2>
                <p className="text-xs opacity-60 font-medium">Recently provisioned accounts in this runtime.</p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {registeredMembers.length > 0 ? (
                registeredMembers.map((member, idx) => (
                  <div key={idx} className="p-4.5 bg-base-100 border border-base-300 rounded-2xl shadow-xs hover:border-primary/50 transition-all space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-sm text-primary truncate">{member.name}</h3>
                      <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-xs opacity-75 truncate font-medium">{member.email}</p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-base-200/80 text-[10px] font-mono font-bold opacity-85">
                      {member.role === 'teacher' && (
                        <>
                          <span className="bg-base-200/80 px-2.5 py-1 rounded-lg">TSC: {member.tscNumber}</span>
                          <span className="bg-base-200/80 px-2.5 py-1 rounded-lg">ID: {member.nationalId}</span>
                        </>
                      )}
                      {member.role === 'student' && (
                        <span className="bg-base-200/80 px-2.5 py-1 rounded-lg">ADM: {member.admissionNumber}</span>
                      )}
                      {member.role === 'parent' && (
                        <span className="bg-base-200/80 px-2.5 py-1 rounded-lg">Phone: {member.phone}</span>
                      )}
                      {member.role === 'bursar' && (
                        <span className="bg-base-200/80 px-2.5 py-1 rounded-lg">Bursar Account</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-sm opacity-60 border-2 border-dashed border-base-300 rounded-3xl space-y-3">
                  <Users className="w-10 h-10 mx-auto opacity-30" />
                  <p className="font-semibold text-xs">No active registrations recorded in this session yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}