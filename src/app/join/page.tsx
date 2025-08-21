'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCompanyInvitation } from '@/hooks/use-company-invitation';
import { useCompanyJoin } from '@/hooks/use-company-join';
import { useAuthStatus } from '@/hooks/use-auth-status';
import { 
  JoinPageHeader, 
  JoinStatusMessages, 
  JoinActionButtons, 
  JoinErrorDisplay 
} from '@/components/join';

export default function JoinPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // Custom hooks for business logic
  const { invitation, company, isLoading, error, isExpired, refreshInvitation } = useCompanyInvitation(token);
  const { isAuthenticated, userEmail, refreshAuth } = useAuthStatus();
  const { isJoining, error: joinError, hasAutoAccepted, isAutoAccepting, joinCompany } = useCompanyJoin(
    invitation,
    isAuthenticated,
    userEmail
  );

  // Handle no token case
  if (!token) {
    return <NoTokenView />;
  }

  // Handle loading state
  if (isLoading) {
    return <LoadingView />;
  }

  // Handle error state
  if (error) {
    return <ErrorView error={error} />;
  }

  // Handle missing data
  if (!invitation || !company) {
    return <MissingDataView />;
  }

  // Main join view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-border">
        <JoinPageHeader company={company} invitation={invitation} />
        
        <CardContent className="space-y-6">
          {/* Invitation Message */}
          {invitation.message && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <div>
                  <p className="font-medium text-primary mb-1">Personal Message</p>
                  <p className="text-sm text-foreground">&quot;{invitation.message}&quot;</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          <JoinStatusMessages
            invitation={invitation}
            isExpired={isExpired}
            isAuthenticated={isAuthenticated}
            userEmail={userEmail}
            onRefreshAuth={refreshAuth}
          />

          {/* Debug Info */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="space-y-2 text-xs">
              <p className="font-medium text-muted-foreground">Debug Info:</p>
              <div className="grid grid-cols-2 gap-2">
                <p>Is Authenticated: <span className={isAuthenticated ? 'text-green-600' : 'text-red-600'}>{isAuthenticated ? 'Yes' : 'No'}</span></p>
                <p>Is Expired: <span className={isExpired ? 'text-red-600' : 'text-green-600'}>{isExpired ? 'Yes' : 'No'}</span></p>
                <p>User Email: <span className="font-mono">{userEmail || 'Not set'}</span></p>
                <p>Invited Email: <span className="font-mono">{invitation.invited_email}</span></p>
                <p>Emails Match: <span className={userEmail === invitation.invited_email ? 'text-green-600' : 'text-red-600'}>{userEmail === invitation.invited_email ? 'Yes' : 'No'}</span></p>
                <p>Show Accept Button: <span className={isAuthenticated && !isExpired && userEmail === invitation.invited_email ? 'text-green-600' : 'text-red-600'}>{isAuthenticated && !isExpired && userEmail === invitation.invited_email ? 'Yes' : 'No'}</span></p>
                <p>Has Auto Accepted: <span className={hasAutoAccepted ? 'text-green-600' : 'text-red-600'}>{hasAutoAccepted ? 'Yes' : 'No'}</span></p>
                <p>Is Auto Accepting: <span className={isAutoAccepting ? 'text-green-600' : 'text-red-600'}>{isAutoAccepting ? 'Yes' : 'No'}</span></p>
                <p>Is Joining: <span className={isJoining ? 'text-green-600' : 'text-red-600'}>{isJoining ? 'Yes' : 'No'}</span></p>
                <p>Token: <span className="font-mono text-xs">{token}</span></p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <JoinActionButtons
            invitation={invitation}
            isExpired={isExpired}
            isAuthenticated={isAuthenticated}
            userEmail={userEmail}
            hasAutoAccepted={hasAutoAccepted}
            isJoining={isJoining}
            onJoinCompany={joinCompany}
            onRefreshAuth={refreshAuth}
          />

          {/* Error Display */}
          <JoinErrorDisplay error={joinError} />

          {/* Go Home Button */}
          <Button 
            onClick={() => window.location.href = '/'} 
            variant="ghost" 
            className="w-full"
          >
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components for different states
function NoTokenView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-border">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Join a Company</h1>
          <p className="text-muted-foreground">You need an invitation to join a company</p>
          
          <div className="space-y-4">
            <Button onClick={() => window.location.href = '/signup'} className="w-full">
              Create Account First
            </Button>
            <Button 
              onClick={() => window.location.href = '/setup-company'} 
              variant="outline"
              className="w-full"
            >
              Create Your Own Company
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="ghost" 
              className="w-full"
            >
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LoadingView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Loading Invitation</h2>
          <p className="text-muted-foreground">Please wait while we verify your invitation...</p>
        </div>
      </div>
    </div>
  );
}

function ErrorView({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-destructive/20">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-destructive">Invalid Invitation</h1>
          <p className="text-muted-foreground">This invitation link is not valid or has expired.</p>
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
          </div>
          <Button onClick={() => window.location.href = '/'} className="w-full" size="lg">
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MissingDataView() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-2xl border-2 border-destructive/20">
        <div className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-destructive">Invitation Not Found</h1>
          <p className="text-muted-foreground">The invitation you&apos;re looking for could not be found.</p>
          <Button onClick={() => window.location.href = '/'} className="w-full" size="lg">
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
