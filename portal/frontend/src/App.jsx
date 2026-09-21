import { Toaster } from 'react-hot-toast';
import AuthProvider from './context/AuthContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

const App = () => (
  <AuthProvider>
    <AppRoutes />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: { background: '#14202e', color: '#fff', fontSize: '14px', borderRadius: '10px' },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
        error: { duration: 6000 },
      }}
    />
  </AuthProvider>
);

export default App;
