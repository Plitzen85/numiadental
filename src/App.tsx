import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MarketProvider } from './context/MarketContext';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Radar } from './pages/Radar';
import { Campaigns } from './pages/Campaigns';
import { Tourism } from './pages/Tourism';
import { Settings } from './pages/Settings';
import { Finances } from './pages/Finances';
import { Reports } from './pages/Reports';
import { Agenda } from './pages/Agenda';
import { ClinicDirectory } from './pages/ClinicDirectory';
import { Inventory } from './pages/Inventory';
import { Unauthorized } from './pages/Unauthorized';
import { PermissionGuard } from './components/shared/PermissionGuard';

function AppContent() {
    const navigate = useNavigate();

    return (
        <Layout currentPath={window.location.pathname} onNavigate={(path) => navigate(path)}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/radar" element={
                    <PermissionGuard module="radar"><Radar /></PermissionGuard>
                } />
                <Route path="/campaigns" element={
                    <PermissionGuard module="campanas"><Campaigns /></PermissionGuard>
                } />
                <Route path="/tourism" element={
                    <PermissionGuard module="turismo"><Tourism /></PermissionGuard>
                } />
                <Route path="/agenda" element={
                    <PermissionGuard module="agenda"><Agenda /></PermissionGuard>
                } />
                <Route path="/clinica" element={
                    <PermissionGuard module="clinica"><ClinicDirectory /></PermissionGuard>
                } />
                <Route path="/inventory" element={
                    <PermissionGuard module="inventario"><Inventory /></PermissionGuard>
                } />
                <Route path="/settings" element={
                    <PermissionGuard module="settings"><Settings /></PermissionGuard>
                } />
                <Route path="/finanzas" element={
                    <PermissionGuard module="finanzas"><Finances /></PermissionGuard>
                } />
                <Route path="/reportes" element={
                    <PermissionGuard module="reportes"><Reports /></PermissionGuard>
                } />
                <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <MarketProvider>
            <Router>
                <AppContent />
            </Router>
        </MarketProvider>
    );
}

export default App;
