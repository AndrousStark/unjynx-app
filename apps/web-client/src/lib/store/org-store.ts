import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────

export interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly logoUrl: string | null;
  readonly plan: 'free' | 'pro' | 'team' | 'enterprise';
  readonly industryMode: string | null;
  readonly isPersonal: boolean;
  readonly isActive: boolean;
  readonly maxMembers: number;
  readonly maxProjects: number;
}

export interface OrgMembership {
  readonly orgId: string;
  readonly role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'guest';
}

interface OrgState {
  /** Currently selected organization ID. Null = personal workspace. */
  readonly currentOrgId: string | null;
  /** All organizations the user belongs to. */
  readonly userOrgs: readonly Organization[];
  /** User's role in the current org. */
  readonly currentRole: OrgMembership['role'] | null;
}

interface OrgActions {
  readonly setOrgs: (orgs: readonly Organization[]) => void;
  readonly switchOrg: (orgId: string | null) => void;
  readonly setCurrentRole: (role: OrgMembership['role'] | null) => void;
  readonly addOrg: (org: Organization) => void;
  readonly removeOrg: (orgId: string) => void;
  readonly updateOrg: (orgId: string, updates: Partial<Organization>) => void;
  readonly clear: () => void;
}

// ─── Store ───────────────────────────────────────────────────────

export const useOrgStore = create<OrgState & OrgActions>()(
  persist(
    (set, get) => ({
      currentOrgId: null,
      userOrgs: [],
      currentRole: null,

      setOrgs: (orgs) => {
        const current = get().currentOrgId;
        // If current org is not in the list, switch to first org or null
        const validOrg = current && orgs.some((o) => o.id === current);
        set({
          userOrgs: orgs,
          currentOrgId: validOrg ? current : orgs[0]?.id ?? null,
        });
      },

      switchOrg: (orgId) => {
        set({ currentOrgId: orgId, currentRole: null });
      },

      setCurrentRole: (role) => {
        set({ currentRole: role });
      },

      addOrg: (org) => {
        set((state) => ({ userOrgs: [...state.userOrgs, org] }));
      },

      removeOrg: (orgId) => {
        set((state) => {
          const filtered = state.userOrgs.filter((o) => o.id !== orgId);
          return {
            userOrgs: filtered,
            currentOrgId: state.currentOrgId === orgId
              ? filtered[0]?.id ?? null
              : state.currentOrgId,
          };
        });
      },

      updateOrg: (orgId, updates) => {
        set((state) => ({
          userOrgs: state.userOrgs.map((o) =>
            o.id === orgId ? { ...o, ...updates } : o,
          ),
        }));
      },

      clear: () => {
        set({ currentOrgId: null, userOrgs: [], currentRole: null });
      },
    }),
    {
      name: 'unjynx-org',
      partialize: (state) => ({
        currentOrgId: state.currentOrgId,
      }),
    },
  ),
);

// ─── Selectors ───────────────────────────────────────────────────

/** Get the current organization object. */
export function useCurrentOrg(): Organization | null {
  return useOrgStore((s) => {
    if (!s.currentOrgId) return null;
    return s.userOrgs.find((o) => o.id === s.currentOrgId) ?? null;
  });
}

/** Check if user has at least the specified role in current org. */
export function useHasOrgRole(minimumRole: OrgMembership['role']): boolean {
  const ROLE_HIERARCHY: Record<string, number> = {
    owner: 60, admin: 50, manager: 40, member: 30, viewer: 20, guest: 10,
  };
  return useOrgStore((s) => {
    if (!s.currentRole) return false;
    return (ROLE_HIERARCHY[s.currentRole] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
  });
}
