import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../auth/AuthContext';
import Party from '../components/Party';

function ProfilePage({ party, removeFromParty, likedPokemon }) {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <div className="container mt-5"><h2>사용자 정보를 불러오는 중...</h2></div>;
    }

    return (
        <div className="container mt-5">
            <h2>{user.username}님의 프로필</h2>
            <hr />

            <div className="mt-4">
                <h4>나의 파티</h4>
                <Party party={party} removeFromParty={removeFromParty} />
                {party.length === 0 && <p>현재 파티에 포켓몬이 없습니다.</p>}
            </div>

            <div className="mt-5">
                <h4>좋아요 목록</h4>
                {likedPokemon.length > 0 ? (
                     <div className="row">
                        {likedPokemon.map(p => (
                            <div key={p.pokemon_id} className="col-md-3 mb-4">
                                <Link to={`/pokemon/${p.pokemon_id}`} className="card h-100 text-decoration-none text-dark">
                                    <img src={p.image_url} className="card-img-top" alt={p.name_ko} />
                                    <div className="card-body">
                                        <h5 className="card-title">{p.name_ko}</h5>
                                        <p className="card-text">#{p.pokemon_id}</p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>좋아요를 누른 포켓몬이 없습니다.</p>
                )}
            </div>
        </div>
    );
}

export default ProfilePage;
