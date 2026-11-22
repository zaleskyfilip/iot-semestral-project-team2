import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Dashboard } from './routes/Dashboard';
import { History } from './routes/History';
import { Settings } from './routes/Settings';
import { Stations } from './routes/Stations';

export default function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/stations" replace />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/dashboard/:stationId" element={<Dashboard />} />
            <Route path="/dashboard/:stationId/history" element={<History />} />
            <Route path="/dashboard/:stationId/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/stations" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}