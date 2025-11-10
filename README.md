# Pokedex 추천 시스템 - Legends ZA

이 프로젝트는 개인화된 추천 시스템을 갖춘 Pokedex 웹 애플리케이션입니다. 사용자가 포켓몬을 탐색하고, 필터링하며, 검색할 수 있도록 합니다. 인증된 사용자는 포켓몬을 '좋아요'하고, 자신의 좋아요 기록을 기반으로 개인화된 추천을 받으며, 임시 '파티'를 관리할 수 있습니다. 관리자 패널은 사용자 및 포켓몬 데이터를 관리하는 기능을 제공합니다.

## 주요 기능

*   **포켓몬 탐색 및 검색:** 다양한 필터링 및 검색 옵션을 통해 포켓몬을 찾을 수 있습니다.
*   **사용자 인증:** JWT 기반의 안전한 사용자 등록 및 로그인 시스템.
*   **개인화된 추천:** 사용자의 '좋아요' 기록을 기반으로 맞춤형 포켓몬 추천을 제공합니다.
*   **포켓몬 파티 관리:** 사용자가 임시 포켓몬 파티를 구성하고 관리할 수 있습니다.
*   **관리자 패널:** 관리자는 사용자 계정 및 포켓몬 데이터를 관리할 수 있습니다.

## 아키텍처

이 애플리케이션은 Flask 백엔드와 React 프론트엔드로 구성된 풀스택 웹 애플리케이션입니다.

### 1. 백엔드 (Python/Flask)

*   **핵심 애플리케이션 (`app.py`):** Flask 애플리케이션의 중심점으로, 라우팅, 데이터베이스 초기화, JWT 인증 설정 및 React 프론트엔드 제공을 담당합니다. 포켓몬 데이터 가져오기, 필터 적용, 일반 및 개인화된 추천 제공, 사용자 '좋아요' 관리 등을 위한 API 엔드포인트를 정의합니다. 또한 데이터베이스 생성, 관리자 사용자 생성, 초기 포켓몬 데이터 가져오기를 위한 CLI 명령어를 포함합니다.
*   **인증 (`auth.py`):** 사용자 등록, 로그인(JWT 액세스 토큰 발급), 현재 사용자 정보 검색을 관리하는 Flask 블루프린트입니다. JWT 처리를 위해 `flask_jwt_extended`를, 안전한 비밀번호 해싱을 위해 `bcrypt`를 사용합니다.
*   **관리 (`admin.py`):** 관리자 작업을 위한 API 엔드포인트를 제공하는 Flask 블루프린트입니다. 사용자 목록/상세 보기, 포켓몬 목록/업데이트/삭제와 같은 기능을 포함하며, `admin_required` 데코레이터를 통해 관리자만 접근할 수 있도록 제한됩니다.
*   **데이터베이스 모델 (`models.py`):** SQLAlchemy ORM을 사용하여 애플리케이션의 데이터 구조를 정의합니다. `User` (인증 및 역할), `UserLike` (사용자가 '좋아요'한 포켓몬 추적), `Pokemon` (상세 포켓몬 속성 저장) 모델을 포함합니다.
*   **데이터 보강 (`enrich_data.py`):** `pokemon_completed.csv`를 사전 처리하는 독립형 스크립트입니다. 각 포켓몬에 대해 PokeAPI에서 `evolution_chain_id`를 가져와 CSV를 업데이트합니다. 이렇게 보강된 CSV는 `app.py`의 `import-pokemon` 명령에서 사용되며, 데이터베이스 가져오기 과정에서 PokeAPI에서 포켓몬 설명을 추가로 가져옵니다.

### 2. 프론트엔드 (React)

*   **메인 애플리케이션 (`frontend/src/App.js`):** 애플리케이션 구조, 라우팅 (`react-router-dom`), 전역 상태 관리(인증, 필터, 보기 모드, 포켓몬 파티)를 담당하는 루트 React 컴포넌트입니다. 백엔드에서 데이터를 가져오고 다양한 컴포넌트를 렌더링합니다.
*   **API 상호작용 (`frontend/src/api.js`):** 모든 프론트엔드-백엔드 통신을 위해 `/api`를 기본 URL로 하는 Axios 인스턴스를 구성합니다.
*   **인증 컴포넌트 (`frontend/src/auth/`):** `Login.js`, `Register.js`, `AuthContext.js` (인증 상태 관리), `AdminRoute.js` (관리자 경로 보호)를 포함합니다.
*   **핵심 컴포넌트 (`frontend/src/components/`):**
    *   `Filters.js`: 다양한 속성으로 포켓몬을 필터링하는 UI를 제공합니다.
    *   `Results.js`: 포켓몬 데이터를 표시하고, 페이지네이션을 처리하며, '좋아요' 상태를 보여줍니다.
    *   `Party.js`: 사용자의 임시 포켓몬 파티를 관리합니다.
    *   `PokemonDetail.js`: 단일 포켓몬에 대한 상세 정보를 표시합니다.
*   **사용자 프로필 (`frontend/src/profile/ProfilePage.js`):** 사용자의 현재 포켓몬 파티와 '좋아요'한 포켓몬을 표시합니다.
*   **관리자 컴포넌트 (`frontend/src/admin/`):** `AdminPage.js`, `UserListPage.js`, `UserDetailPage.js`, `PokemonListPage.js`를 포함한 관리자 패널 UI를 제공합니다.

## 구성 요소 간 상호작용

*   **프론트엔드 (React)**는 Axios를 사용하여 RESTful API 호출을 통해 **백엔드 (Flask)**와 통신합니다.
*   Flask 백엔드는 정적 React 빌드 파일을 제공합니다.
*   사용자 인증은 JWT를 통해 처리됩니다. 백엔드는 로그인 시 토큰을 발급하고, 프론트엔드는 보호된 요청과 함께 토큰을 저장하고 전송합니다.
*   백엔드는 SQLAlchemy를 사용하여 SQLite 데이터베이스와 상호작용합니다.
*   `enrich_data.py` 스크립트는 초기 포켓몬 데이터에 대한 사전 처리 단계 역할을 하며, 이는 Flask 애플리케이션에 의해 데이터베이스로 가져와집니다.
*   Flask 애플리케이션은 가져오기 과정에서 PokeAPI에서 설명을 가져와 포켓몬 데이터를 추가로 보강합니다.

## 사용된 기술

### 백엔드
*   Python
*   Flask (웹 프레임워크)
*   Flask-SQLAlchemy (데이터베이스 상호작용을 위한 ORM)
*   SQLite (데이터베이스)
*   Flask-Bcrypt (비밀번호 해싱)
*   Flask-JWT-Extended (JWT 인증)
*   Pandas (데이터 조작)
*   Requests (외부 API를 위한 HTTP 클라이언트)
*   PokeAPI (외부 데이터 소스)

### 프론트엔드
*   JavaScript
*   React (UI 라이브러리)
*   React Router DOM (라우팅)
*   Axios (HTTP 클라이언트)
*   Bootstrap (CSS 프레임워크)
*   `jwt-decode` (클라이언트 측 JWT 디코딩)

### 개발/빌드 도구
*   `react-scripts` (React 프로젝트 관리)
*   `tqdm` (데이터 보강 스크립트의 진행률 표시줄)
