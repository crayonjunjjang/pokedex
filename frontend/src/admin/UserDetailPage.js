import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function UserDetailPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { userId } = useParams();

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await api.get(`/admin/users/${userId}`);
                setUser(response.data);
            } catch (err) {
                setError('사용자 상세 정보를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchUserDetails();
    }, [userId]);

    if (loading) return <p>로딩 중...</p>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!user) return <p>사용자를 찾을 수 없습니다.</p>;

    return (
        <div>
            <h3>{user.username}님의 상세 정보</h3>
            <div className="card mt-4">
                <div className="card-body">
                    <h5 className="card-title">기본 정보</h5>
                    <p><strong>사용자 ID:</strong> {user.id}</p>
                    <p><strong>사용자 이름:</strong> {user.username}</p>
                    <p><strong>관리자:</strong> {user.is_admin ? 'Yes' : 'No'}</p>
                </div>
            </div>

            <div className="card mt-4">
                <div className="card-body">
                    <h5 className="card-title">좋아요 목록 ({user.likes.length}개)</h5>
                    {user.likes.length > 0 ? (
                        <div className="row">
                            {user.likes.map(p => (
                                <div key={p.pokemon_id} className="col-md-3 mb-4">
                                    <div className="card h-100">
                                        <img src={p.image_url} className="card-img-top" alt={p.name_ko} />
                                        <div className="card-body">
                                            <h6 className="card-title">{p.name_ko}</h6>
                                            <p className="card-text small">#{p.pokemon_id}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>좋아요를 누른 포켓몬이 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserDetailPage;
