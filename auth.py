from flask import Blueprint, request, jsonify
from models import db, User, UserLike
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """사용자 등록"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"msg": "사용자 이름과 비밀번호를 모두 입력해야 합니다."}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"msg": "이미 존재하는 사용자 이름입니다."}), 409

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"msg": "회원가입이 완료되었습니다."}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """사용자 로그인"""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token)

    return jsonify({"msg": "사용자 이름 또는 비밀번호가 잘못되었습니다."}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    """현재 로그인된 사용자 정보 반환"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if user:
        return jsonify({"id": user.id, "username": user.username, "is_admin": user.is_admin})
    return jsonify({"msg": "사용자를 찾을 수 없습니다."}), 404
