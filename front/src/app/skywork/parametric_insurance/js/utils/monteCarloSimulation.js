// 개선된 몬테카를로 시뮬레이션 핵심 로직

import { 
    generateNormalRandom, 
    calculateMean, 
    calculateStandardDeviation,
    calculateVaR,
    calculateExpectedShortfall,
    calculateSharpeRatio
} from './mathUtils.js';

/**
 * 시뮬레이션 파라미터 인터페이스
 * @typedef {Object} SimulationParameters
 * @property {number} initialPrice - 초기 주가
 * @property {number} volatility - 변동성 (%)
 * @property {number} drift - 드리프트 (%)
 * @property {number} timeHorizon - 시뮬레이션 기간 (일)
 * @property {number} numSimulations - 시뮬레이션 횟수
 * @property {number} triggerThreshold - 트리거 임계값 (%)
 * @property {number} insurancePremium - 보험료율 (%)
 * @property {number} payoutAmount - 보험금 지급액
 */

/**
 * 시뮬레이션 결과 인터페이스
 * @typedef {Object} SimulationResult
 * @property {number[]} finalPrices - 최종 주가 배열
 * @property {number[]} payouts - 보험금 지급 배열
 * @property {number[][]} pricePaths - 주가 경로 배열 (샘플)
 * @property {number} totalPayout - 총 보험금 지급액
 * @property {number} averagePayout - 평균 보험금
 * @property {number} payoutProbability - 보험금 지급 확률
 * @property {number} expectedLoss - 예상 손실
 * @property {Object} riskMetrics - 리스크 지표
 * @property {Object} statistics - 통계 정보
 */

/**
 * 단일 주가 경로 시뮬레이션 (기하 브라운 운동)
 * @param {SimulationParameters} params - 시뮬레이션 파라미터
 * @returns {number[]} 주가 경로
 */
export function simulatePricePath(params) {
    const { initialPrice, volatility, drift, timeHorizon } = params;
    const dt = 1 / 252; // 일일 시간 단위 (1년 = 252 거래일)
    const volDaily = volatility / 100 / Math.sqrt(252); // 일일 변동성
    const driftDaily = drift / 100 / 252; // 일일 드리프트
    
    const path = [initialPrice];
    let currentPrice = initialPrice;
    
    try {
        for (let i = 1; i <= timeHorizon; i++) {
            const randomShock = generateNormalRandom();
            const priceChange = currentPrice * (driftDaily * dt + volDaily * Math.sqrt(dt) * randomShock);
            currentPrice = Math.max(currentPrice + priceChange, 0.01); // 주가는 0보다 커야 함
            
            // 비정상적인 값 체크
            if (!isFinite(currentPrice) || currentPrice <= 0) {
                throw new Error(`Invalid price value: ${currentPrice} at day ${i}`);
            }
            
            path.push(currentPrice);
        }
    } catch (error) {
        console.error('Price path simulation error:', error);
        throw new Error(`주가 경로 시뮬레이션 오류: ${error.message}`);
    }
    
    return path;
}

/**
 * 점프 확산 모델을 사용한 주가 경로 시뮬레이션
 * @param {SimulationParameters} params - 시뮬레이션 파라미터
 * @param {number} jumpIntensity - 점프 강도 (연간 점프 횟수)
 * @param {number} jumpMean - 점프 크기 평균
 * @param {number} jumpStd - 점프 크기 표준편차
 * @returns {number[]} 주가 경로
 */
export function simulatePricePathWithJumps(params, jumpIntensity = 2, jumpMean = -0.1, jumpStd = 0.05) {
    const { initialPrice, volatility, drift, timeHorizon } = params;
    const dt = 1 / 252;
    const volDaily = volatility / 100 / Math.sqrt(252);
    const driftDaily = drift / 100 / 252;
    const jumpProb = jumpIntensity / 252; // 일일 점프 확률
    
    const path = [initialPrice];
    let currentPrice = initialPrice;
    
    try {
        for (let i = 1; i <= timeHorizon; i++) {
            // 일반적인 브라운 운동
            const randomShock = generateNormalRandom();
            let priceChange = currentPrice * (driftDaily * dt + volDaily * Math.sqrt(dt) * randomShock);
            
            // 점프 이벤트 확인
            if (Math.random() < jumpProb) {
                const jumpSize = jumpMean + jumpStd * generateNormalRandom();
                priceChange += currentPrice * jumpSize;
            }
            
            currentPrice = Math.max(currentPrice + priceChange, 0.01);
            
            // 비정상적인 값 체크
            if (!isFinite(currentPrice) || currentPrice <= 0) {
                throw new Error(`Invalid price value: ${currentPrice} at day ${i}`);
            }
            
            path.push(currentPrice);
        }
    } catch (error) {
        console.error('Jump diffusion simulation error:', error);
        throw new Error(`점프 확산 시뮬레이션 오류: ${error.message}`);
    }
    
    return path;
}

