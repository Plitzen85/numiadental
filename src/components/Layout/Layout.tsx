import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
    children: ReactNode;
    currentPath: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPath, onNavigate, onLogout }) => {
    return (
        <div className="flex bg-cobalt min-h-screen relative overflow-hidden print:bg-white print:overflow-visible">
            {/* Background glowing effects */}
            <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-electric/10 rounded-full blur-[150px] pointer-events-none print:hidden"></div>
            <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-premium/5 rounded-full blur-[150px] pointer-events-none print:hidden"></div>

            <div className="print:hidden">
                <Sidebar currentPath={currentPath} onNavigate={onNavigate} onLogout={onLogout} />
            </div>

            <div className="flex-1 ml-64 flex flex-col min-h-screen print:ml-0">
                <div className="print:hidden">
                    <Header />
                </div>
                <main className="flex-1 p-8 overflow-y-auto print:p-0 print:overflow-visible">
                    {children}
                </main>
            </div>
        </div>
    );
};
