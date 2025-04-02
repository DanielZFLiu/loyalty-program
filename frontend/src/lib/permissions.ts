export type Roles = 'REGULAR' | 'CASHIER' | 'MANAGER' | 'SUPERUSER';

export const LEVELS: Record<Roles, number> = {
  'REGULAR': 1,
  'CASHIER': 2,
  'MANAGER': 3,
  'SUPERUSER': 4,
} as const;

export const checkClearance = (role: Roles, clearance: Roles) => {
  if (!role || !clearance || !LEVELS[role] || !LEVELS[clearance]) {
    return false;
  }
  return LEVELS[role] >= LEVELS[clearance];
};

export const getHomeByRole = (role: Roles) => {
  switch (role) {
    case 'REGULAR':
      return '/dashboard';
    case 'CASHIER':
      return '/cashier';
    case 'MANAGER':
      return '/manager';
    case 'SUPERUSER':
      return '/superuser';
    default:
      return '/';
  }
};
