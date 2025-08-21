'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyInvitationsService } from '@/lib/company-invitations-service';
import { supabase } from '@/lib/supabase';
import { CompanyInvitation, Company } from '@/types/database';

export default function TestInvitationsPage() {
  const [invitationId, setInvitationId] = useState('');
  const [userId, setUserId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [pendingInvitations, setPendingInvitations] = useState<CompanyInvitation[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfileId, setUserProfileId] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('test@example.com');

  const invitationsService = new CompanyInvitationsService();

  useEffect(() => {
    checkAuthStatus();
    loadPendingInvitations();
    loadCompanies();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      setUserId(user.id);
      
      // Get user profile ID
      try {
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
          
        if (error) throw error;
        if (userProfile) {
          setUserProfileId(userProfile.id);
        }
      } catch (error) {
        console.error('Failed to get user profile:', error);
      }
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('company_invitations')
        .select(`
          *,
          companies (
            id,
            name,
            description
          )
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
      if (data && data.length > 0) {
        setSelectedCompanyId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const handleSimulateAcceptance = async () => {
    if (!invitationId || !userProfileId) {
      setResult('Please provide invitation ID and ensure user profile is loaded');
      return;
    }
    
    setIsProcessing(true);
    setResult('');
    
    try {
      // Accept invitation
      const { data: invitation, error: acceptError } = await invitationsService.acceptInvitation(
        invitationId,
        userProfileId
      );
      
      if (acceptError) throw acceptError;
      
      // Ensure user profile exists and has basic information
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userProfileId)
        .single();
      
      if (profileError) {
        // Create a basic user profile if it doesn't exist
        const { error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: userProfileId,
            user_id: currentUser.id,
            email: currentUser.email || 'test@example.com',
            role: 'user',
            first_name: 'Test',
            last_name: 'User',
            company_name: '',
            phone: '',
            avatar_url: '',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          
        if (createProfileError) throw createProfileError;
      }
      
      // Check if user is already a member of this company
      const { data: existingMember, error: checkError } = await supabase
        .from('company_members')
        .select('id, role, is_active')
        .eq('company_id', invitation.company_id)
        .eq('user_id', userProfileId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }
      
      if (existingMember) {
        // User is already a member, update their role and status if needed
        const { error: updateError } = await supabase
          .from('company_members')
          .update({
            role: invitation.role,
            is_active: true,
            joined_at: new Date().toISOString(),
          })
          .eq('id', existingMember.id);
          
        if (updateError) throw updateError;
        
        setResult('Success! Invitation accepted and existing membership updated. The team page should now show the updated member. You may need to refresh the team page to see the changes.');
      } else {
        // Add new company member
        const { error: memberError } = await supabase
          .from('company_members')
          .insert({
            company_id: invitation.company_id,
            user_id: userProfileId,
            role: invitation.role,
            joined_at: new Date().toISOString(),
            is_active: true,
          });
          
        if (memberError) throw memberError;
        
        setResult('Success! Invitation accepted and user added to company. The team page should now show the new member. You may need to refresh the team page to see the changes.');
      }
      
      // Refresh the pending invitations list
      await loadPendingInvitations();
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTestInvitation = async () => {
    if (!selectedCompanyId || !userProfileId) {
      setResult('Please select a company and ensure user profile is loaded');
      return;
    }

    setIsProcessing(true);
    setResult('');

    try {
      const { data, error } = await invitationsService.createInvitation(
        selectedCompanyId,
        inviteEmail,
        'member',
        'This is a test invitation',
        30,
        companies.find(c => c.id === selectedCompanyId)?.name || 'Test Company',
        'Test User'
      );

      if (error) throw error;

      setResult(`Test invitation created successfully! ID: ${data.id}, Token: ${data.invitation_token}`);
      
      // Refresh the pending invitations list
      await loadPendingInvitations();
    } catch (error: any) {
      setResult(`Error creating test invitation: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshData = async () => {
    await Promise.all([
      loadPendingInvitations(),
      loadCompanies()
    ]);
  };

  const handleClearTestData = async () => {
    if (!confirm('Are you sure you want to clear all test data? This will delete test invitations and test memberships.')) {
      return;
    }

    setIsProcessing(true);
    setResult('');

    try {
      // Clear test invitations (sent to test@example.com or custom test emails)
      const { error: invitationError } = await supabase
        .from('company_invitations')
        .delete()
        .in('invited_email', ['test@example.com', inviteEmail]);

      if (invitationError) throw invitationError;

      // Clear test company members (you can customize this based on your test data)
      // For now, we'll clear members with test-related roles or from specific test companies
      const { error: memberError } = await supabase
        .from('company_members')
        .delete()
        .in('role', ['test', 'test_member']);

      if (memberError) throw memberError;

      // Clear any test companies (optional - be careful with this)
      // const { error: companyError } = await supabase
      //   .from('companies')
      //   .delete()
      //   .like('name', '%Test%');

      setResult('Test data cleared successfully!');
      
      // Refresh the data
      await handleRefreshData();
    } catch (error: any) {
      setResult(`Error clearing test data: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Invitation Testing Dashboard</h1>
        <p className="text-muted-foreground">
          Test and simulate invitation acceptance scenarios
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div className="space-y-2">
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>User ID:</strong> {currentUser.id}</p>
              <p><strong>User Profile ID:</strong> {userProfileId || 'Loading...'}</p>
              <p><strong>Created:</strong> {new Date(currentUser.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-red-600">Not authenticated</p>
          )}
        </CardContent>
      </Card>

      {/* Simulate Invitation Acceptance */}
      <Card>
        <CardHeader>
          <CardTitle>Simulate Invitation Acceptance</CardTitle>
          <CardDescription>
            Manually accept an invitation by providing the invitation ID and user ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invitationId">Invitation ID</Label>
              <Input
                id="invitationId"
                value={invitationId}
                onChange={(e) => setInvitationId(e.target.value)}
                placeholder="Enter invitation ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter user ID"
              />
            </div>
          </div>
          
          <Button 
            onClick={handleSimulateAcceptance}
            disabled={isProcessing || !invitationId || !userProfileId}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Simulate Acceptance'}
          </Button>
          
          {result && (
            <div className={`p-3 rounded ${
              result.startsWith('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Test Invitation */}
      <Card>
        <CardHeader>
          <CardTitle>Create Test Invitation</CardTitle>
          <CardDescription>
            Create a test invitation for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companySelect">Select Company</Label>
            <select
              id="companySelect"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">Email to Invite</Label>
            <Input
              id="inviteEmail"
              type="email"
              placeholder="Enter email address to invite"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              This email will receive the invitation and can be used to test the join flow
            </p>
          </div>
          
          <Button 
            onClick={handleCreateTestInvitation}
            disabled={isProcessing || !selectedCompanyId || !userProfileId || !inviteEmail.trim()}
            className="w-full"
          >
            {isProcessing ? 'Creating...' : 'Create Test Invitation'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Currently pending invitations that can be tested
              </CardDescription>
            </div>
            <Button onClick={handleRefreshData} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <p className="text-muted-foreground">No pending invitations found</p>
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map(invitation => (
                <div key={invitation.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{invitation.role}</Badge>
                      <Badge variant="secondary">
                        Expires {new Date(invitation.expires_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ID: {invitation.id}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p><strong>Email:</strong> {invitation.invited_email}</p>
                    <p><strong>Company:</strong> {(invitation.companies as Company)?.name}</p>
                    <p><strong>Token:</strong> <code className="text-xs bg-gray-800 text-white p-2 rounded font-mono break-all">{invitation.invitation_token}</code></p>
                    {invitation.message && (
                      <p><strong>Message:</strong> "{invitation.message}"</p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setInvitationId(invitation.id)}
                    >
                      Use This ID
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const url = `/join?token=${invitation.invitation_token}`;
                        window.open(url, '_blank');
                      }}
                    >
                      Test Join URL
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const { data, error } = await invitationsService.getInvitationByToken(invitation.invitation_token);
                          if (error) {
                            setResult(`Token validation error: ${error.message}`);
                          } else if (data) {
                            setResult(`Token is valid! Status: ${data.status}, Expires: ${data.expires_at}, Company: ${(data.companies as Company)?.name}`);
                          } else {
                            setResult('Token validation returned no data');
                          }
                        } catch (err: any) {
                          setResult(`Token validation failed: ${err.message}`);
                        }
                      }}
                    >
                      Validate Token
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleRefreshData}
            variant="outline"
            className="w-full"
          >
            Refresh All Data
          </Button>
          
          <Button
            onClick={handleClearTestData}
            variant="destructive"
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Clearing...' : 'Clear Test Data'}
          </Button>
          
          <Button
            onClick={() => {
              // Dispatch a custom event that the team page can listen to
              window.dispatchEvent(new CustomEvent('refreshTeamData'));
              setResult('Team page refresh event dispatched. Check the team page to see updated data.');
            }}
            variant="outline"
            className="w-full"
          >
            Refresh Team Page Data
          </Button>
          
          <Button
            onClick={() => {
              const url = `/join?token=test-token`;
              window.open(url, '_blank');
            }}
            variant="outline"
            className="w-full"
          >
            Test Join Page (Invalid Token - Should Show Error)
          </Button>
          
          <Button
            onClick={() => {
              if (inviteEmail.trim()) {
                const url = `/signup?email=${encodeURIComponent(inviteEmail.trim())}`;
                window.open(url, '_blank');
              } else {
                setResult('Please set an email address first');
              }
            }}
            variant="outline"
            className="w-full"
          >
            Test Signup with Custom Email
          </Button>
          
          <Button
            onClick={() => {
              const url = `/dashboard`;
              window.open(url, '_blank');
            }}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
