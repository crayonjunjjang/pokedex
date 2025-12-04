# 포켓몬 추천 시스템 - Legends ZA

포켓몬을 탐색하고, 개인화된 추천을 받으며, 나만의 파티를 구성할 수 있는 풀스택 웹 애플리케이션입니다.

## 주요 기능

- **포켓몬 도감**: 다양한 필터(타입, 역할, 특징, 외형)로 포켓몬 검색 및 탐색
- **개인화 추천**: 사용자의 좋아요 기록을 기반으로 한 맞춤형 포켓몬 추천
- **파티 관리**: 최대 6마리의 포켓몬으로 구성된 임시 파티 생성
- **사용자 인증**: JWT 기반 회원가입 및 로그인
- **관리자 패널**: 사용자 및 포켓몬 데이터 관리

## 기술 스택

### 백엔드
- Python 3.x
- Flask (웹 프레임워크)
- SQLAlchemy (ORM)
- SQLite (데이터베이스)
- Flask-JWT-Extended (인증)
- Flask-Bcrypt (비밀번호 해싱)
- PokeAPI (외부 데이터 소스)

### 프론트엔드
- React 19
- React Router DOM (라우팅)
- Axios (HTTP 클라이언트)
- Bootstrap 5 (UI 프레임워크)
- jwt-decode (토큰 디코딩)

## 설치 및 실행

### 사전 요구사항
- Python 3.8 이상
- Node.js 14 이상
- npm 또는 yarn

### 백엔드 설정

1. 가상환경 생성 및 활성화
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

2. 필요한 패키지 설치
```bash
pip install flask flask-sqlalchemy flask-bcrypt flask-jwt-extended pandas requests tqdm
```

3. 데이터베이스 초기화
```bash
flask create-db
flask create-admin
```

4. 포켓몬 데이터 가져오기 (선택사항)
```bash
# evolution_chain_id 데이터 보강 (최초 1회)
python enrich_data.py

# 데이터베이스에 포켓몬 데이터 임포트
flask import-pokemon
```

5. 백엔드 서버 실행
```bash
python app.py
```
서버는 `http://127.0.0.1:5000`에서 실행됩니다.

### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동
```bash
cd frontend
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm start
```
개발 서버는 `http://localhost:3000`에서 실행됩니다.

4. 프로덕션 빌드 (선택사항)
```bash
npm run build
```
빌드된 파일은 `frontend/build` 디렉토리에 생성되며, Flask 서버가 자동으로 제공합니다.

## 프로젝트 구조

```
.
├── app.py                      # Flask 메인 애플리케이션
├── auth.py                     # 인증 관련 라우트
├── admin.py                    # 관리자 기능 라우트
├── models.py                   # 데이터베이스 모델
├── enrich_data.py              # 포켓몬 데이터 보강 스크립트
├── pokemon_completed.csv       # 포켓몬 원본 데이터
├── instance/
│   └── pokemon_app.db          # SQLite 데이터베이스
└── frontend/
    ├── public/                 # 정적 파일
    ├── src/
    │   ├── App.js              # React 메인 컴포넌트
    │   ├── api.js              # Axios 설정
    │   ├── auth/               # 인증 관련 컴포넌트
    │   ├── admin/              # 관리자 페이지 컴포넌트
    │   ├── components/         # 공통 컴포넌트
    │   └── profile/            # 프로필 페이지
    └── package.json
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 포켓몬
- `GET /api/filters` - 필터 옵션 조회
- `POST /api/recommend` - 필터 기반 포켓몬 추천
- `POST /api/recommend/personalized` - 개인화 추천
- `GET /api/pokemon/<id>` - 포켓몬 상세 정보

### 좋아요
- `GET /api/likes` - 좋아요 목록 조회
- `POST /api/pokemon/<id>/like` - 좋아요 토글
- `GET /api/likes/details` - 좋아요한 포켓몬 상세 정보

### 관리자 (인증 필요)
- `GET /api/admin/users` - 사용자 목록
- `GET /api/admin/users/<id>` - 사용자 상세 정보
- `GET /api/admin/pokemon` - 포켓몬 목록
- `PUT /api/admin/pokemon/<id>` - 포켓몬 정보 수정
- `DELETE /api/admin/pokemon/<id>` - 포켓몬 삭제

## 기본 계정

관리자 계정:
- 아이디: `admin`
- 비밀번호: `admin`

> ⚠️ 프로덕션 환경에서는 반드시 비밀번호를 변경하세요.

## 데이터베이스 모델

### User
- 사용자 계정 정보
- 비밀번호 해싱 (bcrypt)
- 관리자 권한 플래그

### Pokemon
- 포켓몬 기본 정보 (이름, 타입, 세대 등)
- 진화 체인 ID
- 이미지 URL 및 설명
- 태그 기반 분류 (역할, 특징, 외형)

### UserLike
- 사용자-포켓몬 좋아요 관계
- 개인화 추천 알고리즘의 기반

## 개발 가이드

### 새로운 필터 추가
1. `pokemon_completed.csv`에 새 컬럼 추가
2. `models.py`의 `Pokemon` 모델에 필드 추가
3. `app.py`의 `/api/filters` 엔드포인트에 컬럼 추가
4. 프론트엔드 `Filters.js` 컴포넌트 업데이트

### 추천 알고리즘 수정
`app.py`의 `recommend_personalized()` 함수에서 유사도 계산 로직을 수정할 수 있습니다.

## 문제 해결

### 데이터베이스 초기화 오류
```bash
flask create-db
```
명령어로 데이터베이스를 재생성하세요.

### CORS 오류
프론트엔드 개발 서버 사용 시 `frontend/package.json`의 `proxy` 설정을 확인하세요.

### 포켓몬 이미지가 표시되지 않음
PokeAPI의 이미지 URL이 변경되었을 수 있습니다. `app.py`의 `import_pokemon_data()` 함수에서 이미지 URL 형식을 확인하세요.

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.
