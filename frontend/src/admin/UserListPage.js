import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

function UserListPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/admin/users');
                setUsers(response.data);
            } catch (err) {
                setError('사용자 목록을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h3>사용자 관리</h3>
            <table className="table table-striped mt-4">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>사용자 이름</th>
                        <th>관리자 여부</th>
                        <th>상세 보기</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.username}</td>
                            <td>{user.is_admin ? 'Yes' : 'No'}</td>
                            <td>
                                <Link to={`/admin/users/${user.id}`} className="btn btn-sm btn-info">
                                    상세
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserListPage;
