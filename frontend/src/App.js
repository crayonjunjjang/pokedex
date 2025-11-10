import React, { useState, useEffect, useCallback, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Party from './components/Party';
import Filters from './components/Filters';
import Results from './components/Results';
import PokemonDetail from './components/PokemonDetail';
import Login from './auth/Login';
import Register from './auth/Register';
import AdminPage from './admin/AdminPage';
import AdminRoute from './auth/AdminRoute';
import UserListPage from './admin/UserListPage';
import UserDetailPage from './admin/UserDetailPage';
import PokemonListPage from './admin/PokemonListPage';
import ProfilePage from './profile/ProfilePage';
import { AuthProvider, default as AuthContext } from './auth/AuthContext';
import api from './api';

function Header({ setCurrentPage, setViewMode }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogoClick = () => {
    setCurrentPage(1);
    setViewMode('filter'); // 로고 클릭 시 항상 필터 모드의 첫 페이지로 이동
    navigate('/');
  };

  return (
    <header className="bg-light p-3">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="h4 text-decoration-none text-dark" onClick={handleLogoClick}>포켓몬 추천 시스템 - 레전드 ZA</Link>
        <nav>
          {user ? (
            <>
              {user.is_admin && <Link to="/admin" className="btn btn-info me-3">관리자 페이지</Link>}
              <Link to="/profile" className="btn btn-success me-3">내 프로필</Link>
              <span className="me-3">안녕하세요, {user.username}님!</span>
              <button onClick={handleLogout} className="btn btn-outline-danger">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline-primary me-2">로그인</Link>
              <Link to="/register" className="btn btn-primary">회원가입</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}


function MainPage({
  filters,
  handleFilterChange,
  pokemonData,
  addToParty,
  party,
  removeFromParty,
  pagination,
  handlePageChange,
  likedIds,
  handleLikeClick,
  viewMode,
  handleViewChange,
  searchTerm, // Add searchTerm to props
  setSearchTerm // Add setSearchTerm to props
}) {
  const { user } = useContext(AuthContext);

  return (
    <>
      <Party party={party} removeFromParty={removeFromParty} />
      <div className="container mt-4">
        <div className="d-flex justify-content-center mb-4">
          <div className="btn-group">
            <button
              className={`btn ${viewMode === 'filter' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleViewChange('filter')}
            >
              미르 도감
            </button>
            {user && (
              <>
                <button
                  className={`btn ${viewMode === 'personalized' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleViewChange('personalized')}
                >
                  개인화 추천
                </button>
                <button
                  className={`btn ${viewMode === 'likes' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleViewChange('likes')}
                >
                  좋아요 목록
                </button>
              </>
            )}
          </div>
        </div>
        <div className="row">
          {viewMode === 'filter' && (
            <div className="col-lg-3">
              <Filters
                filters={filters}
                handleFilterChange={handleFilterChange}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            </div>
          )}
          <div className={viewMode === 'filter' ? 'col-lg-9' : 'col-lg-12'}>
            <Results
              pokemonData={pokemonData}
              viewMode={viewMode}
              addToParty={addToParty}
              pagination={pagination}
              handlePageChange={handlePageChange}
              likedIds={likedIds}
              onLike={handleLikeClick}
              showSimilarity={viewMode === 'personalized'}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const [filters, setFilters] = useState({});
  const [selectedFilters, setSelectedFilters] = useState({});
  const [pokemonData, setPokemonData] = useState([]);
  const [party, setParty] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [likedIds, setLikedIds] = useState(new Set());
  const [likedPokemonDetails, setLikedPokemonDetails] = useState([]);
  const [viewMode, setViewMode] = useState('filter');
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term
  const { user, token, loading } = useContext(AuthContext);
  // 필터 목록 가져오기
  useEffect(() => {
    api.get('/filters')
      .then(res => setFilters(res.data))
      .catch(err => console.error("Error fetching filters:", err));
  }, []);

  // '좋아요' 목록 ID 가져오기 (사용자 로그인 시)
  useEffect(() => {
    if (user) {
      api.get('/likes')
        .then(res => setLikedIds(new Set(res.data.liked_pokemon_ids)))
        .catch(err => console.error("Error fetching likes:", err));
    } else {
      setLikedIds(new Set());
    }
  }, [user, token]);

  // '좋아요' 포켓몬 상세 정보 가져오기
  useEffect(() => {
    if (likedIds.size > 0) {
      api.get(`/likes/details?page=1&per_page=100`) // 최대 100개까지 가져오기
        .then(res => {
          setLikedPokemonDetails(res.data.pokemon || []);
        })
        .catch(err => console.error("Error fetching liked pokemon details:", err));
    } else {
      setLikedPokemonDetails([]);
    }
  }, [likedIds]);


  // '좋아요' 클릭 핸들러
  const handleLikeClick = (pokemonId) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }
    api.post(`/pokemon/${pokemonId}/like`)
      .then(res => {
        setLikedIds(new Set(res.data.liked_pokemon_ids));
      })
      .catch(err => console.error("Error liking pokemon:", err));
  };

  // 뷰 모드 변경 핸들러
  const handleViewChange = (mode) => {
    if (viewMode === mode) return;
    setViewMode(mode);
    setCurrentPage(1);
    setPokemonData([]);
    setPagination({});
  };

  const handleFilterChange = useCallback(() => {
    const currentSelectedFilters = {};
    document.querySelectorAll('.form-check-input:checked').forEach(checkbox => {
      const category = checkbox.dataset.category;
      if (!currentSelectedFilters[category]) {
        currentSelectedFilters[category] = [];
      }
      currentSelectedFilters[category].push(checkbox.value);
    });
    setSelectedFilters(currentSelectedFilters);
    setCurrentPage(1);
  }, []);

  // 데이터 가져오기 로직
  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      window.scrollTo(0, 0);
      try {
        let response;
        if (viewMode === 'filter') {
          response = await api.post('/recommend', {
            filters: selectedFilters,
            page: currentPage,
            per_page: 9,
            search: searchTerm // Include search term in the request
          });
          if (isMounted) {
            setPokemonData(response.data.pokemon_groups || []);
            setPagination(response.data);
          }
        } else if (user && viewMode === 'personalized') {
          response = await api.post('/recommend/personalized');
          if (isMounted) {
            console.log("Personalized Recommendation Data:", response.data); // Add this line
            setPokemonData(response.data.pokemon_groups || []); // Changed from response.data.pokemon
            setPagination({});
          }
        } else if (user && viewMode === 'likes') {
          response = await api.get(`/likes/details?page=${currentPage}&per_page=12`);
          if (isMounted) {
            setPokemonData(response.data.pokemon || []);
            setPagination(response.data);
          }
        }
      } catch (error) {
        console.error(`Error fetching data for ${viewMode}:`, error);
        if (isMounted) {
            setPokemonData([]);
            setPagination({});
        }
      }
    };

    if (!loading) {
        fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [selectedFilters, currentPage, viewMode, user, loading, token, searchTerm]);


  const addToParty = (p) => {
    if (party.length < 6 && !party.find(pm => pm.pokemon_id === p.pokemon_id)) {
      setParty([...party, p]);
    }
  };

  const removeFromParty = (pokemonId) => {
    setParty(party.filter(p => p.pokemon_id !== pokemonId));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <div className="container mt-5 text-center"><h2>로딩 중...</h2></div>;
  }

  return (
    <>
      <Header setCurrentPage={setCurrentPage} setViewMode={setViewMode} />
      <Routes>
        <Route path="/" element={
          <MainPage
            filters={filters}
            handleFilterChange={handleFilterChange}
            pokemonData={pokemonData}
            addToParty={addToParty}
            party={party}
            removeFromParty={removeFromParty}
            pagination={pagination}
            handlePageChange={handlePageChange}
            likedIds={likedIds}
            handleLikeClick={handleLikeClick}
            viewMode={viewMode}
            handleViewChange={handleViewChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        } />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={
          <ProfilePage 
            party={party} 
            removeFromParty={removeFromParty} 
            likedPokemon={likedPokemonDetails} 
          />} 
        />
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="" element={<AdminPage />}>
            <Route index element={<h4>메뉴를 선택하세요.</h4>} />
            <Route path="users" element={<UserListPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
            <Route path="pokemon" element={<PokemonListPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
