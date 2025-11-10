import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import AuthContext from './AuthContext';

const AdminRoute = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div>로딩 중...</div>;
    }

    return user && user.is_admin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;
