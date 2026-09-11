import { useForm } from 'react-hook-form';
import { toast, Toaster } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLoginUserMutation } from '../../features/Apis/Auth.Api';
import { setCredentials } from '../../features/Auth/AuthSlice';
import { Navbar } from '../../components/Navbar';

interface LoginDetails {
  identifier: string;
  password: string;
}

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginDetails>();
  const [loginUser, { isLoading }] = useLoginUserMutation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginDetails) => {
    const loadingToastId = toast.loading("Authenticating credentials...");
    try {
      const res = await loginUser(data).unwrap();
      toast.success('🎉 Welcome back!', { id: loadingToastId });
      
      dispatch(
        setCredentials({
          user: res.user,
          token: res.token,
          role: res.user.role,
        })
      );

      const userRole = res.user.role;

      // Role-based redirection mapping
      switch (userRole) {
        case 'super_admin':
          navigate('/superAdmindashboard/AllUsers');
          break;
        case 'school_admin':
        case 'admin':
          navigate('/schoolAdmindashboard');
          break;
        case 'teacher':
          navigate('/teacherdashboard');
          break;
        case 'student':
          navigate('/studentdashboard');
          break;
        case 'parent':
          navigate('/parentdashboard');
          break;
        default:
          navigate('/Admissions');
          break;
      }
    } catch (error: any) {
      const ErrorMessage = 
        error?.data?.error?.error || 
        error?.data?.message || 
        error?.data?.error || 
        error?.error || 
        'Invalid credentials or server error. Please try again.';
      toast.error(ErrorMessage, { id: loadingToastId });
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <Navbar />
      <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 lg:grid-cols-12 bg-base-100 text-base-content">
        
        {/* Left Side: Modern Visual Banner */}
        <div className="hidden lg:flex lg:col-span-7 relative bg-gradient-to-br from-primary/90 to-primary-focus overflow-hidden items-center justify-center p-12 text-primary-content">
          {/* Background Decorative Shapes */}
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-lg space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold tracking-wider uppercase border border-white/20">
              <ShieldCheck className="w-4 h-4" /> Secure Portal Gateway
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Empowering Education Through Smart Management.
            </h1>
            <p className="text-primary-content/80 text-base leading-relaxed">
              Access administrative tools, student records, academic tracking, and real-time institutional analytics all in one unified platform.
            </p>
            
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-white/15">
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-primary-content/70">Secure & Encrypted</p>
              </div>
              <div>
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-xs text-primary-content/70">Platform Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold">Fast</p>
                <p className="text-xs text-primary-content/70">Cloud Sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Professional Form Card */}
        <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 bg-base-200/50">
          <div className="bg-base-100 shadow-2xl rounded-3xl p-8 sm:p-10 w-full max-w-md border border-base-300">
            
            <div className="mb-8 text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
                Sign In to ElimuHub
              </h2>
              <p className="text-sm text-base-content/60 mt-1.5">
                Enter your account details to access your dashboard.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              {/* Identifier Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs uppercase tracking-wider">Email or Identifier</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-base-content/40">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    className="input input-bordered w-full pl-10 rounded-xl focus:input-primary transition-all bg-base-100"
                    placeholder="name@example.com or ID"
                    {...register('identifier', { required: 'Email or identifier is required' })}
                  />
                </div>
                {errors.identifier && (
                  <span className="text-error text-xs mt-1.5 font-medium block">{errors.identifier.message}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold text-xs uppercase tracking-wider">Password</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-base-content/40">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input input-bordered w-full pl-10 pr-10 rounded-xl focus:input-primary transition-all bg-base-100"
                    placeholder="Enter your password"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-base-content/40 hover:text-primary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-error text-xs mt-1.5 font-medium block">{errors.password.message}</span>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-full mt-2 rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="divider my-6 text-xs text-base-content/40 uppercase font-medium">OR</div>

            <p className="text-sm text-center text-base-content/70">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;