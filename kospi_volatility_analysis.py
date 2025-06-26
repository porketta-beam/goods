#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
코스피200 기업 변동성 분석
각 기업의 1년, 3년, 5년, 10년 변동성을 계산합니다.
"""

import yfinance as yf
import pandas as pd
import numpy as np
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import time
import warnings
warnings.filterwarnings('ignore')

def load_company_data():
    """
    코스피 상장법인 목록과 CORPCODE.xml을 로드하여 병합합니다.
    """
    print("📂 기업 데이터 로딩 중...")
    
    # 코스피 상장법인 목록 불러오기
    df_kospi = pd.read_csv("data/상장법인목록.csv", encoding="cp949")[["회사명", "종목코드"]]
    df_kospi.columns = ["corp_name", "stock_code"]
    df_kospi["stock_code"] = df_kospi["stock_code"].astype(str).str.zfill(6)
    
    # CORPCODE.xml 파싱
    tree = ET.parse("data/corpcode_data/CORPCODE.xml")
    root = tree.getroot()
    
    # corp_code 정보 추출
    corp_info = []
    for child in root:
        corp_code = child.findtext("corp_code")
        corp_name = child.findtext("corp_name")
        stock_code = child.findtext("stock_code")
        if stock_code:  # stock_code가 있는 경우만 추가
            corp_info.append({
                "corp_name": corp_name, 
                "corp_code": corp_code, 
                "stock_code": stock_code.zfill(6)
            })
    
    df_corp_code = pd.DataFrame(corp_info)
    
    # 코스피 기업과 corp_code 매핑
    df_merged = pd.merge(df_kospi, df_corp_code, on="stock_code", how="inner")
    df_merged = df_merged[["corp_name_x", "stock_code", "corp_code"]]
    df_merged.columns = ["corp_name", "stock_code", "corp_code"]
    
    print(f"✅ 총 {len(df_merged)}개 기업 데이터 로드 완료")
    return df_merged

def to_yf_ticker(stock_code):
    """
    한국 주식 코드를 yfinance 티커로 변환합니다.
    """
    return f"{str(stock_code).zfill(6)}.KS"

def calculate_volatility(ticker, years):
    """
    특정 종목의 지정된 기간 변동성을 계산합니다.
    
    Args:
        ticker (str): yfinance 티커 (예: '005930.KS')
        years (int): 계산할 연도 수
    
    Returns:
        float: 연간 변동성 (표준편차 * sqrt(252))
    """
    try:
        # 날짜 설정
        end_date = datetime.now()
        start_date = end_date - timedelta(days=years * 365)
        
        # 주가 데이터 다운로드
        stock_data = yf.download(
            ticker, 
            start=start_date.strftime('%Y-%m-%d'), 
            end=end_date.strftime('%Y-%m-%d'), 
            progress=False
        )
        
        if stock_data.empty:
            return np.nan
        
        # 종가 데이터 추출
        close_prices = stock_data['Close']
        
        # 결측값 처리
        close_prices = close_prices.ffill().bfill()
        
        # 최소 30일 이상의 데이터가 있어야 함
        if len(close_prices) < 30:
            return np.nan
        
        # 로그 수익률 계산
        log_returns = np.log(close_prices / close_prices.shift(1)).dropna()
        
        # 변동성 계산 (연간화)
        volatility = log_returns.std() * np.sqrt(252)
        
        return volatility
        
    except Exception as e:
        return np.nan

def calculate_all_volatilities(df):
    """
    모든 기업의 1년, 3년, 5년, 10년 변동성을 계산합니다.
    """
    # 결과 저장용 컬럼 초기화
    df['vol_1y'] = np.nan
    df['vol_3y'] = np.nan
    df['vol_5y'] = np.nan
    df['vol_10y'] = np.nan
    
    # 실패한 종목 추적
    failed_tickers = []
    successful_count = 0
    
    total_companies = len(df)
    
    print(f"📊 총 {total_companies}개 기업의 변동성을 계산합니다...")
    print("=" * 60)
    
    for idx, row in df.iterrows():
        corp_name = row['corp_name']
        stock_code = row['stock_code']
        ticker = to_yf_ticker(stock_code)
        
        print(f"처리 중: {corp_name} ({ticker}) - {idx+1}/{total_companies}")
        
        # 각 기간별 변동성 계산
        periods = [1, 3, 5, 10]
        columns = ['vol_1y', 'vol_3y', 'vol_5y', 'vol_10y']
        
        success = False
        for period, col in zip(periods, columns):
            vol = calculate_volatility(ticker, period)
            df.at[idx, col] = vol
            if not np.isnan(vol):
                success = True
        
        if success:
            successful_count += 1
        else:
            failed_tickers.append((corp_name, ticker))
        
        # 진행률 표시
        if (idx + 1) % 10 == 0:
            progress = (idx + 1) / total_companies * 100
            print(f"진행률: {progress:.1f}% ({idx+1}/{total_companies})")
        
        # API 호출 제한 방지
        time.sleep(0.5)
    
    print("=" * 60)
    print(f"✅ 변동성 계산 완료!")
    print(f"성공: {successful_count}개 기업")
    print(f"실패: {len(failed_tickers)}개 기업")
    
    if failed_tickers:
        print("\n❌ 실패한 종목 목록:")
        for name, ticker in failed_tickers[:10]:  # 처음 10개만 표시
            print(f"  - {name} ({ticker})")
        if len(failed_tickers) > 10:
            print(f"  ... 외 {len(failed_tickers) - 10}개")
    
    return df

def analyze_results(df):
    """
    변동성 계산 결과를 분석하고 출력합니다.
    """
    print("\n📊 변동성 계산 결과 분석")
    print("=" * 60)
    
    # 기본 통계
    volatility_columns = ['vol_1y', 'vol_3y', 'vol_5y', 'vol_10y']
    print("\n📈 변동성 통계 요약:")
    for col in volatility_columns:
        valid_data = df[col].dropna()
        if len(valid_data) > 0:
            print(f"{col}:")
            print(f"  - 평균: {valid_data.mean():.4f}")
            print(f"  - 중앙값: {valid_data.median():.4f}")
            print(f"  - 최소값: {valid_data.min():.4f}")
            print(f"  - 최대값: {valid_data.max():.4f}")
            print(f"  - 유효 데이터 수: {len(valid_data)}개")
            print()
    
    # 결과 미리보기
    print("\n🔍 변동성 결과 샘플 (상위 10개):")
    result_columns = ['corp_name', 'stock_code'] + volatility_columns
    print(df[result_columns].head(10).to_string(index=False))
    
    # 변동성이 높은 기업 TOP 10 (1년 기준)
    print("\n🔥 1년 변동성 TOP 10 (높은 순):")
    high_vol_1y = df.nlargest(10, 'vol_1y')[['corp_name', 'vol_1y']]
    print(high_vol_1y.to_string(index=False))
    
    # 변동성이 낮은 기업 TOP 10 (1년 기준)
    print("\n❄️ 1년 변동성 TOP 10 (낮은 순):")
    low_vol_1y = df.nsmallest(10, 'vol_1y')[['corp_name', 'vol_1y']]
    print(low_vol_1y.to_string(index=False))

def save_results(df):
    """
    결과를 CSV 파일로 저장합니다.
    """
    output_filename = f"kospi_volatility_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    df.to_csv(output_filename, index=False, encoding='utf-8-sig')
    print(f"\n💾 결과가 '{output_filename}' 파일로 저장되었습니다.")
    
    # 최종 결과 확인
    print(f"\n📋 최종 데이터 형태: {df.shape}")
    print(f"컬럼: {list(df.columns)}")
    
    # 변동성 데이터가 있는 기업 수
    volatility_columns = ['vol_1y', 'vol_3y', 'vol_5y', 'vol_10y']
    for col in volatility_columns:
        valid_count = df[col].notna().sum()
        print(f"{col} 데이터 보유 기업: {valid_count}개")

def main():
    """
    메인 실행 함수
    """
    print("🚀 코스피200 기업 변동성 분석 시작")
    print("=" * 60)
    
    # 1. 데이터 로드
    df = load_company_data()
    
    # 2. 변동성 계산
    df_with_volatility = calculate_all_volatilities(df.copy())
    
    # 3. 결과 분석
    analyze_results(df_with_volatility)
    
    # 4. 결과 저장
    save_results(df_with_volatility)
    
    print("\n🎉 모든 작업이 완료되었습니다!")

if __name__ == "__main__":
    main() 