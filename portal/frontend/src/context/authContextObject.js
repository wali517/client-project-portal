import { createContext } from 'react';

// Kept in its own file (no components) so Vite hot reload can never create a second copy of the context.
export const AuthContext = createContext(null);
export default AuthContext;
