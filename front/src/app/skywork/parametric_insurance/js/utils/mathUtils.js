// 수학 유틸리티 함수들

/**
 * Box-Muller 변환을 사용한 정규분포 난수 생성
 * @returns {number} 표준정규분포 난수
 */
export function generateNormalRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // 0 방지
    while(v === 0) v = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z0;
}

/**
 * 배열의 평균 계산
 * @param {number[]} data - 데이터 배열
 * @returns {number} 평균값
 */
export function calculateMean(data) {
    if (data.length === 0) return 0;
    return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/**
 * 배열의 표준편차 계산
 * @param {number[]} data - 데이터 배열
 * @returns {number} 표준편차
 */
export function calculateStandardDeviation(data) {
    if (data.length === 0) return 0;
    
    const mean = calculateMean(data);
    const squaredDifferences = data.map(value => Math.pow(value - mean, 2));
    const variance = calculateMean(squaredDifferences);
    
    return Math.sqrt(variance);
}

/**
 * 배열의 백분위수 계산
 * @param {number[]} data - 정렬된 데이터 배열
 * @param {number} percentile - 백분위수 (0-100)
 * @returns {number} 백분위수 값
 */
export function calculatePercentile(data, percentile) {
    if (data.length === 0) return 0;
    
    const sortedData = [...data].sort((a, b) => a - b);
    const index = (percentile / 100) * (sortedData.length - 1);
    
    if (Number.isInteger(index)) {
        return sortedData[index];
    } else {
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        
        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    }
}

/**
 * Value at Risk (VaR) 계산
 * @param {number[]} data - 손실 데이터 배열
 * @param {number} confidence - 신뢰수준 (0-100)
 * @returns {number} VaR 값
 */
export function calculateVaR(data, confidence) {
    return calculatePercentile(data, 100 - confidence);
}

/**
 * Expected Shortfall (조건부 기댓값) 계산
 * @param {number[]} data - 손실 데이터 배열
 * @param {number} confidence - 신뢰수준 (0-100)
 * @returns {number} Expected Shortfall 값
 */
export function calculateExpectedShortfall(data, confidence) {
    const sortedData = [...data].sort((a, b) => b - a); // 내림차순 정렬
    const varIndex = Math.floor((1 - confidence / 100) * sortedData.length);
    
    if (varIndex === 0) return sortedData[0];
    
    const tailData = sortedData.slice(0, varIndex);
    return calculateMean(tailData);
}

/**
 * 샤프 비율 계산
 * @param {number[]} returns - 수익률 배열
 * @param {number} riskFreeRate - 무위험 수익률 (연율)
 * @returns {number} 샤프 비율
 */
export function calculateSharpeRatio(returns, riskFreeRate = 0.02) {
    const meanReturn = calculateMean(returns);
    const stdReturn = calculateStandardDeviation(returns);
    
    if (stdReturn === 0) return 0;
    
    return (meanReturn - riskFreeRate) / stdReturn;
}

/**
 * 최대 손실 계산
 * @param {number[]} data - 데이터 배열
 * @returns {number} 최대 손실
 */
export function calculateMaxLoss(data) {
    if (data.length === 0) return 0;
    return Math.max(...data);
}

/**
 * 최소 손실 계산
 * @param {number[]} data - 데이터 배열
 * @returns {number} 최소 손실
 */
export function calculateMinLoss(data) {
    if (data.length === 0) return 0;
    return Math.min(...data);
}

/**
 * 히스토그램 데이터 생성
 * @param {number[]} data - 데이터 배열
 * @param {number} bins - 구간 수
 * @returns {Object} 히스토그램 데이터
 */
export function createHistogramData(data, bins = 50) {
    if (data.length === 0) return { labels: [], counts: [] };
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;
    
    const labels = [];
    const counts = new Array(bins).fill(0);
    
    // 구간 라벨 생성
    for (let i = 0; i < bins; i++) {
        const binStart = min + i * binWidth;
        const binEnd = min + (i + 1) * binWidth;
        labels.push(`${binStart.toFixed(0)}-${binEnd.toFixed(0)}`);
    }
    
    // 데이터 분류
    data.forEach(value => {
        let binIndex = Math.floor((value - min) / binWidth);
        if (binIndex >= bins) binIndex = bins - 1; // 최대값 처리
        if (binIndex < 0) binIndex = 0; // 최소값 처리
        counts[binIndex]++;
    });
    
    return { labels, counts };
}

/**
 * 누적분포함수 계산
 * @param {number[]} data - 정렬된 데이터 배열
 * @returns {Object} CDF 데이터
 */
export function calculateCDF(data) {
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;
    
    const values = [];
    const probabilities = [];
    
    for (let i = 0; i < n; i++) {
        values.push(sortedData[i]);
        probabilities.push((i + 1) / n);
    }
    
    return { values, probabilities };
}

/**
 * 상관계수 계산
 * @param {number[]} x - 첫 번째 데이터 배열
 * @param {number[]} y - 두 번째 데이터 배열
 * @returns {number} 상관계수
 */
export function calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = calculateMean(x);
    const meanY = calculateMean(y);
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < x.length; i++) {
        const deltaX = x[i] - meanX;
        const deltaY = y[i] - meanY;
        
        numerator += deltaX * deltaY;
        sumXSquared += deltaX * deltaX;
        sumYSquared += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    
    return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * 숫자를 한국 원화 형식으로 포맷
 * @param {number} value - 숫자 값
 * @returns {string} 포맷된 문자열
 */
export function formatCurrency(value) {
    return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * 숫자를 백분율 형식으로 포맷
 * @param {number} value - 숫자 값 (0-1)
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} 포맷된 문자열
 */
export function formatPercentage(value, decimals = 2) {
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * 큰 숫자를 축약 형식으로 포맷 (예: 1,000,000 -> 1M)
 * @param {number} value - 숫자 값
 * @returns {string} 포맷된 문자열
 */
export function formatLargeNumber(value) {
    if (value >= 1e9) {
        return (value / 1e9).toFixed(1) + 'B';
    } else if (value >= 1e6) {
        return (value / 1e6).toFixed(1) + 'M';
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(1) + 'K';
    } else {
        return value.toLocaleString('ko-KR');
    }
}