import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, FileText, Shield, ClipboardList } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import LoginGate from './components/auth/LoginGate';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import PdfUploadSection from './features/pdf/PdfUploadSection';
import SensitiveWordsSection from './features/sensitiveWords/SensitiveWordsSection';
import OrderTrackingSection from './features/orders/OrderTrackingSection';
import { Toaster } from '@/components/ui/sonner';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Heart } from 'lucide-react';
import { AppErrorBoundary } from './components/system/AppErrorBoundary';

export default function App() {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('خطأ في تسجيل الدخول:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Toaster position="top-center" />
      
      {/* Compact Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">PDF Package</h1>
                <p className="text-xs text-muted-foreground">Secure file management system</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAuthenticated && userProfile && (
                <div className="text-sm text-muted-foreground hidden sm:block">
                  Welcome, <span className="font-medium text-foreground">{userProfile.name}</span>
                </div>
              )}
              <Button
                onClick={handleAuth}
                disabled={isLoggingIn}
                variant={isAuthenticated ? 'outline' : 'default'}
                size="sm"
                className="gap-2"
              >
                {isLoggingIn ? (
                  'Logging in...'
                ) : isAuthenticated ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Login</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Centered with max-width */}
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <LoginGate>
          <ProfileSetupDialog open={showProfileSetup} />
          
          <AppErrorBoundary>
            <Tabs defaultValue="pdf" className="w-full" dir="rtl">
              {/* Pill-style Tab Navigation */}
              <div className="flex justify-center mb-6">
                <TabsList className="inline-flex h-11 items-center justify-center rounded-full bg-muted p-1 text-muted-foreground">
                  <TabsTrigger 
                    value="pdf" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    PDF Upload
                  </TabsTrigger>
                  <TabsTrigger 
                    value="words" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Sensitive Words
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-full px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
                  >
                    <ClipboardList className="w-4 h-4" />
                    Order Tracking
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pdf">
                <PdfUploadSection />
              </TabsContent>

              <TabsContent value="words">
                <SensitiveWordsSection />
              </TabsContent>

              <TabsContent value="orders">
                <OrderTrackingSection />
              </TabsContent>
            </Tabs>
          </AppErrorBoundary>
        </LoginGate>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-12">
        <div className="container mx-auto px-4 py-4">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with <Heart className="inline w-3.5 h-3.5 text-destructive fill-destructive" /> using{' '}
            <a 
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== 'undefined' ? window.location.hostname : 'pdf-package')}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

