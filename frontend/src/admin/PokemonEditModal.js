import React, { useState, useEffect } from 'react';

function PokemonEditModal({ pokemon, onSave, onClose }) {
    const [formData, setFormData] = useState({});

    useEffect(() => {
        // When the pokemon prop changes, update the form data
        if (pokemon) {
            setFormData(pokemon);
        }
    }, [pokemon]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!pokemon) {
        return null;
    }

    return (
        <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">포켓몬 수정: {pokemon.name_ko}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">이름</label>
                                <input type="text" name="name_ko" value={formData.name_ko || ''} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">타입 (쉼표로 구분)</label>
                                <input type="text" name="type" value={formData.type || ''} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">역할 (쉼표로 구분)</label>
                                <input type="text" name="role" value={formData.role || ''} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">특징 (쉼표로 구분)</label>
                                <input type="text" name="feature" value={formData.feature || ''} onChange={handleChange} className="form-control" />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">외형 (쉼표로 구분)</label>
                                <input type="text" name="appearance" value={formData.appearance || ''} onChange={handleChange} className="form-control" />
                            </div>
                            {/* Add other fields as needed */}
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>닫기</button>
                                <button type="submit" className="btn btn-primary">저장</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PokemonEditModal;
