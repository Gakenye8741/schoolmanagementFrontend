import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, GraduationCap, ArrowLeft, Bug, Server, Terminal, ShieldAlert } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export default function Error() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const errorMessage = error?.statusText || error?.message || 'Something went wrong. Please try again.';
  const errorCode = error?.status || '500';
  const errorStack = error?.stack || null;

  return (
    <div className="min-h-screen bg-base-200/30 flex flex-col selection:bg-primary selection:text-primary-content">
      {/* Navbar fixed with full layout integration */}
      <Navbar />

      {/* Main Error Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="w-full max-w-3xl bg-base-100/90 backdrop-blur-2xl border border-base-300/80 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl text-center space-y-8 animate-fadeIn relative overflow-hidden">
          
          {/* Background decorative glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/10 blur-3xl pointer-events-none rounded-full"></div>

          {/* Brand Logo / Error Icon Hybrid */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-primary/60 text-primary-content rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/25 border border-primary/20 transform hover:scale-105 transition-transform duration-300">
              <GraduationCap className="w-12 h-12" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-error text-error-content rounded-2xl flex items-center justify-center shadow-lg border-4 border-base-100 animate-bounce">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* Heading & Message */}
          <div className="space-y-3 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-error/10 text-error text-xs font-black rounded-full uppercase tracking-wider border border-error/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Academiq Status: Error {errorCode}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-base-content">
              Something Went Wrong
            </h1>
            <p className="text-sm sm:text-base text-base-content/75 leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-base-200/60 border border-base-300 rounded-3xl p-6 text-left space-y-4 shadow-inner">
            <div className="flex items-center justify-between border-b border-base-300/60 pb-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-base-content/70">
                <Terminal className="w-4 h-4 text-primary" />
                <span>Error Details</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
                <span className="text-[11px] font-bold text-base-content/60">System Alert</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium text-base-content/80">
              <div className="bg-base-100/80 p-3.5 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] uppercase font-bold text-base-content/50 block">Where It Happened</span>
                <span className="flex items-center gap-2 font-bold text-base-content">
                  <Server className="w-3.5 h-3.5 text-primary" /> Academiq App
                </span>
              </div>
              <div className="bg-base-100/80 p-3.5 rounded-2xl border border-base-300 space-y-1">
                <span className="text-[10px] uppercase font-bold text-base-content/50 block">Error Code</span>
                <span className="flex items-center gap-2 font-bold text-error">
                  <Bug className="w-3.5 h-3.5" /> Code {errorCode}
                </span>
              </div>
            </div>

            {errorStack && (
              <div className="bg-base-900 text-base-200 p-3.5 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-32 border border-base-300/40">
                <code>{errorStack}</code>
              </div>
            )}

            <p className="text-xs text-base-content/60 italic text-center pt-1">
              We have saved this error so our team can fix it. Sorry for the trouble!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-3.5 px-7 rounded-2xl hover:opacity-95 transition-all shadow-xl shadow-primary/25 text-xs uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-base-200 text-base-content font-black py-3.5 px-6 rounded-2xl hover:bg-base-300 transition-all text-xs uppercase tracking-wider cursor-pointer border border-base-300"
            >
              <ArrowLeft className="w-4 h-4 text-primary" /> Go Back
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-base-100 text-base-content font-black py-3.5 px-6 rounded-2xl hover:bg-base-200 transition-all text-xs uppercase tracking-wider cursor-pointer border border-base-300 shadow-sm"
            >
              <GraduationCap className="w-4 h-4 text-primary" /> Academiq Home
            </button>
          </div>

        </div>
      </main>
      <Footer/>
    </div>
  );
}