/**
 * 보험금 계산
 * @param {number} finalPrice - 최종 주가
 * @param {number} initialPrice - 초기 주가
 * @param {SimulationParameters} params - 시뮬레이션 파라미터
 * @returns {number} 보험금 지급액
 */
export function calculatePayout(finalPrice, initialPrice, params) {
    try {
        const { triggerThreshold, payoutAmount } = params;
        const priceDecline = (initialPrice - finalPrice) / initialPrice * 100;
        
        if (priceDecline >= triggerThreshold) {
            return payoutAmount;
        }
        
        return 0;
    } catch (error) {
        console.error('Payout calculation error:', error);
        return 0;
    }
}

/**
 * 리스크 지표 계산
 * @param {number[]} finalPrices - 최종 주가 배열
 * @param {number[]} payouts - 보험금 배열
 * @param {number} initialPrice - 초기 주가
 * @returns {Object} 리스크 지표
 */
export function calculateRiskMetrics(finalPrices, payouts, initialPrice) {
    try {
        // 손실 계산 (초기 투자 대비)
        const losses = finalPrices.map(price => Math.max(initialPrice - price, 0));
        const returns = finalPrices.map(price => (price - initialPrice) / initialPrice);
        
        // 보험 적용 후 순손실
        const netLosses = losses.map((loss, i) => Math.max(loss - payouts[i], 0));
        
        return {
            var95: calculateVaR(losses, 95),
            var99: calculateVaR(losses, 99),
            expectedShortfall95: calculateExpectedShortfall(losses, 95),
            expectedShortfall99: calculateExpectedShortfall(losses, 99),
            sharpeRatio: calculateSharpeRatio(returns),
            maxLoss: Math.max(...losses),
            avgLoss: calculateMean(losses),
            stdLoss: calculateStandardDeviation(losses),
            // 보험 적용 후 지표
            netVar95: calculateVaR(netLosses, 95),
            netVar99: calculateVaR(netLosses, 99),
            netExpectedShortfall95: calculateExpectedShortfall(netLosses, 95),
            netMaxLoss: Math.max(...netLosses),
            netAvgLoss: calculateMean(netLosses)
        };
    } catch (error) {
        console.error('Risk metrics calculation error:', error);
        // 기본값 반환
        return {
            var95: 0, var99: 0, expectedShortfall95: 0, expectedShortfall99: 0,
            sharpeRatio: 0, maxLoss: 0, avgLoss: 0, stdLoss: 0,
            netVar95: 0, netVar99: 0, netExpectedShortfall95: 0,
            netMaxLoss: 0, netAvgLoss: 0
        };
    }
}

/**
 * 배치 처리를 위한 시뮬레이션 실행
 * @param {SimulationParameters} params - 시뮬레이션 파라미터
 * @param {number} batchSize - 배치 크기
 * @param {Function} progressCallback - 진행 상황 콜백
 * @param {AbortSignal} abortSignal - 중단 신호
 * @param {boolean} useJumps - 점프 모델 사용 여부
 * @returns {Promise<Object>} 배치 결과
 */
async function runSimulationBatch(params, batchSize, progressCallback, abortSignal, useJumps = false) {
    const finalPrices = [];
    const payouts = [];
    const samplePaths = [];
    const maxSamplePaths = Math.min(10, batchSize); // 배치당 최대 샘플 경로 수
    
    for (let i = 0; i < batchSize; i++) {
        // 중단 신호 확인
        if (abortSignal && abortSignal.aborted) {
            throw new Error('시뮬레이션이 취소되었습니다.');
        }
        
        try {
            const path = useJumps ? 
                simulatePricePathWithJumps(params) : 
                simulatePricePath(params);
            
            const finalPrice = path[path.length - 1];
            const payout = calculatePayout(finalPrice, params.initialPrice, params);
            
            finalPrices.push(finalPrice);
            payouts.push(payout);
            
            // 샘플 경로 저장 (일부만)
            if (samplePaths.length < maxSamplePaths && i % Math.ceil(batchSize / maxSamplePaths) === 0) {
                samplePaths.push(path);
            }
            
        } catch (error) {
            console.error(`Simulation ${i} in batch failed:`, error);
            // 실패한 시뮬레이션은 건너뛰고 계속 진행
            continue;
        }
        
        // 진행 상황 업데이트 (배치 내에서)
        if (progressCallback && i % Math.ceil(batchSize / 10) === 0) {
            progressCallback((i / batchSize) * 100, `배치 처리 중... (${i}/${batchSize})`);
        }
    }
    
    return { finalPrices, payouts, samplePaths };
}

