import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import SplashScreen from './pages/SplashScreen';
import WelcomeScreen from './pages/WelcomeScreen';
import VaultSelector from './pages/VaultSelector';
import Dashboard from './pages/Dashboard';
import Generator from './pages/Generator';
import AddEntry from './pages/AddEntry';
import Settings from './pages/Settings';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand selection:text-brand-foreground overflow-hidden">
      <Toaster theme="dark" position="bottom-right" richColors />
      <Routes>
        <Route path="/" element={<Navigate to="/splash" replace />} />
        <Route path="/splash" element={<SplashScreen />} />
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/vaults" element={<VaultSelector />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/generate" element={<Generator />} />
        <Route path="/add-entry" element={<AddEntry />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;
