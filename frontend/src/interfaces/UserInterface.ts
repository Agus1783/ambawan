export interface User {
  id: string,
  name: string,
  email: string,
  role: string,
  division?: {
    id: string,
    name: string
  };
}
