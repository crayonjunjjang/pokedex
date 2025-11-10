from functools import wraps
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, UserLike, Pokemon

admin_bp = Blueprint('admin', __name__)

def admin_required():
    """관리자만 접근을 허용하는 데코레이터"""
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if user and user.is_admin:
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="관리자 권한이 필요합니다."), 403
        return decorator
    return wrapper

# --- User Management ---
@admin_bp.route('/users', methods=['GET'])
@admin_required()
def get_users():
    """모든 사용자 목록을 반환합니다."""
    users = User.query.all()
    return jsonify([{'id': u.id, 'username': u.username, 'is_admin': u.is_admin} for u in users])

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@admin_required()
def get_user_details(user_id):
    """특정 사용자의 상세 정보 (좋아요 목록 포함)를 반환합니다."""
    user = User.query.get(user_id)
    if not user:
        return jsonify(msg="사용자를 찾을 수 없습니다."), 404
    
    liked_pokemon_ids = [like.pokemon_id for like in user.likes]
    liked_pokemon = Pokemon.query.filter(Pokemon.pokemon_id.in_(liked_pokemon_ids)).all()

    return jsonify({
        'id': user.id,
        'username': user.username,
        'is_admin': user.is_admin,
        'likes': [p.to_dict() for p in liked_pokemon]
    })

# --- Pokemon Management ---
@admin_bp.route('/pokemon', methods=['GET'])
@admin_required()
def get_all_pokemon():
    """페이지네이션 및 검색 기능이 포함된 모든 포켓몬 목록을 반환합니다."""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '', type=str)

    query = Pokemon.query
    if search:
        query = query.filter(Pokemon.name_ko.like(f"%{search}%"))
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'pokemon': [p.to_dict() for p in pagination.items],
        'total_items': pagination.total,
        'page': pagination.page,
        'per_page': pagination.per_page,
        'total_pages': pagination.pages
    })

@admin_bp.route('/pokemon/<int:id>', methods=['PUT'])
@admin_required()
def update_pokemon(id):
    """특정 포켓몬의 정보를 업데이트합니다."""
    pokemon = Pokemon.query.get(id)
    if not pokemon:
        return jsonify(msg="포켓몬을 찾을 수 없습니다."), 404
        
    data = request.json
    for key, value in data.items():
        if hasattr(pokemon, key):
            setattr(pokemon, key, value)
            
    db.session.commit()
    return jsonify(pokemon.to_dict())

@admin_bp.route('/pokemon/<int:id>', methods=['DELETE'])
@admin_required()
def delete_pokemon(id):
    """특정 포켓몬을 삭제합니다."""
    pokemon = Pokemon.query.get(id)
    if not pokemon:
        return jsonify(msg="포켓몬을 찾을 수 없습니다."), 404
        
    db.session.delete(pokemon)
    db.session.commit()
    return jsonify(msg="포켓몬이 삭제되었습니다.")
