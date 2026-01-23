import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from './Sidebar';
import { ForcePasswordChangeDialog } from '@/components/auth/ForcePasswordChangeDialog';
import { TourButton } from '@/components/tour/TourButton';
import { TourWelcomeDialog } from '@/components/tour/TourWelcomeDialog';

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
    <SidebarProvider>
      <Outlet />
      
      {/* Force password change dialog */}
      <ForcePasswordChangeDialog 
        open={mustChangePassword} 
        onSuccess={refreshProfile}
        userName={profile?.nome?.split(' ')[0]}
      />
      
      {/* Tour components */}
      <TourWelcomeDialog />
      <TourButton />
    </SidebarProvider>
  );
}
