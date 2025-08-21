import { Button } from '@/components/ui/button';
import { CompanyInvitation } from '@/types/database';

interface JoinStatusMessagesProps {
  invitation: CompanyInvitation;
  isExpired: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  onRefreshAuth: () => void;
}

export function JoinStatusMessages({
  invitation,
  isExpired,
  isAuthenticated,
  userEmail,
  onRefreshAuth,
}: JoinStatusMessagesProps) {
  if (isExpired) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-destructive mb-1">Invitation Expired</p>
            <p className="text-sm text-foreground">
              This invitation has expired. Please contact the company owner for a new invitation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-warning/5 border border-warning/20 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <p className="font-medium text-warning mb-1">Authentication Required</p>
            <p className="text-sm text-foreground">
              You need to sign in or create an account to join this company.
            </p>
            {userEmail && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  If you just created an account, try refreshing the authentication state:
                </p>
                <Button 
                  onClick={onRefreshAuth} 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                >
                  Refresh Auth State
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (userEmail !== invitation.invited_email) {
    return (
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-medium text-orange-800 mb-1">Email Mismatch</p>
            <p className="text-sm text-foreground">
              This invitation was sent to <strong>{invitation.invited_email}</strong>, but you're signed in as <strong>{userEmail}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
