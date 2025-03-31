/**
 * Utility functions involving api calls
 */

import { getMe } from "@/lib/api/userMe";

const roleHierarchy = {
  regular: 1,
  cashier: 2,
  manager: 3,
  superuser: 4,
};

/**
 * checks whether current user's role against minRole
 * should be secure, since theres role checks in the backend too
 * @param minRole
 * @returns whether the role requirement passes
 */
export async function checkRole(minRole: string): Promise<boolean> {
  // check if minRole is part of the roleHierarchy
  if (!(minRole.toLocaleLowerCase() in roleHierarchy)) {
    return false;
  }

  // get user data
  let data;
  try {
    data = await getMe();
  } catch (error) {
    if (error instanceof Error) console.error(error.message);
    else console.error("An unknown error occurred");
    return false;
  }

  const userRole = data.role.toLocaleLowerCase() as keyof typeof roleHierarchy; // guaranteed to be true due to how the backend works
  const minRoleKey = minRole.toLocaleLowerCase() as keyof typeof roleHierarchy; // if statement ensured this to be ok

  if (roleHierarchy[userRole] < roleHierarchy[minRoleKey]) return false;
  else return true;
}
