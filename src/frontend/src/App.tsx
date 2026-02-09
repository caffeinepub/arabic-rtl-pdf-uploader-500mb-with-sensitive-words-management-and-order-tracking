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
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">نظام إدارة الملفات والطلبات</h1>
                <p className="text-sm text-muted-foreground">إدارة شاملة للمستندات والكلمات الحساسة والطلبات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {isAuthenticated && userProfile && (
                <div className="text-sm text-muted-foreground">
                  مرحباً، <span className="font-semibold text-foreground">{userProfile.name}</span>
                </div>
              )}
              <Button
                onClick={handleAuth}
                disabled={isLoggingIn}
                variant={isAuthenticated ? 'outline' : 'default'}
                className="gap-2"
              >
                {isLoggingIn ? (
                  'جاري تسجيل الدخول...'
                ) : isAuthenticated ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Wrapped with Error Boundary */}
      <main className="container mx-auto px-4 py-8">
        <LoginGate>
          <ProfileSetupDialog open={showProfileSetup} />
          
          <AppErrorBoundary>
            <Tabs defaultValue="pdf" className="w-full" dir="rtl">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="pdf" className="gap-2">
                  <FileText className="w-4 h-4" />
                  رفع ملفات PDF
                </TabsTrigger>
                <TabsTrigger value="words" className="gap-2">
                  <Shield className="w-4 h-4" />
                  الكلمات الحساسة
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                  <ClipboardList className="w-4 h-4" />
                  متابعة الطلبات
                </TabsTrigger>
              </TabsList>

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
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            © 2026. بُني بـ <Heart className="inline w-4 h-4 text-destructive fill-destructive" /> باستخدام{' '}
            <a 
              href="https://caffeine.ai" 
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
