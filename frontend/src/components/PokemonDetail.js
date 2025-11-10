import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import axios from 'axios';

const POKEAPI_URL = 'https://pokeapi.co/api/v2/pokemon/';

// Helper to get a class for styling tags
const getTagClass = (category) => {
    const categoryMap = {
      type: 'tag-type',
      role: 'tag-role',
      feature: 'tag-feature',
      appearance: 'tag-appearance'
    };
    return categoryMap[category] || 'tag-default';
};

// Sub-component for Stat Bars
const StatBar = ({ name, value }) => {
    const MAX_STAT = 255; // Max base stat in Pokemon games
    const percentage = (value / MAX_STAT) * 100;
    
    const statNameMapping = {
        hp: 'HP',
        attack: '공격',
        defense: '방어',
        'special-attack': '특수공격',
        'special-defense': '특수방어',
        speed: '스피드'
    };

    return (
        <div className="stat-container">
            <div className="stat-name">{statNameMapping[name] || name}</div>
            <div className="stat-bar-background">
                <div className="stat-bar" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="stat-value">{value}</div>
        </div>
    );
};


const typeNameMappingKoToEn = {
    '노말': 'normal', '불꽃': 'fire', '물': 'water', '풀': 'grass',
    '전기': 'electric', '얼음': 'ice', '격투': 'fighting', '독': 'poison',
    '땅': 'ground', '비행': 'flying', '에스퍼': 'psychic', '벌레': 'bug',
    '바위': 'rock', '고스트': 'ghost', '드래곤': 'dragon', '강철': 'steel',
    '악': 'dark', '페어리': 'fairy'
};

const typeNameMappingEnToKo = {
    normal: '노말', fire: '불꽃', water: '물', grass: '풀',
    electric: '전기', ice: '얼음', fighting: '격투', poison: '독',
    ground: '땅', flying: '비행', psychic: '에스퍼', bug: '벌레',
    rock: '바위', ghost: '고스트', dragon: '드래곤', steel: '강철',
    dark: '악', fairy: '페어리'
};

// Helper function to parse evolution chain data
const parseEvolutionChain = async (chain) => {
    const evolutions = [];
    let current = chain;

    while (current) {
        const speciesUrl = current.species.url;
        const speciesId = speciesUrl.split('/').slice(-2, -1)[0];
        const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;

        let koSpeciesName = current.species.name; // 기본값은 영어 이름
        try {
            const speciesResponse = await axios.get(speciesUrl);
            const speciesData = speciesResponse.data;
            const foundKoName = speciesData.names.find(nameEntry => nameEntry.language.name === 'ko');
            if (foundKoName) {
                koSpeciesName = foundKoName.name;
            }
        } catch (nameErr) {
            console.error(`Error fetching species name for ${speciesUrl}:`, nameErr);
        }

        let evolutionDetails = '';
        if (current.evolution_details && current.evolution_details.length > 0) {
            const details = current.evolution_details[0];
            if (details.min_level) evolutionDetails += `레벨 ${details.min_level} `;
            if (details.item) evolutionDetails += `${details.item.name} 사용 `;
            if (details.trigger && details.trigger.name !== 'level-up') evolutionDetails += `${details.trigger.name} `;
            // Add more details as needed
        }

        evolutions.push({
            name: koSpeciesName,
            id: speciesId,
            imageUrl: imageUrl,
            details: evolutionDetails.trim()
        });

        current = (current.next_evolution && current.next_evolution.length > 0) ? current.next_evolution[0] : null;
    }
    return evolutions;
};

