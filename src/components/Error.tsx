import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error() {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const errorMessage = error?.statusText || error?.message || 'An unexpected error occurred while processing your request.';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[80vh] flex items-center justify-center">
      <div className="w-full bg-base-200/40 backdrop-blur-xl border border-base-300/80 p-8 sm:p-10 rounded-3xl shadow-2xl text-center space-y-6 animate-fadeIn">
        
        {/* Error Icon */}
        <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-error/20">
          <AlertTriangle className="w-10 h-10" />
        </div>

        {/* Heading & Message */}
        <div className="space-y-2">
          <span className="px-3 py-1 bg-error/10 text-error text-xs font-black rounded-full uppercase tracking-wider">
            {error?.status ? `Error ${error.status}` : 'System Error'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content">
            Something went wrong!
          </h1>
          <p className="text-sm opacity-75 max-w-md mx-auto">
            {errorMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-content font-black py-3 px-6 rounded-2xl hover:opacity-95 transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-wider cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-base-300/60 text-base-content font-black py-3 px-6 rounded-2xl hover:bg-base-300 transition-all text-xs uppercase tracking-wider cursor-pointer"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}