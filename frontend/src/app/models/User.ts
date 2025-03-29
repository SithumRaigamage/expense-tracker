export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  name?: string;
  role?: string;
  profileImage?: string;
  location: string;
  preferredCurrency: string;
}
