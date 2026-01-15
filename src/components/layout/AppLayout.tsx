import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { ForcePasswordChangeDialog } from '@/components/auth/ForcePasswordChangeDialog';

export function AppLayout() {
  const { isAuthenticated, isLoading, mustChangePassword, profile, refreshProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto">
        <div className="p-4 lg:p-8 pt-16">
          <Outlet />
        </div>
      </main>
      
      {/* Force password change dialog */}
      <ForcePasswordChangeDialog 
        open={mustChangePassword} 
        onSuccess={refreshProfile}
        userName={profile?.nome?.split(' ')[0]}
      />
    </div>
  );
}
