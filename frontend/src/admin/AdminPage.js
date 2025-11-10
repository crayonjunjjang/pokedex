import React from 'react';
import { Link, Outlet } from 'react-router-dom';

function AdminDashboard() {
    return (
        <div className="container mt-5">
            <div className="row">
                <div className="col-lg-3">
                    <h2 className="mb-4">관리자 메뉴</h2>
                    <div className="list-group">
                        <Link to="/admin/users" className="list-group-item list-group-item-action">
                            사용자 관리
                        </Link>
                        <Link to="/admin/pokemon" className="list-group-item list-group-item-action">
                            포켓몬 관리
                        </Link>
                    </div>
                </div>
                <div className="col-lg-9">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

function AdminPage() {
    return (
        <div>
            <h1 className="text-center my-4">관리자 대시보드</h1>
            <AdminDashboard />
        </div>
    );
}


export default AdminPage;
