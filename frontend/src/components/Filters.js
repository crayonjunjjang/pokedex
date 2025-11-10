import React from 'react';

function Filters({ filters, handleFilterChange, searchTerm, setSearchTerm }) {
  const categoryNames = {
    type: '타입',
    role: '역할',
    feature: '특징',
    appearance: '외형'
  };

  return (
    <div className="p-3 bg-white rounded shadow-sm filters-container">
      <h5 className="mb-3">필터</h5>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="포켓몬 이름 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="accordion" id="filterAccordion">
        {Object.entries(filters).map(([category, tags], index) => {
          if (tags.length === 0) return null;
          return (
            <div className="accordion-item" key={category}>
              <h2 className="accordion-header" id={`heading-${category}`}>
                <button 
                  className={`accordion-button ${index !== 0 ? 'collapsed' : ''}`} 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target={`#collapse-${category}`} 
                  aria-expanded={index === 0 ? "true" : "false"}
                  aria-controls={`collapse-${category}`}
                >
                  {categoryNames[category] || category}
                </button>
              </h2>
              <div 
                id={`collapse-${category}`} 
                className={`accordion-collapse collapse ${index === 0 ? 'show' : ''}`} 
                aria-labelledby={`heading-${category}`} 
                data-bs-parent="#filterAccordion"
              >
                <div className="accordion-body filter-pills-container">
                  {tags.map(tag => (
                    <div key={tag} className="form-check form-check-inline">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        value={tag}
                        id={`${category}-${tag}`}
                        data-category={category}
                        onChange={handleFilterChange}
                      />
                      <label className="form-check-label" htmlFor={`${category}-${tag}`}>
                        {tag}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Filters;