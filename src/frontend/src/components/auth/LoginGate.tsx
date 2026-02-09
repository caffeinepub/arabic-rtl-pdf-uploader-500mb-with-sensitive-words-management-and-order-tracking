import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Shield } from 'lucide-react';
import { ReactNode } from 'react';

interface LoginGateProps {
  children: ReactNode;
}

export default function LoginGate({ children }: LoginGateProps) {
  const { identity, login, loginStatus } = useInternetIdentity();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">مرحباً بك</CardTitle>
            <CardDescription className="text-base">
              يرجى تسجيل الدخول للوصول إلى النظام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full gap-2"
              size="lg"
            >
              <LogIn className="w-5 h-5" />
              {isLoggingIn ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
