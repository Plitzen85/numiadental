import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { RegistroPaciente } from './pages/RegistroPaciente';
import { MarketProvider, useMarket } from './context/MarketContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout/Layout';
import { Login } from './pages/Login';
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
import { CatalogProducts } from './pages/CatalogProducts';
import { Caja } from './pages/Caja';
import { Proveedores } from './pages/Proveedores';
import { Unauthorized } from './pages/Unauthorized';
import { PermissionGuard } from './components/shared/PermissionGuard';


function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout, currentUser } = useAuth();
    const { setCurrentUserId, isLoading } = useMarket();
    const isPublicRoute = location.pathname.startsWith('/registro/');

    // Keep RBAC in sync with logged-in user (hooks must be called unconditionally)
    useEffect(() => {
        if (currentUser) setCurrentUserId(currentUser.id);
    }, [currentUser, setCurrentUserId]);

    // Public routes — no auth required
    if (isPublicRoute) {
        return (
            <Routes>
                <Route path="/registro/:token" element={<RegistroPaciente />} />
            </Routes>
        );
    }

    const handleLogin = () => navigate('/', { replace: true });
    const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-cobalt flex flex-col items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-electric/10 border border-electric/20 flex items-center justify-center mb-4 mx-auto">
                        <div className="w-8 h-8 text-electric border-2 border-electric border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h2 className="text-white font-syne font-bold text-xl tracking-wider animate-pulse">NÜMIA</h2>
                    <p className="text-clinical/40 text-[10px] uppercase tracking-widest mt-2 px-4 whitespace-nowrap">Sincronizando con archivo maestro...</p>

                    {/* Security fallback */}
                    <div className="mt-8">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="text-electric/50 text-[9px] uppercase tracking-widest border border-electric/20 px-3 py-1 rounded-lg hover:bg-electric/5 transition-all"
                        >
                            ¿Demora mucho? Reintentar
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login onSuccess={handleLogin} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <Layout currentPath={window.location.pathname} onNavigate={(path) => navigate(path)} onLogout={handleLogout}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/radar" element={<PermissionGuard module="radar"><Radar /></PermissionGuard>} />
                <Route path="/campaigns" element={<PermissionGuard module="campanas"><Campaigns /></PermissionGuard>} />
                <Route path="/tourism" element={<PermissionGuard module="turismo"><Tourism /></PermissionGuard>} />
                <Route path="/agenda" element={<PermissionGuard module="agenda"><Agenda /></PermissionGuard>} />
                <Route path="/clinica" element={<PermissionGuard module="clinica"><ClinicDirectory /></PermissionGuard>} />
                <Route path="/inventory" element={<PermissionGuard module="inventario"><Inventory /></PermissionGuard>} />
                <Route path="/catalogo" element={<PermissionGuard module="catalogo"><CatalogProducts /></PermissionGuard>} />
                <Route path="/settings" element={<PermissionGuard module="settings"><Settings /></PermissionGuard>} />
                <Route path="/finanzas" element={<PermissionGuard module="finanzas"><Finances /></PermissionGuard>} />
                <Route path="/proveedores" element={<PermissionGuard module="proveedores"><Proveedores /></PermissionGuard>} />
                <Route path="/caja" element={<PermissionGuard module="finanzas"><Caja /></PermissionGuard>} />
                <Route path="/reportes" element={<PermissionGuard module="reportes"><Reports /></PermissionGuard>} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}

function App() {
    return (
        <MarketProvider>
            <AuthProvider>
                <Router>
                    <AppContent />
                </Router>
            </AuthProvider>
        </MarketProvider>
    );
}

export default App;