function PokemonDetail() {
        const [pokemon, setPokemon] = useState(null);
        const [pokeapiData, setPokeapiData] = useState(null);
        const [damageRelations, setDamageRelations] = useState(null);
        const [abilitiesData, setAbilitiesData] = useState(null);
        const [evolutionChainData, setEvolutionChainData] = useState(null);
        const [parsedEvolutionChain, setParsedEvolutionChain] = useState(null); // 파싱된 진화 정보 상태 추가
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState('');
        const { id } = useParams();
    
        useEffect(() => {
            const fetchPokemonDetails = async () => {
                setLoading(true);
                setError('');
                try {
                    const localResponse = await api.get(`/pokemon/${id}`);
                    setPokemon(localResponse.data);
    
                    let fetchedPokeapiData = null;
                    if (localResponse.data.national_id) {
                        const pokeapiResponse = await axios.get(`${POKEAPI_URL}${localResponse.data.national_id}`);
                        fetchedPokeapiData = pokeapiResponse.data;
                        setPokeapiData(fetchedPokeapiData);
                    }
    
                    // 특성 정보 가져오기
                    if (fetchedPokeapiData && fetchedPokeapiData.abilities && fetchedPokeapiData.abilities.length > 0) {
                        const abilitiesPromises = fetchedPokeapiData.abilities.map(async (abilityEntry) => {
                            try {
                                const abilityResponse = await axios.get(abilityEntry.ability.url);
                                const abilityData = abilityResponse.data;
                                const koAbilityName = abilityData.names.find(
                                    (nameEntry) => nameEntry.language.name === 'ko'
                                )?.name || abilityEntry.ability.name; // 한국어 이름 없으면 영어 이름
                                const koDescription = abilityData.flavor_text_entries.find(
                                    (entry) => entry.language.name === 'ko'
                                )?.flavor_text || abilityData.effect_entries.find(
                                    (entry) => entry.language.name === 'ko'
                                )?.effect || abilityData.name; // 한국어 설명 없으면 영어 이름
                                return {
                                    name: koAbilityName,
                                    description: koDescription,
                                    is_hidden: abilityEntry.is_hidden
                                };
                            } catch (abilityErr) {
                                console.error(`Error fetching ability data for ${abilityEntry.ability.name}:`, abilityErr);
                                return null;
                            }
                        });
                        const resolvedAbilities = (await Promise.all(abilitiesPromises)).filter(Boolean);
                        setAbilitiesData(resolvedAbilities);
                    }
    
    
                                    // 데미지 관계 가져오기 (개선된 로직)
                                    if (localResponse.data.type) {
                                        const types = localResponse.data.type.split(', ').map(t => t.trim());
                                        const damageMultipliers = {}; // 각 공격 타입에 대한 최종 데미지 배율
                    
                                        for (const typeNameKo of types) { // 한글 타입 이름
                                            const typeNameEn = typeNameMappingKoToEn[typeNameKo]; // 영어 타입 이름으로 변환
                                            if (!typeNameEn) {
                                                console.warn(`Unknown type name in Korean: ${typeNameKo}`);
                                                continue;
                                            }
                                            try {
                                                const typeResponse = await axios.get(`https://pokeapi.co/api/v2/type/${typeNameEn}/`);
                                                const relations = typeResponse.data.damage_relations;
                    
                                                // 각 관계에 따라 데미지 배율 업데이트
                                                relations.double_damage_from.forEach(rel => {
                                                    damageMultipliers[rel.name] = (damageMultipliers[rel.name] || 1) * 2;
                                                });
                                                relations.half_damage_from.forEach(rel => {
                                                    damageMultipliers[rel.name] = (damageMultipliers[rel.name] || 1) * 0.5;
                                                });
                                                relations.no_damage_from.forEach(rel => {
                                                    damageMultipliers[rel.name] = (damageMultipliers[rel.name] || 1) * 0;
                                                });
                                            } catch (typeErr) {
                                                console.error(`Error fetching damage relations for type ${typeNameKo}:`, typeErr);
                                            }
                                        }
                    
                                                                                const finalDamageRelations = {
                                                                                    quadruple_damage_from: [], // 4배 약점
                                                                                    double_damage_from: [], // 2배 약점
                                                                                    half_damage_from: [],   // 0.5배 반감
                                                                                    no_damage_from: [],     // 0배 무효
                                                                                };
                                                            
                                                                                // 모든 타입에 대해 최종 배율을 기준으로 분류
                                                                                const allAffectedTypes = new Set();
                                                                                Object.keys(damageMultipliers).forEach(type => allAffectedTypes.add(type));
                                                                                
                                                                                allAffectedTypes.forEach(type => {
                                                                                    const multiplier = damageMultipliers[type] || 1; // 기본 1배
                                                                                    if (multiplier === 4) { // 4배 약점
                                                                                        finalDamageRelations.quadruple_damage_from.push(type);
                                                                                    } else if (multiplier === 2) { // 2배 약점
                                                                                        finalDamageRelations.double_damage_from.push(type);
                                                                                    } else if (multiplier === 0.5) { // 0.5배 반감
                                                                                        finalDamageRelations.half_damage_from.push(type);
                                                                                    } else if (multiplier === 0) { // 0배 무효
                                                                                        finalDamageRelations.no_damage_from.push(type);
                                                                                    }
                                                                                    // 1배, 0.25배 등은 현재 UI에서 처리하지 않으므로 제외
                                                                                });
                                                                                
                                                                                setDamageRelations(finalDamageRelations);                        } // <-- 이 닫는 중괄호가 누락되었습니다.

                        // 진화 정보 가져오기
                        if (localResponse.data.evolution_chain_id) {
                        try {
                            const evolutionChainResponse = await axios.get(`https://pokeapi.co/api/v2/evolution-chain/${localResponse.data.evolution_chain_id}/`);
                            const fetchedEvolutionChainData = evolutionChainResponse.data;
                            setEvolutionChainData(fetchedEvolutionChainData);
                            // 파싱된 진화 정보 저장
                            const parsed = await parseEvolutionChain(fetchedEvolutionChainData.chain);
                            setParsedEvolutionChain(parsed);
                        } catch (evoErr) {
                            console.error(`Error fetching evolution chain for ID ${localResponse.data.evolution_chain_id}:`, evoErr);
                        }
                    }
    
                } catch (err) {
                    setError('포켓몬 정보를 불러오는 데 실패했습니다.');
                } finally {
                    setLoading(false);
                }
            };
    
            fetchPokemonDetails();
        }, [id]);

    if (loading) return <div className="container mt-5 text-center"><h2>로딩 중...</h2></div>;
    if (error) return <div className="container mt-5 text-center alert alert-danger">{error}</div>;
    if (!pokemon) return <div className="container mt-5 text-center"><h2>포켓몬을 찾을 수 없습니다.</h2></div>;

    const stats = pokeapiData?.stats;

    const categoryNameMapping = {
        type: '타입',
        role: '역할',
        feature: '특징',
        appearance: '외형'
    };

    return (
        <div className="container my-5">
            <div className="row">
                <div className="col-md-5 text-center">
                    <div className="card p-4 pokemon-detail-card">
                        <img src={pokemon.image_url} alt={pokemon.name_ko} className="img-fluid" style={{maxHeight: '400px'}} />
                        <h1 className="mt-3">{pokemon.name_ko}</h1>
                        <p className="text-muted">No. {pokemon.pokemon_id}</p>
                    </div>
                </div>
                <div className="col-md-7">
                    <div className="card pokemon-detail-card">
                        <div className="card-header">
                            <h4>상세 정보</h4>
                        </div>
                        <div className="card-body">
                            <div className="mb-4">
                                <h5>기본 정보</h5>
                                {['type', 'role', 'feature', 'appearance'].map(cat => (
                                    pokemon[cat] && (
                                        <div key={cat} className="d-flex align-items-baseline mb-2">
                                            <strong className="me-3" style={{width: '50px'}}>{categoryNameMapping[cat] || cat}:</strong>
                                            <div>
                                                {pokemon[cat].split(', ').map(tag => (
                                                    <span key={tag} className={`tag ${getTagClass(cat)}`}>{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))}
                                {pokeapiData && (
                                    <>
                                        <p><strong>키:</strong> {pokeapiData.height / 10} m</p>
                                        <p><strong>몸무게:</strong> {pokeapiData.weight / 10} kg</p>
                                    </>
                                )}
                                {pokemon.description && (
                                    <div className="mt-3">
                                        <h5>설명</h5>
                                        <p>{pokemon.description}</p>
                                    </div>
                                )}

                                {abilitiesData && abilitiesData.length > 0 && (
                                    <div className="mt-4">
                                        <h5>특성</h5>
                                        {abilitiesData.map((ability, index) => (
                                            <div key={index} className="mb-2">
                                                <strong>{ability.name}</strong> {ability.is_hidden && <span className="badge bg-secondary ms-2">숨겨진 특성</span>}
                                                <p className="text-muted mb-0">{ability.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <hr/>

                            <div className="mt-4">
                                <h5>능력치 (Base Stats)</h5>
                                {stats ? (
                                    stats.map(stat => (
                                        <StatBar key={stat.stat.name} name={stat.stat.name} value={stat.base_stat} />
                                    ))
                                ) : <p>능력치 정보를 불러오는 중...</p>}
                            </div>

                            <hr/>

                            {damageRelations && (
                                <div className="mt-4">
                                    <h5>타입 상성</h5>
                                    {Object.keys(damageRelations).map(relationKey => {
                                        const types = damageRelations[relationKey];
                                        if (types.length === 0) return null;

                                        const titleMap = {
                                            quadruple_damage_from: '4배 데미지 (치명적 약점)',
                                            double_damage_from: '2배 데미지 (약점)',
                                            half_damage_from: '0.5배 데미지 (반감)',
                                            no_damage_from: '0배 데미지 (무효)'
                                        };

                                        return (
                                            <div key={relationKey} className="mb-2">
                                                <strong>{titleMap[relationKey]}:</strong>
                                                <div className="d-flex flex-wrap mt-1">
                                                    {types.map(type => (
                                                        <span key={type} className={`tag tag-type me-1 mb-1`}>
                                                            {typeNameMappingEnToKo[type] || type}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <hr/>

                            {parsedEvolutionChain && (
                                <div className="mt-4">
                                    <h5>진화 정보</h5>
                                    <div className="d-flex flex-wrap justify-content-center align-items-center">
                                        {parsedEvolutionChain.map((evo, index, arr) => (
                                            <React.Fragment key={evo.id}>
                                                <div className="text-center mx-2">
                                                    <img src={evo.imageUrl} alt={evo.name} style={{width: '80px', height: '80px'}} />
                                                    <p className="mb-0">{evo.name}</p>
                                                    {evo.details && <small className="text-muted">{evo.details}</small>}
                                                </div>
                                                {index < arr.length - 1 && (
                                                    <div className="mx-2">
                                                        <i className="bi bi-arrow-right"></i>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                             <div className="mt-4 text-center">
                                <Link to="/" className="btn btn-primary">목록으로 돌아가기</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PokemonDetail;
