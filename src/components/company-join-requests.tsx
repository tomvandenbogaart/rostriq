'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyService } from '@/lib/company-service'
import { CompanyJoinRequest } from '@/types/database'
import { User, Calendar, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface CompanyJoinRequestsProps {
  companyId: string
}

type JoinRequestWithUser = CompanyJoinRequest & {
  user_profile: {
    email: string
    first_name?: string
    last_name?: string
  }
}

export function CompanyJoinRequests({ companyId }: CompanyJoinRequestsProps) {
  const [requests, setRequests] = useState<JoinRequestWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [processingRequest, setProcessingRequest] = useState<string | null>(null)

  useEffect(() => {
    const fetchJoinRequests = async () => {
      setLoading(true);
      try {
        const result = await CompanyService.getCompanyJoinRequests(companyId);
        if (result.error) {
          toast.error(result.error);
          setRequests([]);
        } else {
          setRequests(result.requests);
        }
      } catch (error) {
        toast.error('Failed to fetch join requests');
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinRequests();
  }, [companyId]);

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      const { success, error } = await CompanyService.approveJoinRequest(requestId, user.id)
      
      if (success) {
        toast.success('Join request approved successfully!')
        // Remove the approved request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
      } else {
        toast.error(error || 'Failed to approve join request')
      }
    } catch (error) {
      toast.error('An error occurred while approving the request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequest(requestId)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      const { success, error } = await CompanyService.rejectJoinRequest(requestId, user.id)
      
      if (success) {
        toast.success('Join request rejected')
        // Remove the rejected request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
      } else {
        toast.error(error || 'Failed to reject join request')
      }
    } catch (error) {
      toast.error('An error occurred while rejecting the request')
    } finally {
      setProcessingRequest(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserDisplayName = (userProfile: JoinRequestWithUser['user_profile']) => {
    if (userProfile.first_name || userProfile.last_name) {
      return `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
    }
    return userProfile.email || 'N/A' // Handle case where email might be missing
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>Pending requests to join your company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading requests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Join Requests</CardTitle>
          <CardDescription>Pending requests to join your company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No pending join requests</p>
            <p className="text-sm text-muted-foreground mt-1">
              When someone requests to join your company, they&apos;ll appear here
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Requests ({requests.length})</CardTitle>
        <CardDescription>Pending requests to join your company</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requests.map((request) => {
            return (
              <div
                key={request.id}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-4">
                  {/* User info section */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-full flex-shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-medium text-sm">
                          {getUserDisplayName(request.user_profile)}
                        </h4>
                        <span className="text-xs text-muted-foreground break-all">
                          {request.user_profile.email}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>Requested {formatDate(request.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApproveRequest(request.id)}
                      disabled={processingRequest === request.id}
                      className="text-green-600 border-green-200 hover:bg-green-50 min-w-[80px]"
                    >
                      {processingRequest === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={processingRequest === request.id}
                      className="text-red-600 border-red-200 hover:bg-red-50 min-w-[80px]"
                    >
                      {processingRequest === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
