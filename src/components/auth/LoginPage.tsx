import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TermsOfService } from './TermsOfService';
import { PrivacyPolicy } from './PrivacyPolicy';

export const LoginPage: React.FC = () => {
  const { user, loading, error, signInWithGoogle } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign-in error:', error);
      // Error is handled by AuthContext
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-1/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

        <div className="relative text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary/10"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-foreground">Loading your workspace...</p>
          <p className="mt-2 text-sm text-muted-foreground">Please wait a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Animated gradient background with multiple layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-chart-1/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-chart-2/10 via-transparent to-transparent animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-1/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />

      {/* Centered Login Card */}
      <div className="relative w-full max-w-sm z-10">
        {/* Login card with glassmorphism */}
        <Card className="w-full border-border/50 shadow-2xl backdrop-blur-sm bg-card/80 hover:shadow-primary/10 transition-all duration-500">
          <CardHeader className="space-y-4 pb-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 pt-4 pb-0">
              <img
                src="/orchestrator-logo.png"
                alt="Orchestrator"
                className="h-20 w-auto object-contain"
              />
              <h1 className="text-l text-foreground muted">
                Media Orchestrator
              </h1>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold">
                Welcome back
              </CardTitle>
              <CardDescription className="text-base">
                Sign in to continue to your workspace
              </CardDescription>
            </div>

            <Separator className="bg-border/50" />
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error display */}
            {error && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Sign in button with enhanced styling */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full h-16 text-base font-semibold relative overflow-hidden group shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-chart-3 to-primary bg-[length:200%_100%] group-hover:bg-right transition-all duration-500" />
              {isSigningIn ? (
                <span className="relative flex items-center justify-center">
                  <div className="relative mr-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-primary-foreground/30 border-t-primary-foreground"></div>
                  </div>
                  Signing you in...
                </span>
              ) : (
                <span className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </span>
              )}
            </Button>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Protected by Google OAuth 2.0</span>
            </div>

            <Separator className="bg-border/50" />

            {/* Terms and privacy */}
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By signing in, you agree to our{' '}
                <button
                  onClick={() => setShowTerms(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Terms of Service
                </button>{' '}
                and{' '}
                <button
                  onClick={() => setShowPrivacy(true)}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  Privacy Policy
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms of Service Dialog */}
        <TermsOfService open={showTerms} onOpenChange={setShowTerms} />

        {/* Privacy Policy Dialog */}
        <PrivacyPolicy open={showPrivacy} onOpenChange={setShowPrivacy} />

        {/* Additional trust indicators */}
        {/* <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>All systems operational</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>256-bit encryption</span>
          </div>
        </div> */}
      </div>
    </div>
  );
};