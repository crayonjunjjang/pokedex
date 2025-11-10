from flask import Flask, request, jsonify, send_from_directory
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
import pandas as pd
import os
from models import db, bcrypt, User, UserLike, Pokemon
from auth import auth_bp
from admin import admin_bp
from sqlalchemy import func
import requests # requests 라이브러리 임포트

app = Flask(__name__, static_folder='frontend/build', static_url_path='')

# --- 설정 ---
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pokemon_app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-it'

COMPLETED_FILE = 'pokemon_completed.csv'
# --------------------

# --- 초기화 ---
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
# --------------------

# --- DB 명령어 ---
@app.cli.command("create-db")
def create_db():
    """데이터베이스 테이블을 생성합니다. (기존 테이블 삭제 후 재생성)"""
    with app.app_context():
        db.drop_all()
        db.create_all()
    print("Database tables dropped and recreated.")

@app.cli.command("create-admin")
def create_admin():
    """'admin' 사용자를 생성하거나 업데이트합니다."""
    with app.app_context():
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(username='admin', is_admin=True)
            admin_user.set_password('admin')
            db.session.add(admin_user)
            print("Admin user 'admin' created.")
        else:
            admin_user.is_admin = True
            admin_user.set_password('admin') # 비밀번호를 다시 설정할 수 있도록
            print("User 'admin' updated to be an admin.")
        db.session.commit()

@app.cli.command("import-pokemon")
def import_pokemon_data():
    """CSV 파일에서 포켓몬 데이터를 데이터베이스로 가져옵니다."""
    with app.app_context():
        df = pd.read_csv(COMPLETED_FILE, dtype=str).fillna('')
        df['pokemon_id'] = pd.to_numeric(df['pokemon_id'], errors='coerce')
        df.dropna(subset=['pokemon_id'], inplace=True)
        df['pokemon_id'] = df['pokemon_id'].astype(int)
        df['national_id'] = pd.to_numeric(df['national_id'], errors='coerce').fillna(0).astype(int)
        df['evolution_chain_id'] = pd.to_numeric(df['evolution_chain_id'], errors='coerce').fillna(0).astype(int)

        for _, row in df.iterrows():
            pokemon_exists = Pokemon.query.filter_by(pokemon_id=row['pokemon_id']).first()
            if not pokemon_exists:
                image_url = f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{row['national_id']}.png" if row['national_id'] else ""
                
                pokemon_description = ""
                if row['national_id']:
                    try:
                        species_url = f"https://pokeapi.co/api/v2/pokemon-species/{row['national_id']}/"
                        response = requests.get(species_url)
                        response.raise_for_status() # HTTP 오류 발생 시 예외 발생
                        species_data = response.json()
                        
                        # 한국어 설명 찾기
                        for entry in species_data['flavor_text_entries']:
                            if entry['language']['name'] == 'ko':
                                pokemon_description = entry['flavor_text'].replace('\n', ' ').replace('\x0c', ' ')
                                break
                    except requests.exceptions.RequestException as e:
                        print(f"Error fetching species data for national_id {row['national_id']}: {e}")
                    except KeyError as e:
                        print(f"KeyError in species data for national_id {row['national_id']}: {e}")

                new_pokemon = Pokemon(
                    pokemon_id=row['pokemon_id'],
                    name_ko=row['name'],
                    name_en=row['name'],
                    generation=row.get('generation', ''),
                    is_legendary=row.get('is_legendary', ''),
                    is_mythical=row.get('is_mythical', ''),
                    evolution_chain_id=row['evolution_chain_id'] if row['evolution_chain_id'] != 0 else None,
                    type=row['type'],
                    role=row['role'],
                    feature=row['feature'],
                    appearance=row['appearance'],
                    national_id=row['national_id'] if row['national_id'] != 0 else None,
                    image_url=image_url,
                    description=pokemon_description # 설명 필드 추가
                )
                db.session.add(new_pokemon)
        
        db.session.commit()
        print(f"{len(df)} pokemon records processed.")
# --------------------


# --- API 라우트 ---