/**
 * 메모리 사용량 모니터링
 * @returns {Object} 메모리 정보
 */
function getMemoryInfo() {
    if (performance.memory) {
        return {
            used: performance.memory.usedJSHeapSize / (1024 * 1024), // MB
            total: performance.memory.totalJSHeapSize / (1024 * 1024), // MB
            limit: performance.memory.jsHeapSizeLimit / (1024 * 1024) // MB
        };
    }
    return null;
}

/**
 * 몬테카를로 시뮬레이션 실행 (개선된 버전)
 * @param {SimulationParameters} params - 시뮬레이션 파라미터
 * @param {Function} progressCallback - 진행 상황 콜백 함수
 * @param {AbortSignal} abortSignal - 중단 신호
 * @param {boolean} useJumps - 점프 모델 사용 여부
 * @returns {Promise<SimulationResult>} 시뮬레이션 결과
 */
export async function runMonteCarloSimulation(params, progressCallback = null, abortSignal = null, useJumps = false) {
    const startTime = performance.now();
    const { numSimulations, initialPrice, insurancePremium } = params;
    
    try {
        // 메모리 사용량 초기 체크
        const initialMemory = getMemoryInfo();
        if (initialMemory && initialMemory.used > initialMemory.limit * 0.8) {
            throw new Error('메모리 부족: 시뮬레이션을 시작할 수 없습니다.');
        }
        
        const allFinalPrices = [];
        const allPayouts = [];
        const allSamplePaths = [];
        
        // 적응적 배치 크기 결정
        let batchSize = Math.min(1000, numSimulations);
        if (numSimulations > 50000) {
            batchSize = 2000;
        } else if (numSimulations > 10000) {
            batchSize = 1000;
        } else {
            batchSize = Math.min(500, numSimulations);
        }
        
        const numBatches = Math.ceil(numSimulations / batchSize);
        let completedSimulations = 0;
        
        if (progressCallback) {
            progressCallback(0, '시뮬레이션 초기화 중...');
        }
        
        for (let batch = 0; batch < numBatches; batch++) {
            // 중단 신호 확인
            if (abortSignal && abortSignal.aborted) {
                throw new Error('시뮬레이션이 취소되었습니다.');
            }
            
            const currentBatchSize = Math.min(batchSize, numSimulations - completedSimulations);
            
            try {
                // 배치 실행
                const batchResult = await runSimulationBatch(
                    params, 
                    currentBatchSize, 
                    progressCallback, 
                    abortSignal, 
                    useJumps
                );
                
                // 결과 병합
                allFinalPrices.push(...batchResult.finalPrices);
                allPayouts.push(...batchResult.payouts);
                allSamplePaths.push(...batchResult.samplePaths);
                
                completedSimulations += currentBatchSize;
                
                // 전체 진행 상황 업데이트
                if (progressCallback) {
                    const progress = (completedSimulations / numSimulations) * 100;
                    progressCallback(progress, `시뮬레이션 진행 중... (${completedSimulations}/${numSimulations})`);
                }
                
                // 메모리 사용량 체크
                const currentMemory = getMemoryInfo();
                if (currentMemory && currentMemory.used > currentMemory.limit * 0.9) {
                    console.warn('메모리 사용량이 높습니다. 가비지 컬렉션을 유도합니다.');
                    // 강제 가비지 컬렉션 (가능한 경우)
                    if (window.gc) {
                        window.gc();
                    }
                }
                
            } catch (error) {
                console.error(`Batch ${batch} failed:`, error);
                
                // 배치 실패 시 재시도 (최대 3회)
                let retryCount = 0;
                const maxRetries = 3;
                
                while (retryCount < maxRetries) {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
                        
                        const retryResult = await runSimulationBatch(
                            params, 
                            currentBatchSize, 
                            progressCallback, 
                            abortSignal, 
                            useJumps
                        );
                        
                        allFinalPrices.push(...retryResult.finalPrices);
                        allPayouts.push(...retryResult.payouts);
                        allSamplePaths.push(...retryResult.samplePaths);
                        
                        completedSimulations += currentBatchSize;
                        break;
                        
                    } catch (retryError) {
                        retryCount++;
                        console.error(`Batch ${batch} retry ${retryCount} failed:`, retryError);
                        
                        if (retryCount >= maxRetries) {
                            throw new Error(`배치 ${batch} 처리 실패: ${retryError.message}`);
                        }
                    }
                }
            }
            
            // UI 블로킹 방지를 위한 비동기 처리
            if (batch < numBatches - 1) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
        
        if (progressCallback) {
            progressCallback(95, '결과 분석 중...');
        }
        
        // 결과 검증
        if (allFinalPrices.length === 0) {
            throw new Error('시뮬레이션 결과가 없습니다.');
        }
        
        // 결과 계산
        const totalPayout = allPayouts.reduce((sum, payout) => sum + payout, 0);
        const averagePayout = totalPayout / allPayouts.length;
        const payoutCount = allPayouts.filter(payout => payout > 0).length;
        const payoutProbability = payoutCount / allPayouts.length;
        
        const totalPremium = initialPrice * (insurancePremium / 100) * allPayouts.length;
        const expectedLoss = totalPayout - totalPremium;
        
        const riskMetrics = calculateRiskMetrics(allFinalPrices, allPayouts, initialPrice);
        
        // 통계 정보
        const statistics = {
            avgFinalPrice: calculateMean(allFinalPrices),
            stdFinalPrice: calculateStandardDeviation(allFinalPrices),
            minFinalPrice: Math.min(...allFinalPrices),
            maxFinalPrice: Math.max(...allFinalPrices),
            avgReturn: calculateMean(allFinalPrices.map(p => (p - initialPrice) / initialPrice)),
            stdReturn: calculateStandardDeviation(allFinalPrices.map(p => (p - initialPrice) / initialPrice)),
            totalPremium: totalPremium,
            netResult: totalPremium - totalPayout, // 보험사 관점에서의 순이익
            lossRatio: totalPayout / totalPremium, // 손해율
            completedSimulations: allFinalPrices.length,
            executionTime: (performance.now() - startTime) / 1000
        };
        
        if (progressCallback) {
            progressCallback(100, '시뮬레이션 완료');
        }
        
        return {
            finalPrices: allFinalPrices,
            payouts: allPayouts,
            pricePaths: allSamplePaths,
            totalPayout,
            averagePayout,
            payoutProbability,
            expectedLoss,
            riskMetrics,
            statistics
        };
        
    } catch (error) {
        console.error('Monte Carlo simulation error:', error);
        throw new Error(`몬테카를로 시뮬레이션 오류: ${error.message}`);
    }
}

