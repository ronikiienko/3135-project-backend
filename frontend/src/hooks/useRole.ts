import { Role } from '../api/auth';

export function useRole(): Role | null {
  return localStorage.getItem('role') as Role | null;
}
