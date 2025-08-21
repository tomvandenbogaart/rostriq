import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CompanyInvitation } from '@/types/database';

interface JoinActionButtonsProps {
  invitation: CompanyInvitation;
  isExpired: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  hasAutoAccepted: boolean;
  isJoining: boolean;
  onJoinCompany: () => Promise<void>;
  onRefreshAuth: () => void;
}

export function JoinActionButtons({
  invitation,
  isExpired,
  isAuthenticated,
  userEmail,
  hasAutoAccepted,
  isJoining,
  onJoinCompany,
  onRefreshAuth,
}: JoinActionButtonsProps) {
  const router = useRouter();

  const handleSignIn = () => {
    const prefEmail = invitation?.invited_email || '';
    router.push(`/signin?token=${invitation.invitation_token}&email=${encodeURIComponent(prefEmail)}&redirect=/join?token=${invitation.invitation_token}`);
  };

  const handleSignUp = () => {
    const prefEmail = invitation?.invited_email || '';
    router.push(`/signup?token=${invitation.invitation_token}&email=${encodeURIComponent(prefEmail)}&redirect=/join?token=${invitation.invitation_token}`);
  };

  if (isExpired) {
    return (
      <Button onClick={() => router.push('/')} className="w-full" size="lg">
        Go Home
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center">
        <Button onClick={handleSignUp} className="w-full max-w-xs" size="lg">
          Create Account
        </Button>
      </div>
    );
  }

  if (userEmail !== invitation.invited_email) {
    return (
      <Button onClick={() => router.push('/')} className="w-full" size="lg">
        Go Home
      </Button>
    );
  }

  if (hasAutoAccepted) {
    return (
      <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-center gap-2 text-green-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">
            Invitation accepted! Redirecting...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={onJoinCompany} 
        disabled={isJoining}
        className="w-full"
        size="lg"
      >
        {isJoining ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            Joining Company...
          </div>
        ) : (
          'Join Company'
        )}
      </Button>
      
      <div className="text-center">
        <Button 
          onClick={onRefreshAuth} 
          variant="ghost" 
          size="sm"
        >
          Refresh Authentication State
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          If the button above doesn&apos;t work, try refreshing the auth state
        </p>
      </div>
    </div>
  );
}
