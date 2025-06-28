# Monte Carlo simulation의 random walk 모사를 통한 주가 예측 참고 홈피
# Simulating Random Walk of Stock Prices with Monte Carlo Simulation in Python
# https://medium.com/the-handbook-of-coding-in-finance/simulating-random-walk-of-stock-prices-with-monte-carlo-simulation-in-python-6e233d841e


import yfinance as yf
import pandas as pd
# import datetime as dt
from datetime import date
from dateutil.relativedelta import relativedelta

import numpy as np

# 그래프 그리기, 한글 폰트 모듈
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
from matplotlib import rc

def main():
    # 한글 폰트 로딩
    path = "c:/Windows/Fonts/malgun.ttf"
    font_name = fm.FontProperties(fname=path).get_name()
    rc('font', family=font_name)

    today = date.today()
    
    # start = dt.datetime(2011, 1, 1)
    startD = today - relativedelta(months=18)
    endD = today

##    stock_ticker = 'AAPL'
##    stock_name = '애플 (Apple)'    
##    stock_data = yf.download(stock_ticker, startD, endD)
##    print(stock_data)

##    stock_ticker = 'TSLA'
##    stock_name = '테슬라 (Tesla)'    
##    stock_data = yf.download(stock_ticker, startD, endD)
##    print(stock_data)

##    stock_ticker = '005930.KS'
##    stock_name = '삼성전자 (Samsung)'    
##    stock_data = yf.download(stock_ticker, startD, endD)
##    print(stock_data)

    stock_ticker = 'BTC-USD'
    stock_name = '비트코인 (BTC/USD)'    
    stock_data = yf.download(stock_ticker, startD, endD)
    print(stock_data)

    returns = stock_data['Adj Close'].pct_change()
    daily_vol = returns.std()

    NUM_SIMULATIONS =  20
    df = pd.DataFrame()
    last_price = stock_data['Adj Close'][-1]
    last_price_list = []
    for x in range(NUM_SIMULATIONS):
        # T = 252 # for 1 year
        T = 60 # for 3 months
        count = 0
        price_list = []
        price = last_price * (1 + np.random.normal(0, daily_vol))
        price_list.append(price)
        
        for y in range(T):
            if count == 251:
                break
            price = price_list[count]* (1 + np.random.normal(0, daily_vol))
            price_list.append(price)
            count += 1
            
        df[x] = price_list
        last_price_list.append(price_list[-1])

    # 그래프 그리기
    plt.figure(figsize=(12,8))
    
    figL = plt.subplot2grid((1,12), (0,0), rowspan=1, colspan=7)
    figR = plt.subplot2grid((1,12), (0,8), rowspan=1, colspan=4)
            
    # fig.suptitle("Monte Carlo Simulation: " + stock_name)
    figL.plot(df)
    figL.set_title('Predicted stock price of '+stock_name+', Now: ' \
                    +str(round(last_price,2)), fontsize=14)
    figL.set_xlabel('Day from '+today.strftime('%Y-%m-%d').replace('-','/'), fontsize=12)
    figL.set_ylabel('Price (USD or KRW)', fontsize=12)

    figR.hist(last_price_list, bins=40, orientation='horizontal')
    figR.axhline(np.percentile(last_price_list,10), color='r', linestyle='dashed', linewidth=1)
    figR.axhline(np.percentile(last_price_list,90), color='r', linestyle='dashed', linewidth=1)

    # 평균값, 하위 10%, 상위 10%값 표시
    str_mean = str(round(np.mean(last_price_list), 2))
##    figR.text(10, max(last_price_list), str_mean, \
##                 fontsize=10, color='b')    
    figR.set_title('Histogram mean: ' + str_mean, fontsize=14)
    figR.set_xlabel('발생빈도 (Probability)', fontsize=12)
    figR.set_ylabel('Price (USD)', fontsize=12)
    plt.show()


# main 함수 로딩부
if __name__ == '__main__':
    main()
