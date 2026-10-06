export interface User {
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  /** Authorization role ('user' | 'admin'). Read-only: the API never accepts it. */
  role?: string;
  /** Free-text job title the user chooses to show on their profile. */
  occupation?: string;
  location?: string;
  profileImage?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  currency?: string;
}
