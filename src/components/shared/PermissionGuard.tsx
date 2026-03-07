import React from 'react';
import { Navigate } from 'react-router-dom';
import { useMarket } from '../../context/MarketContext';
import { ModulePermissions } from '../../context/MarketContext';

interface PermissionGuardProps {
    module: keyof ModulePermissions;
    children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ module, children }) => {
    const { hasPermission } = useMarket();

    if (!hasPermission(module)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};
