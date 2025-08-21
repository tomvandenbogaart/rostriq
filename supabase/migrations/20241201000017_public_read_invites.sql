-- Allow anonymous users to read pending invitations by token and company details
-- NOTE: Ensure your application always filters by invitation_token to avoid overexposure

begin;

-- Enable RLS on company_invitations if not already
alter table if exists public.company_invitations enable row level security;

-- Policy: allow anon and authenticated to select pending, non-expired invites
drop policy if exists "Public read pending invites" on public.company_invitations;
create policy "Public read pending invites"
on public.company_invitations
for select
to anon, authenticated
using (
  status = 'pending'
  and expires_at > now()
);

-- Company table read (names/logos) for join page context
alter table if exists public.companies enable row level security;
drop policy if exists "Public read active companies" on public.companies;
create policy "Public read active companies"
on public.companies
for select
to anon, authenticated
using (is_active = true);

commit;


