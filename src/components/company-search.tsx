'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CompanyService } from '@/lib/company-service'
import { Company } from '@/types/database'
import { Search, Building2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

// Helper function to generate secure tokens (same as CompanyInvitationsService)
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

interface CompanySearchProps {
  onCompanySelected: (company: Company) => void
  onBack: () => void
}

export function CompanySearch({ onCompanySelected, onBack }: CompanySearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchCompanies = useCallback(async () => {
    if (searchTerm.trim().length < 2) return

    setIsSearching(true)
    try {
      const { companies: searchResults, error } = await CompanyService.searchCompanies(searchTerm.trim())
      
      if (error) {
        toast.error(error)
        setCompanies([])
      } else {
        setCompanies(searchResults)
      }
    } catch {
      toast.error('Failed to search companies')
      setCompanies([])
    } finally {
      setIsSearching(false)
    }
  }, [searchTerm])

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        void searchCompanies()
      }, 300)
    } else {
      setCompanies([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, searchCompanies])

  const handleJoinCompany = async (company: Company) => {
    setIsJoining(true)
    setSelectedCompanyId(company.id)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User not authenticated")
        return
      }

      // Create company invitation instead of join request
      const { error } = await supabase
        .from('company_invitations')
        .insert({
          company_id: company.id,
          invited_email: user.email,
          invited_by: user.id,
          invitation_token: generateSecureToken(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          status: 'pending',
          role: 'member'
        })
        .select()
        .single()
      
      if (error) {
        toast.error('Failed to send invitation request')
      } else {
        toast.success(`Invitation request sent to ${company.name}! They will review your request.`)
        onCompanySelected(company)
      }
    } catch {
      toast.error('An error occurred while joining the company')
    } finally {
      setIsJoining(false)
      setSelectedCompanyId(null)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Find Your Company</CardTitle>
        <CardDescription>
          Search for your company to join as a team member
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for your company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isSearching && companies.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm">{company.name}</h4>
                    {company.industry && (
                      <p className="text-xs text-muted-foreground">{company.industry}</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleJoinCompany(company)}
                  disabled={isJoining && selectedCompanyId === company.id}
                  className="ml-2"
                >
                  {isJoining && selectedCompanyId === company.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Request'
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}

        {!isSearching && searchTerm.trim().length >= 2 && companies.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No companies found matching &quot;{searchTerm}&quot;
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different search term or contact your company administrator
            </p>
          </div>
        )}

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full"
        >
          Back to Role Selection
        </Button>
      </CardContent>
    </Card>
  )
}
