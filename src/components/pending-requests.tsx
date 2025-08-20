'use client';

import { CompanyJoinRequest } from '@/types/database';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { CompanyService } from '@/lib/company-service';

interface PendingRequestWithProfile extends CompanyJoinRequest {
  user_profile: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

interface PendingRequestsProps {
  requests: PendingRequestWithProfile[];
  companyId: string;
  onRequestUpdate: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function PendingRequests({ 
  requests, 
  companyId, 
  onRequestUpdate, 
  isLoading, 
  error 
}: PendingRequestsProps) {
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  const handleApprove = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      // Get current user ID from auth context or pass it as prop
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { success, error } = await CompanyService.approveJoinRequest(requestId, user.id);
      
      if (success) {
        onRequestUpdate();
      } else {
        console.error('Failed to approve request:', error);
      }
    } catch (err) {
      console.error('Error approving request:', err);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingRequests(prev => new Set(prev).add(requestId));
    
    try {
      const { data: { user } } = await import('@/lib/supabase').then(m => m.supabase.auth.getUser());
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { success, error } = await CompanyService.rejectJoinRequest(requestId, user.id);
      
      if (success) {
        onRequestUpdate();
      } else {
        console.error('Failed to reject request:', error);
      }
    } catch (err) {
      console.error('Error rejecting request:', err);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getDisplayName = (email: string, firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    return email.split('@')[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Join Requests</CardTitle>
          <CardDescription>Loading requests...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
                <div className="w-20 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Join Requests</CardTitle>
          <CardDescription>Error loading requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Join Requests</CardTitle>
          <CardDescription>No pending requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">All join requests have been processed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Join Requests</CardTitle>
        <CardDescription>
          {requests.length} pending request{requests.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-foreground">
                    {getDisplayName(request.user_profile.email, request.user_profile.first_name, request.user_profile.last_name)}
                  </h3>
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    Pending
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {request.user_profile.email}
                </p>
                
                {request.message && (
                  <p className="text-sm text-muted-foreground/70 mt-2 italic">
                    &ldquo;{request.message}&rdquo;
                  </p>
                )}
                
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Requested {new Date(request.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  size="sm"
                  onClick={() => handleApprove(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processingRequests.has(request.id) ? 'Processing...' : 'Approve'}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(request.id)}
                  disabled={processingRequests.has(request.id)}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  {processingRequests.has(request.id) ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