@app.route('/api/filters')
def get_filters():
    """필터링에 사용할 모든 태그 목록을 반환합니다."""
    filters = {}
    for col in ['type', 'role', 'feature', 'appearance']:
        all_tags = set()
        query = db.session.query(getattr(Pokemon, col)).filter(getattr(Pokemon, col) != '').all()
        for item in query:
            tags = item[0].split(', ')
            for tag in tags:
                if tag:
                    all_tags.add(tag)
        filters[col] = sorted(list(all_tags))
    return jsonify(filters)

@app.route('/api/recommend', methods=['POST'])
def recommend_api():
    """선택된 필터에 따라 포켓몬을 진화 그룹별로 묶어서 추천합니다."""
    data = request.json
    selected_filters = data.get('filters', {})
    page = data.get('page', 1)
    per_page = data.get('per_page', 9)
    search_term = data.get('search', '')
    
    query = Pokemon.query
    if selected_filters:
        for category, tags in selected_filters.items():
            if tags:
                for tag in tags:
                    query = query.filter(getattr(Pokemon, category).like(f"%{tag}%"))
    
    if search_term:
        query = query.filter(Pokemon.name_ko.like(f"%{search_term}%"))
    
    matched_chain_ids = [p.evolution_chain_id for p in query.all() if p.evolution_chain_id]
    
    individual_matches_query = query.filter(Pokemon.evolution_chain_id == None)

    final_query = Pokemon.query.filter(
        (Pokemon.evolution_chain_id.in_(matched_chain_ids)) |
        (Pokemon.id.in_([p.id for p in individual_matches_query.all()]))
    )

    pokemon_list = [p.to_dict() for p in final_query.all()]
    groups = {}
    for p in pokemon_list:
        chain_id = p.get('evolution_chain_id')
        if chain_id:
            if chain_id not in groups:
                groups[chain_id] = []
            groups[chain_id].append(p)
        else:
            groups[f"ind_{p['pokemon_id']}"] = [p]

    sorted_groups = sorted(list(groups.values()), key=lambda group: min(p['pokemon_id'] for p in group))

    total_items = len(sorted_groups)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_groups = sorted_groups[start:end]

    return jsonify({
        'pokemon_groups': paginated_groups,
        'total_items': total_items,
        'page': page,
        'per_page': per_page,
        'total_pages': (total_items + per_page - 1) // per_page
    })


@app.route('/api/pokemon/<int:pokemon_id>')
def get_pokemon(pokemon_id):
    """특정 ID의 포켓몬 정보를 반환합니다."""
    pokemon = Pokemon.query.filter_by(pokemon_id=pokemon_id).first()
    if not pokemon:
        return jsonify({"error": "포켓몬을 찾을 수 없습니다."}), 404
    return jsonify(pokemon.to_dict())

@app.route('/api/likes', methods=['GET'])
@jwt_required()
def get_likes():
    current_user_id = get_jwt_identity()
    user_likes = UserLike.query.filter_by(user_id=current_user_id).all()
    liked_ids = [like.pokemon_id for like in user_likes]
    return jsonify({'liked_pokemon_ids': liked_ids})

@app.route('/api/pokemon/<int:pokemon_id>/like', methods=['POST'])
@jwt_required()
def like_pokemon(pokemon_id):
    current_user_id = get_jwt_identity()
    like = UserLike.query.filter_by(user_id=current_user_id, pokemon_id=pokemon_id).first()

    if like:
        db.session.delete(like)
        status = 'unliked'
    else:
        new_like = UserLike(user_id=current_user_id, pokemon_id=pokemon_id)
        db.session.add(new_like)
        status = 'liked'
    
    db.session.commit()

    user_likes = UserLike.query.filter_by(user_id=current_user_id).all()
    liked_ids = [like.pokemon_id for like in user_likes]
    return jsonify({'status': status, 'liked_pokemon_ids': liked_ids})

