import requests
from datetime import datetime, timedelta
import time

def fetch_news_from_webhook(query: str, date: str, news_office_checked: str) -> dict:
    """n8n을 통해 supabase에 뉴스를 저장하는 함수
    
    Args:
        query (str): 검색어
        date (str): 날짜 (YYYY.MM.DD 형식)
        news_office_checked (str): 뉴스사 ID
          1023(조선일보)
          1025(중앙일보)
          1020(동아일보)
          1015(한국경제)
          1009(매일경제)
          1011(서울경제)
        
    Returns:
        dict: 응답 데이터
          sucess : 성공했거나 이미 중복 데이터거나
          retry : 실패 > 재시도
    """
    url = "https://moluvalu.app.n8n.cloud/webhook/3fc6b155-45d8-42cb-b54b-c81bd87ac445"
    params = {
        "query": query,
        "date": date,
        "news_office_checked": news_office_checked
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"요청 중 오류가 발생했습니다: {e}")
        return {}




# 시작 날짜 설정 (2025.06.30)
current_date = datetime(2025, 6, 30)

# 검색어와 뉴스사 리스트 설정
query = "사기"
news_offices = ["1025", "1020"] # 중앙일보, 동아일보

# 과거로 이동하면서 데이터 수집
while current_date.year >= 2025:  # 2025년까지 수집
    
    # 날짜 형식 변환 (YYYY.MM.DD)
    date_str = current_date.strftime("%Y.%m.%d")
    
    # 각 뉴스사별로 데이터 수집
    for news_office in news_offices:
        print(f"수집 중: {date_str} - 뉴스사 {news_office}")
        
        # API 호출 및 재시도 로직
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            result = fetch_news_from_webhook(
                query=query,
                date=date_str,
                news_office_checked=news_office
            )
            
            # retry가 있으면 재시도
            if result.get('retry'):
                print(f"재시도 {retry_count + 1}/{max_retries}")
                retry_count += 1
                time.sleep(2)  # 재시도 전 2초 대기
                continue
            else:
                break
                
        # 결과 출력
        print(f"{date_str} {news_office} 결과: {result}")
        
        # API 호출 간 간격 두기 
        time.sleep(1)
    
    # 하루 전으로 이동
    current_date -= timedelta(days=1)
    
print("데이터 수집 완료")