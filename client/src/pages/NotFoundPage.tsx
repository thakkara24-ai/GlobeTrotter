import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6 border border-brand-100 shadow-soft">
        <Compass className="w-10 h-10 animate-spin-slow" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        It seems you've wandered off the travel route. The page or destination you are looking for does not exist.
      </p>
      <Button variant="primary" onClick={() => navigate('/dashboard')} leftIcon={<Home className="w-4 h-4" />}>
        Return to Dashboard
      </Button>
    </div>
  );
};