@app.route('/api/recommend/personalized', methods=['POST'])
@jwt_required()
def recommend_personalized():
    """'좋아요'한 포켓몬을 기반으로 개인화된 추천을 진화 그룹별로 묶어서 제공합니다."""
    current_user_id = get_jwt_identity()
    user_likes = UserLike.query.filter_by(user_id=current_user_id).all()
    liked_ids = [like.pokemon_id for like in user_likes]

    # '좋아요' 목록이 없으면, 기본 추천을 그룹화하여 제공
    if not liked_ids:
        default_pokemon = Pokemon.query.limit(10).all()
        pokemon_list = [p.to_dict() for p in default_pokemon]
    else:
        # 사용자 프로필 생성
        liked_pokemon = Pokemon.query.filter(Pokemon.pokemon_id.in_(liked_ids)).all()
        user_profile_tags = set()
        for p in liked_pokemon:
            for col in ['type', 'role', 'feature', 'appearance']:
                tags = getattr(p, col, "")
                if tags:
                    user_profile_tags.update(tags.split(', '))

        # 유사도 점수 계산
        all_pokemon = Pokemon.query.all()
        recommendations = []
        for p in all_pokemon:
            if p.pokemon_id in liked_ids:
                continue
            
            pokemon_tags = set()
            for col in ['type', 'role', 'feature', 'appearance']:
                tags = getattr(p, col, "")
                if tags:
                    pokemon_tags.update(tags.split(', '))
            
            score = len(user_profile_tags.intersection(pokemon_tags))
            recommendations.append({'pokemon': p, 'score': score})

        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        # 상위 20개 추천을 기반으로 진화 그룹 전체를 가져옴
        top_recs_with_scores = recommendations[:20]
        
        # 추천된 포켓몬들의 진화 ID 목록을 가져옵니다.
        rec_chain_ids = {rec['pokemon'].evolution_chain_id for rec in top_recs_with_scores if rec['pokemon'].evolution_chain_id}
        
        # 진화 ID가 없는 개별 매칭 포켓몬도 포함합니다.
        individual_matches_ids = {rec['pokemon'].id for rec in top_recs_with_scores if not rec['pokemon'].evolution_chain_id}

        # 진화 그룹에 속한 모든 포켓몬과 개별 매칭 포켓몬을 포함하는 최종 쿼리를 만듭니다.
        final_query = Pokemon.query.filter(
            (Pokemon.evolution_chain_id.in_(rec_chain_ids)) |
            (Pokemon.id.in_(individual_matches_ids))
        )
        
        # 스코어 맵 생성
        pokemon_scores = {rec['pokemon'].pokemon_id: rec['score'] for rec in recommendations}

        pokemon_list = []
        for p in final_query.all():
            score = pokemon_scores.get(p.pokemon_id)
            pokemon_list.append(p.to_dict(score=score))

    # 유사도 점수를 기준으로 내림차순 정렬
    pokemon_list.sort(key=lambda x: x.get('score', -1), reverse=True)

    # 결과를 그룹화합니다.
    groups = {}
    for p in pokemon_list:
        chain_id = p.get('evolution_chain_id')
        if chain_id:
            if chain_id not in groups:
                groups[chain_id] = []
            groups[chain_id].append(p)
        else:
            groups[f"ind_{p['pokemon_id']}"] = [p]

    sorted_groups = sorted(list(groups.values()), key=lambda group: max(p.get('score', -1) for p in group), reverse=True)

    return jsonify({
        'pokemon_groups': sorted_groups,
        'recommendation_type': 'personalized'
    })

@app.route('/api/likes/details', methods=['GET'])
@jwt_required()
def get_liked_details():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)

    liked_ids_query = db.session.query(UserLike.pokemon_id).filter_by(user_id=current_user_id)
    
    query = Pokemon.query.filter(Pokemon.pokemon_id.in_(liked_ids_query))
    total_items = query.count()
    
    paginated_results = query.paginate(page=page, per_page=per_page, error_out=False).items

    return jsonify({
        'pokemon': [p.to_dict() for p in paginated_results],
        'total_items': total_items,
        'page': page,
        'per_page': per_page,
        'total_pages': (total_items + per_page - 1) // per_page
    })


# --- React 앱 라우트 ---

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    with app.app_context():
        if not os.path.exists('pokemon_app.db'):
            print("Creating database and tables...")
            db.create_all()
            print("Database and tables created.")
    print("-------------------------------------------------")
    print("포켓몬 추천 툴을 시작합니다.")
    print("웹 브라우저에서 'http://127.0.0.1:5000' 주소로 접속하세요.")
    print("————————————————————————")
    app.run(debug=True)
