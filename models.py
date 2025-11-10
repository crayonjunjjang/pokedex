from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model):
    """사용자 모델"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

    def set_password(self, password):
        """비밀번호를 해시하여 저장"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        """비밀번호 확인"""
        return bcrypt.check_password_hash(self.password_hash, password)

class UserLike(db.Model):
    """사용자가 '좋아요'한 포켓몬 모델"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    pokemon_id = db.Column(db.Integer, nullable=False)

    user = db.relationship('User', backref=db.backref('likes', lazy=True))

    __table_args__ = (db.UniqueConstraint('user_id', 'pokemon_id', name='_user_pokemon_uc'),)

class Pokemon(db.Model):
    """포켓몬 데이터 모델"""
    id = db.Column(db.Integer, primary_key=True)
    pokemon_id = db.Column(db.Integer, unique=True, nullable=False)
    name_ko = db.Column(db.String, nullable=False)
    name_en = db.Column(db.String)
    generation = db.Column(db.String)
    is_legendary = db.Column(db.String)
    is_mythical = db.Column(db.String)
    evolution_chain_id = db.Column(db.Integer)
    type = db.Column(db.String)
    role = db.Column(db.String)
    feature = db.Column(db.String)
    appearance = db.Column(db.String)
    national_id = db.Column(db.Integer)
    image_url = db.Column(db.String)
    description = db.Column(db.Text) # 포켓몬 설명 필드 추가

    def to_dict(self, score=None):
        """객체를 딕셔너리로 변환"""
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if score is not None:
            data['score'] = score
        return data
