import requests
from datetime import datetime, timedelta
import time

risk_keywords = [
    "사기", # 하늘 컴1 
    "횡령", # 정수 컴1
    "배임", # 하늘 컴2
    "분식회계", # 하늘 컴3
    "내부자 거래",
    "주가조작",
    "세금 탈루",
    "금감원 조사",
    "검찰 수사",
    "경영권 분쟁",
    "비리",
    "경영진 구속",
    "경영진 도피",
    "내부고발",
    "윤리경영 위반",
    "리더십 리스크",
    "갑질 논란",
    "오너 구속",
    "오너 해외 도피",
    "오너 일가 재판",
    "오너 일가 탈세",
    "오너 일가 횡령",
    "오너 일가 부당거래"
]

def fetch_news_from_webhook(url: str, query: str, sd: str, ed: str, news_office_checked: str) -> dict:
    """n8n을 통해 supabase에 뉴스를 저장하는 함수
    
    Args:
        query (str): 검색어
        sd (str): 시작 날짜 (YYYY.MM.DD 형식)
        ed (str): 종료 날짜 (YYYY.MM.DD 형식)
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
    params = {
        "query": query,
        "sd": sd,
        "ed": ed,
        "news_office_checked": news_office_checked
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"요청 중 오류가 발생했습니다: {e}")
        return {}

url = input("n8n webhook url을 입력하세요: ")

# CLI에서 시작연도와 월, 종료연도와 월 입력받기
start_year = int(input("시작 연도를 입력하세요 (YYYY): "))
start_month = int(input("시작 월을 입력하세요 (1-12): "))
end_year = int(input("종료 연도를 입력하세요 (YYYY): "))
end_month = int(input("종료 월을 입력하세요 (1-12): "))
current_date = datetime(start_year, start_month, 1)  # 시작 연도/월의 1일부터 시작

# CLI에서 검색어 입력받기
query = input("검색어를 입력하세요: ")

# CLI에서 뉴스사 리스트 입력받기 (쉼표로 구분)
print("뉴스사 ID 목록:")
print("1023: 조선일보")
print("1025: 중앙일보") 
print("1020: 동아일보")
print("1015: 한국경제")
print("1009: 매일경제")
print("1011: 서울경제")
news_offices_input = input("수집할 뉴스사 ID를 쉼표로 구분하여 입력하세요: ")
news_offices = [office.strip() for office in news_offices_input.split(",")]

# 시작 날짜부터 종료날짜까지 이동하면서 데이터 수집
while current_date.year < end_year or (current_date.year == end_year and current_date.month <= end_month):
    
    # 날짜 형식 변환 (YYYY.MM.DD)
    date_str = current_date.strftime("%Y.%m.%d")
    start_date = current_date.strftime("%Y.%m.%d")
    # 한 달 후의 날짜를 end_date로 설정
    next_month = current_date.replace(day=28) + timedelta(days=4)
    end_date = (next_month.replace(day=1) - timedelta(days=1)).strftime("%Y.%m.%d")  # 현재 달의 마지막 날
    # 각 뉴스사별로 데이터 수집
    for news_office in news_offices:
        print(f"수집 중: {date_str} - 뉴스사 {news_office}")
        
        # API 호출 및 재시도 로직
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            result = fetch_news_from_webhook(
                url=url,
                query=query,
                sd=start_date,
                ed=end_date,
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
        time.sleep(2)
    
    # 다음 달로 이동
    next_month = current_date.replace(day=28) + timedelta(days=4)
    current_date = next_month.replace(day=1)
    
print("데이터 수집 완료")

