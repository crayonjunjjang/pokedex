import React, { useState, useEffect } from 'react';
import api from '../api';
import PokemonEditModal from './PokemonEditModal';

function PokemonListPage() {
    const [pokemonList, setPokemonList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [editingPokemon, setEditingPokemon] = useState(null);

    useEffect(() => {
        const fetchPokemon = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/admin/pokemon?page=${page}&search=${search}`);
                setPokemonList(response.data.pokemon);
                setTotalPages(response.data.total_pages);
            } catch (err) {
                setError('포켓몬 목록을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };
        fetchPokemon();
    }, [page, search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
    };
    
    const handleDelete = async (id) => {
        if (window.confirm('정말로 이 포켓몬을 삭제하시겠습니까?')) {
            try {
                await api.delete(`/admin/pokemon/${id}`);
                setPokemonList(pokemonList.filter(p => p.id !== id));
            } catch (err) {
                alert('포켓몬 삭제에 실패했습니다.');
            }
        }
    };

    const handleEditClick = (pokemon) => {
        setEditingPokemon(pokemon);
    };

    const handleCloseModal = () => {
        setEditingPokemon(null);
    };

    const handleSave = async (updatedPokemon) => {
        try {
            const response = await api.put(`/admin/pokemon/${updatedPokemon.id}`, updatedPokemon);
            setPokemonList(pokemonList.map(p => p.id === updatedPokemon.id ? response.data : p));
            handleCloseModal();
        } catch (err) {
            alert('포켓몬 정보 저장에 실패했습니다.');
        }
    };

    return (
        <div>
            <h3>포켓몬 관리</h3>
            <form onSubmit={handleSearch} className="mb-3">
                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="포켓몬 이름으로 검색..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn btn-primary" type="submit">검색</button>
                </div>
            </form>

            {loading && <p>로딩 중...</p>}
            {error && <div className="alert alert-danger">{error}</div>}

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>이름</th>
                        <th>타입</th>
                        <th>역할</th>
                        <th>관리</th>
                    </tr>
                </thead>
                <tbody>
                    {pokemonList.map(p => (
                        <tr key={p.id}>
                            <td>{p.pokemon_id}</td>
                            <td>{p.name_ko}</td>
                            <td>{p.type}</td>
                            <td>{p.role}</td>
                            <td>
                                <button className="btn btn-sm btn-primary me-2" onClick={() => handleEditClick(p)}>수정</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>삭제</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <nav>
                <ul className="pagination">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p => p - 1)}>이전</button>
                    </li>
                    <li className="page-item active">
                        <span className="page-link">{page} / {totalPages}</span>
                    </li>
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setPage(p => p + 1)}>다음</button>
                    </li>
                </ul>
            </nav>

            {editingPokemon && (
                <PokemonEditModal
                    pokemon={editingPokemon}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
}

export default PokemonListPage;
