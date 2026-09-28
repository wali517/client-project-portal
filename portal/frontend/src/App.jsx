import { Toaster } from 'react-hot-toast';
import AuthProvider from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

const App = () => (
  <AuthProvider>
    <NotificationProvider>
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
    </NotificationProvider>
  </AuthProvider>
);

export default App;