/**
 * 시뮬레이션 파라미터 최적화
 * @param {SimulationParameters} params - 기본 파라미터
 * @returns {SimulationParameters} 최적화된 파라미터
 */
export function optimizeSimulationParameters(params) {
    const optimized = { ...params };
    
    // 메모리 제약에 따른 시뮬레이션 횟수 조정
    const memoryInfo = getMemoryInfo();
    if (memoryInfo) {
        const availableMemory = (memoryInfo.limit - memoryInfo.used) * 0.8; // 80% 사용
        const estimatedMemoryPerSim = params.timeHorizon * 8 + 16; // 바이트
        const maxSimulations = Math.floor(availableMemory * 1024 * 1024 / estimatedMemoryPerSim);
        
        if (params.numSimulations > maxSimulations) {
            console.warn(`메모리 제약으로 시뮬레이션 횟수를 ${maxSimulations}로 조정합니다.`);
            optimized.numSimulations = maxSimulations;
        }
    }
    
    // 성능에 따른 배치 크기 조정
    if (params.numSimulations > 100000) {
        console.warn('대용량 시뮬레이션입니다. 처리 시간이 오래 걸릴 수 있습니다.');
    }
    
    return optimized;
}

/**
 * 시뮬레이션 결과 검증
 * @param {SimulationResult} result - 시뮬레이션 결과
 * @param {SimulationParameters} params - 원본 파라미터
 * @returns {boolean} 검증 결과
 */
export function validateSimulationResult(result, params) {
    try {
        // 기본 검증
        if (!result.finalPrices || result.finalPrices.length === 0) {
            throw new Error('최종 주가 데이터가 없습니다.');
        }
        
        if (!result.payouts || result.payouts.length !== result.finalPrices.length) {
            throw new Error('보험금 데이터가 일치하지 않습니다.');
        }
        
        // 값 범위 검증
        const invalidPrices = result.finalPrices.filter(price => !isFinite(price) || price <= 0);
        if (invalidPrices.length > 0) {
            throw new Error(`유효하지 않은 주가 값이 ${invalidPrices.length}개 발견되었습니다.`);
        }
        
        const invalidPayouts = result.payouts.filter(payout => !isFinite(payout) || payout < 0);
        if (invalidPayouts.length > 0) {
            throw new Error(`유효하지 않은 보험금 값이 ${invalidPayouts.length}개 발견되었습니다.`);
        }
        
        // 통계적 검증
        if (result.payoutProbability < 0 || result.payoutProbability > 1) {
            throw new Error('보험금 지급 확률이 유효하지 않습니다.');
        }
        
        console.log('시뮬레이션 결과 검증 완료');
        return true;
        
    } catch (error) {
        console.error('시뮬레이션 결과 검증 실패:', error);
        return false;
    }
}