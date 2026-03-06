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

function AppContent() {
    const navigate = useNavigate();

    return (
        <Layout currentPath={window.location.pathname} onNavigate={(path) => navigate(path)}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/radar" element={<Radar />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/tourism" element={<Tourism />} />
                <Route path="/agenda" element={<Agenda />} />
                <Route path="/clinica" element={<ClinicDirectory />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/finanzas" element={<Finances />} />
                <Route path="/reportes" element={<Reports />} />
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

