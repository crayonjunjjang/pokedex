import pandas as pd
import requests
import time
import re
from tqdm import tqdm

# 상수 정의
CSV_FILE = 'pokemon_completed.csv'
SPECIES_API_URL = 'https://pokeapi.co/api/v2/pokemon-species/{id}'

def get_evolution_chain_id(url):
    """Evolution chain URL에서 ID를 추출합니다."""
    if not url or not isinstance(url, str):
        return None
    match = re.search(r'/(\d+)/$', url)
    return int(match.group(1)) if match else None

def enrich_pokemon_data():
    """CSV 파일을 읽고, PokeAPI를 호출하여 evolution_chain_id를 추가합니다."""
    try:
        df = pd.read_csv(CSV_FILE)
    except FileNotFoundError:
        print(f"오류: '{CSV_FILE}' 파일을 찾을 수 없습니다.")
        return

    if 'evolution_chain_id' in df.columns:
        print("이미 'evolution_chain_id' 컬럼이 존재합니다. 스크립트를 종료합니다.")
        return

    if 'national_id' not in df.columns:
        print("오류: 'national_id' 컬럼이 필요합니다.")
        return

    evolution_chain_ids = []
    
    print(f"총 {len(df)}개의 포켓몬 데이터 보강을 시작합니다...")

    # tqdm을 사용하여 진행률 표시
    for index, row in tqdm(df.iterrows(), total=df.shape[0], desc="진화 정보 가져오는 중"):
        national_id = row['national_id']
        
        # national_id가 유효한 숫자인지 확인
        if pd.isna(national_id) or not str(national_id).isdigit():
            evolution_chain_ids.append(None)
            continue

        try:
            response = requests.get(SPECIES_API_URL.format(id=int(national_id)))
            
            if response.status_code == 200:
                data = response.json()
                chain_url = data.get('evolution_chain', {}).get('url')
                chain_id = get_evolution_chain_id(chain_url)
                evolution_chain_ids.append(chain_id)
            else:
                evolution_chain_ids.append(None)
                print(f"경고: National ID {national_id}에 대한 정보를 가져오지 못했습니다. (상태 코드: {response.status_code})")

        except requests.RequestException as e:
            evolution_chain_ids.append(None)
            print(f"오류: National ID {national_id} 요청 중 네트워크 오류 발생: {e}")
            # 네트워크 오류 시 잠시 대기 후 재시도하거나 중단할 수 있음
            break
        
        # API 서버에 부담을 주지 않기 위해 약간의 딜레이 추가
        time.sleep(0.05)

    # 새 컬럼 추가
    # national_id와 name 컬럼 사이에 evolution_chain_id 컬럼을 삽입
    df.insert(df.columns.get_loc('name'), 'evolution_chain_id', evolution_chain_ids)
    
    # 업데이트된 DataFrame을 CSV 파일로 저장
    df.to_csv(CSV_FILE, index=False, encoding='utf-8-sig')
    
    print("\n데이터 보강이 완료되었습니다!")
    print(f"'{CSV_FILE}' 파일이 'evolution_chain_id' 컬럼과 함께 업데이트되었습니다.")

if __name__ == '__main__':
    enrich_pokemon_data()
