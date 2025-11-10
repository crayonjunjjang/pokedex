import React from 'react';

const MAX_PARTY_SIZE = 6;

function Party({ party, removeFromParty }) {
  return (
    <div className="party-container shadow-sm">
      <div className="container">
        <h4 className="mb-3">나의 포켓몬 파티 🐲</h4>
        <div id="party-slots" className="row gx-2 gy-2">
          {Array.from({ length: MAX_PARTY_SIZE }).map((_, i) => {
            const pokemon = party[i];
            return (
              <div key={i} className="col">
                {pokemon ? (
                  <div
                    className="party-slot filled"
                  >
                    <button
                      className="btn-close position-absolute top-0 end-0 m-1"
                      aria-label="Remove from party"
                      onClick={() => removeFromParty(pokemon.pokemon_id)}
                      style={{ fontSize: '0.6rem' }}
                    ></button>
                    {pokemon.image_url && (
                      <img
                        src={pokemon.image_url}
                        alt={pokemon.name_ko}
                        className="party-pokemon-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <small>{pokemon.name_ko}</small>
                  </div>
                ) : (
                  <div className="party-slot">비어있음</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Party;