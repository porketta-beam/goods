import warnings
warnings.filterwarnings('ignore')
import matplotlib.font_manager as fm
from matplotlib import rc
from datetime import date
from dateutil.relativedelta import relativedelta
import yfinance as yf
import pandas as pd
import numpy as np
import json
import matplotlib.pyplot as plt

def monte_carlo_simulation(stock_ticker='005930.KS', stock_name='삼성전자 (Samsung)', 
                           months_back=18, num_simulations=100, simulation_days=60):
    """
    몬테카를로 시뮬레이션을 수행하는 함수
    
    Parameters:
    stock_ticker (str): 주식 티커 심볼
    stock_name (str): 주식 이름
    months_back (int): 과거 몇 개월 데이터를 가져올지
    num_simulations (int): 시뮬레이션 횟수
    simulation_days (int): 시뮬레이션할 일수
    
    Returns:
    tuple: (시뮬레이션 결과 데이터프레임, 마지막 예측 가격 리스트)
    """
    # 한글 폰트 설정 (그래프에서 한글 깨짐 방지)
    path = "c:/Windows/Fonts/malgun.ttf"  # Windows 기준 '맑은 고딕' 폰트 경로
    font_name = fm.FontProperties(fname=path).get_name()
    rc('font', family=font_name)

    # 데이터 조회 기간 설정
    today = date.today()
    startD = today - relativedelta(months=months_back)
    endD = today

    # 주가 정보 다운로드
    stock_data = yf.download(stock_ticker, startD, endD)

    # 일간 수익률 계산 (종가 기준)
    returns = stock_data['Close'].pct_change()

    # 일간 수익률의 표준편차 = 변동성
    daily_vol = returns.std()

    df = pd.DataFrame()      # 시뮬레이션 결과 저장용 데이터프레임
    last_price = stock_data['Close'].iloc[-1]  # 마지막 종가
    last_price_list = []     # 마지막 예측 가격 저장 리스트

    # 시뮬레이션 시작
    for x in range(num_simulations):
        T = simulation_days  # 시뮬레이션 일수
        count = 0
        price_list = []

        # 첫 날 가격 = 마지막 종가 * 무작위 수익률 반영
        price = last_price * (1 + np.random.normal(0, daily_vol))
        price_list.append(price)

        # T일 동안 가격 시뮬레이션
        for y in range(T):
            price = price_list[count] * (1 + np.random.normal(0, daily_vol))
            price_list.append(price)
            count += 1

        # 시뮬레이션 결과를 데이터프레임에 저장
        df[x] = price_list
        last_price_list.append(price_list[-1])

    # 시각화
    plt.figure(figsize=(12, 8))
    plt.plot(df)
    plt.title(f'{stock_name} 몬테카를로 시뮬레이션 ({num_simulations:,}회)')
    plt.xlabel('일수')
    plt.ylabel('주가')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.tight_layout()
    plt.show()

    return df, last_price_list

df, last_price_list = monte_carlo_simulation()
# --- JSON 변환 및 저장 ---
# df: 각 컬럼이 시뮬레이션, 인덱스가 날짜(0~N)
json_list = []
for idx, row in df.iterrows():
    entry = {"date": int(idx)}
    for i, val in enumerate(row):
        entry[f"sim{i+1}"] = float(val)
    json_list.append(entry)

with open("montecarlotest/monte_result.json", "w", encoding="utf-8") as f:
    json.dump(json_list, f, ensure_ascii=False, indent=2)

print("JSON 파일로 저장 완료: montecarlotest/monte_result.json")

#last_price_list를 json 파일로 저장
with open("montecarlotest/last_price_list.json", "w", encoding="utf-8") as f:
    # Series라면 tolist(), 리스트 내부에 Series가 있으면 float로 변환
    if hasattr(last_price_list, 'tolist'):
        serializable_list = [float(x) for x in last_price_list.tolist()]
    else:
        serializable_list = [float(x) for x in last_price_list]
    json.dump(serializable_list, f, ensure_ascii=False, indent=2)
print("JSON 파일로 저장 완료: montecarlotest/last_price_list.json")