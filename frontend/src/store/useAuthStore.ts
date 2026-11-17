import { create } from "zustand";
import type { User, UserRole } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  logout: () => void;
  switchDemoRole: (role: UserRole) => void;
}

const DEFAULT_DEMO_USER: User = {
  id: "64f100000000000000000001",
  name: "Nodal Officer (PWD)",
  email: "officer.pwd@cityos.local",
  role: "OFFICER",
  department: "PWD",
};

export const useAuthStore = create<AuthState>((set) => ({
  user: DEFAULT_DEMO_USER,
  token: "demo-jwt-token",
  isAuthenticated: true,

  setUser: (user, token) =>
    set({
      user,
      token,
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    }),

  switchDemoRole: (role: UserRole) => {
    const roleProfiles: Record<UserRole, Partial<User>> = {
      CITIZEN: { name: "Aarav Sharma", email: "citizen@cityos.local" },
      OFFICER: { name: "PWD Nodal Officer", email: "officer.pwd@cityos.local" },
      FIELD_WORKER: { name: "Ramesh Kumar (Tech)", email: "worker.pwd@cityos.local" },
      DEPARTMENT_ADMIN: { name: "Head of Sanitation", email: "dept.head@cityos.local" },
      CITY_ADMIN: { name: "Municipal Commissioner", email: "commissioner@cityos.local" },
      SUPER_ADMIN: { name: "System Administrator", email: "admin@cityos.local" },
    };

    const profile = roleProfiles[role];
    set({
      user: {
        id: `demo-${role.toLowerCase()}-id`,
        name: profile.name || role,
        email: profile.email || `${role.toLowerCase()}@cityos.local`,
        role,
      },
      isAuthenticated: true,
    });
  },
}));
