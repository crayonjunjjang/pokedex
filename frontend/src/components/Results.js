import React from 'react';
import { Link } from 'react-router-dom';

// --- Sub-components for better structure ---

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);

const getTagClass = (category) => {
  const categoryMap = {
    type: 'tag-type',
    role: 'tag-role',
    feature: 'tag-feature',
    appearance: 'tag-appearance'
  };
  return categoryMap[category] || 'tag-default';
};

const PokemonCard = ({ p, onLike, likedIds, addToParty, showSimilarity }) => (
  <div className="col">
    <Link to={`/pokemon/${p.pokemon_id}`} className="card h-100 pokemon-card text-decoration-none text-dark position-relative">
      <button 
        className={`like-btn ${likedIds.has(Number(p.pokemon_id)) ? 'liked' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLike(p.pokemon_id);
        }}
        aria-label="Like this pokemon"
      >
        <HeartIcon />
      </button>
      <div className="pokemon-card-img-container">
        {p.image_url && ( // Conditionally render img tag
          <img 
            src={p.image_url} 
            className="pokemon-card-img" 
            alt={p.name_ko}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
      </div>
      <div className="card-body">
        <h5 className="card-title">{p.name_ko}</h5>
        {showSimilarity && p.score !== undefined && p.score !== -1 && (
          <p className="card-text text-muted" style={{ fontSize: '0.85rem' }}>
            유사도 점수: {p.score.toFixed(2)}
          </p>
        )}
        <div className="card-text mt-2" style={{ minHeight: '60px' }}>
          {['type', 'role', 'feature', 'appearance'].flatMap(cat =>
            p[cat] ? p[cat].split(', ').map(tag => (
              <span key={`${cat}-${tag}`} className={`tag ${getTagClass(cat)}`}>{tag}</span>
            )) : []
          )}
        </div>
      </div>
      <div className="card-footer bg-transparent border-0 p-3">
        <button className="btn btn-primary w-100" onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addToParty(p);
        }}>
          파티에 추가
        </button>
      </div>
    </Link>
  </div>
);

const Pagination = ({ pagination, handlePageChange }) => {
  if (!pagination || !pagination.total_pages || pagination.total_pages <= 1) {
    return null;
  }

  const { page, total_pages } = pagination;

  const renderPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(total_pages, page + 2);

    if (page <= 3) {
      endPage = Math.min(5, total_pages);
    }
    if (page > total_pages - 3) {
      startPage = Math.max(1, total_pages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }
    return pageNumbers;
  };

  return (
    <nav>
      <ul className="pagination justify-content-center">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(page - 1)}>
            &laquo;
          </button>
        </li>
        {renderPageNumbers()}
        <li className={`page-item ${page === total_pages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(page + 1)}>
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};

// --- Main Results Component ---

function Results({ pokemonData, viewMode, addToParty, pagination, handlePageChange, onLike, likedIds, showSimilarity }) {
  if (!pokemonData || pokemonData.length === 0) {
    return <div className="col-12"><p className="text-center text-muted mt-5">조건에 맞는 포켓몬이 없습니다.</p></div>;
  }

  // Grouped view for 'filter' and 'personalized' modes
  if (viewMode === 'filter' || viewMode === 'personalized') {
    return (
      <>
        {viewMode === 'personalized' && (
          <p className="text-center text-muted mb-4">
            좋아요 목록을 통해 유사도가 높은 포켓몬을 추천합니다.
          </p>
        )}
        <div id="results-container">
          {pokemonData.map((group, index) => {
            return (
              <div key={index} className="evolution-group-container">
                <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                  {Array.isArray(group) && group.map(p => (
                    <PokemonCard 
                      key={p.pokemon_id}
                      p={p}
                      onLike={onLike}
                      likedIds={likedIds}
                      addToParty={addToParty}
                      showSimilarity={showSimilarity}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-5">
          <Pagination pagination={pagination} handlePageChange={handlePageChange} />
        </div>
      </>
    );
  }

  // Flat list view for 'likes' mode
  return (
    <>
      <div id="results-container" className="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-4">
        {pokemonData.map(p => (
          <PokemonCard 
            key={p.pokemon_id}
            p={p}
            onLike={onLike}
            likedIds={likedIds}
            addToParty={addToParty}
          />
        ))}
      </div>
      <div className="mt-5">
        <Pagination pagination={pagination} handlePageChange={handlePageChange} />
      </div>
    </>
  );
}

export default Results;