'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations, getMembers } from '@/lib/api/organizations';
import { useOrgStore, type Organization } from '@/lib/store/org-store';
import { useAuth } from './use-auth';

/**
 * Initializes org context after authentication.
 * Fetches user's organizations and sets the default org.
 * Call this once in the dashboard layout.
 */
export function useOrgInit() {
  const { user, isAuthenticated } = useAuth();
  const { setOrgs, currentOrgId, switchOrg, setCurrentRole } = useOrgStore();

  // Fetch organizations when authenticated
  const { data: orgs, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
    staleTime: 5 * 60_000,
    enabled: isAuthenticated,
  });

  // Set orgs in store when fetched
  useEffect(() => {
    if (orgs && orgs.length > 0) {
      setOrgs(orgs as Organization[]);
    }
  }, [orgs, setOrgs]);

  // Fetch current role when org is selected
  const { data: members } = useQuery({
    queryKey: ['org-members', currentOrgId],
    queryFn: () => getMembers(currentOrgId!),
    staleTime: 5 * 60_000,
    enabled: !!currentOrgId && isAuthenticated,
  });

  // Set current role from membership
  useEffect(() => {
    if (!members || !user) return;

    const myMembership = members.find(
      (m) => m.userId === (user as { id: string }).id,
    );

    if (myMembership) {
      setCurrentRole(myMembership.role);
    }
  }, [members, user, setCurrentRole]);

  return {
    isLoadingOrgs,
    orgs: orgs ?? [],
    currentOrgId,
    switchOrg,
  };
}
