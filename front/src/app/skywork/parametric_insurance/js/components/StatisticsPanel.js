// 통계 패널 컴포넌트

/**
 * 시뮬레이션 결과 통계를 표시하는 클래스
 */
export class StatisticsPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isVisible = false;
        this.animationDuration = 600;
    }

    /**
     * 통계 데이터 표시
     * @param {Object} results - 시뮬레이션 결과
     */
    displayStatistics(results) {
        if (!this.container) {
            console.error('통계 패널 컨테이너를 찾을 수 없습니다.');
            return;
        }

        // 통계 계산
        const stats = this.calculateStatistics(results);
        
        // UI 업데이트
        this.updateStatisticsUI(stats);
        
        // 패널 표시
        this.show();
        
        // 애니메이션 효과
        this.animateStatCards();
    }

    /**
     * 통계 계산
     * @param {Object} results - 시뮬레이션 결과
     * @returns {Object} 계산된 통계
     */
    calculateStatistics(results) {
        const { finalPrices, payouts, riskMetrics } = results;
        
        // 기본 통계
        const avgFinalPrice = this.calculateMean(finalPrices);
        const payoutCount = payouts.filter(p => p > 0).length;
        const payoutProbability = (payoutCount / payouts.length) * 100;
        const avgPayout = this.calculateMean(payouts);
        
        // 추가 통계
        const medianPrice = this.calculateMedian(finalPrices);
        const priceStdDev = this.calculateStandardDeviation(finalPrices);
        const maxPrice = Math.max(...finalPrices);
        const minPrice = Math.min(...finalPrices);
        
        // 수익률 통계
        const initialPrice = results.parameters?.initialPrice || 100000;
        const returns = finalPrices.map(price => ((price - initialPrice) / initialPrice) * 100);
        const avgReturn = this.calculateMean(returns);
        const returnStdDev = this.calculateStandardDeviation(returns);
        const positiveReturns = returns.filter(r => r > 0).length;
        const positiveReturnProbability = (positiveReturns / returns.length) * 100;
        
        // 보험 효과성 분석
        const insuranceEffectiveness = this.calculateInsuranceEffectiveness(results);
        
        return {
            avgFinalPrice,
            medianPrice,
            priceStdDev,
            maxPrice,
            minPrice,
            payoutProbability,
            avgPayout,
            payoutCount,
            avgReturn,
            returnStdDev,
            positiveReturnProbability,
            riskMetrics,
            insuranceEffectiveness
        };
    }

    /**
     * 보험 효과성 계산
     * @param {Object} results - 시뮬레이션 결과
     * @returns {Object} 보험 효과성 지표
     */
    calculateInsuranceEffectiveness(results) {
        const { finalPrices, payouts, parameters } = results;
        const initialPrice = parameters?.initialPrice || 100000;
        const premiumRate = parameters?.insurancePremium || 0.6;
        const premium = initialPrice * (premiumRate / 100);
        
        // 순 손익 계산 (보험금 - 보험료)
        const netPayoffs = payouts.map(payout => payout - premium);
        const avgNetPayoff = this.calculateMean(netPayoffs);
        
        // 보험 없이의 손실과 보험 있을 때의 순손실 비교
        const lossesWithoutInsurance = finalPrices.map(price => Math.max(0, initialPrice - price));
        const lossesWithInsurance = finalPrices.map((price, i) => Math.max(0, initialPrice - price) - netPayoffs[i]);
        
        const avgLossWithoutInsurance = this.calculateMean(lossesWithoutInsurance);
        const avgLossWithInsurance = this.calculateMean(lossesWithInsurance);
        const lossReduction = ((avgLossWithoutInsurance - avgLossWithInsurance) / avgLossWithoutInsurance) * 100;
        
        // 보험료 대비 보험금 비율
        const totalPremiums = premium * payouts.length;
        const totalPayouts = payouts.reduce((sum, payout) => sum + payout, 0);
        const lossRatio = (totalPayouts / totalPremiums) * 100;
        
        return {
            avgNetPayoff,
            lossReduction: isNaN(lossReduction) ? 0 : lossReduction,
            lossRatio,
            premium
        };
    }

    /**
     * 통계 UI 업데이트
     * @param {Object} stats - 계산된 통계
     */
    updateStatisticsUI(stats) {
        // 기본 통계 카드 업데이트
        this.updateElement('avg-final-price', this.formatCurrency(stats.avgFinalPrice));
        this.updateElement('payout-probability', `${stats.payoutProbability.toFixed(1)}%`);
        this.updateElement('avg-payout', this.formatCurrency(stats.avgPayout));
        this.updateElement('var-95', this.formatCurrency(Math.abs(stats.riskMetrics.var95)));

        // 추가 통계 정보 표시
        this.displayDetailedStatistics(stats);
    }

    /**
     * 상세 통계 표시
     * @param {Object} stats - 계산된 통계
     */
    displayDetailedStatistics(stats) {
        // 기존 상세 통계 패널이 있다면 제거
        const existingPanel = document.getElementById('detailed-statistics');
        if (existingPanel) {
            existingPanel.remove();
        }

        // 상세 통계 패널 생성
        const detailedPanel = document.createElement('div');
        detailedPanel.id = 'detailed-statistics';
        detailedPanel.className = 'bg-dark-surface rounded-xl shadow-2xl border border-dark-border p-6 mt-8 fade-in';
        
        detailedPanel.innerHTML = `
            <h3 class="text-xl font-semibold mb-6 text-text-primary flex items-center">
                <svg class="w-6 h-6 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                상세 통계 분석
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- 주가 통계 -->
                <div class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-blue-400 mb-3">주가 분석</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-text-secondary">평균 주가:</span>
                            <span class="text-text-primary font-medium">${this.formatCurrency(stats.avgFinalPrice)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">중간값:</span>
                            <span class="text-text-primary font-medium">${this.formatCurrency(stats.medianPrice)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">표준편차:</span>
                            <span class="text-text-primary font-medium">${this.formatCurrency(stats.priceStdDev)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">최고가:</span>
                            <span class="text-green-400 font-medium">${this.formatCurrency(stats.maxPrice)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">최저가:</span>
                            <span class="text-red-400 font-medium">${this.formatCurrency(stats.minPrice)}</span>
                        </div>
                    </div>
                </div>

                <!-- 수익률 통계 -->
                <div class="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-green-400 mb-3">수익률 분석</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-text-secondary">평균 수익률:</span>
                            <span class="text-text-primary font-medium">${stats.avgReturn.toFixed(2)}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">수익률 변동성:</span>
                            <span class="text-text-primary font-medium">${stats.returnStdDev.toFixed(2)}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">양의 수익률 확률:</span>
                            <span class="text-green-400 font-medium">${stats.positiveReturnProbability.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <!-- 보험 효과성 -->
                <div class="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-orange-400 mb-3">보험 효과성</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-text-secondary">보험료:</span>
                            <span class="text-text-primary font-medium">${this.formatCurrency(stats.insuranceEffectiveness.premium)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">평균 순손익:</span>
                            <span class="text-text-primary font-medium">${this.formatCurrency(stats.insuranceEffectiveness.avgNetPayoff)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">손실 감소율:</span>
                            <span class="text-green-400 font-medium">${stats.insuranceEffectiveness.lossReduction.toFixed(1)}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-text-secondary">손해율:</span>
                            <span class="text-text-primary font-medium">${stats.insuranceEffectiveness.lossRatio.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                <!-- 리스크 지표 -->
                <div class="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-lg p-4 md:col-span-2 lg:col-span-3">
                    <h4 class="text-lg font-semibold text-red-400 mb-3">리스크 지표</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-text-secondary mb-1">VaR 95%</div>
                            <div class="text-red-400 font-bold text-lg">${this.formatCurrency(Math.abs(stats.riskMetrics.var95))}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-text-secondary mb-1">VaR 99%</div>
                            <div class="text-red-400 font-bold text-lg">${this.formatCurrency(Math.abs(stats.riskMetrics.var99))}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-text-secondary mb-1">CVaR 95%</div>
                            <div class="text-red-400 font-bold text-lg">${this.formatCurrency(Math.abs(stats.riskMetrics.cvar95))}</div>
                        </div>
                        <div class="text-center">
                            <div class="text-text-secondary mb-1">CVaR 99%</div>
                            <div class="text-red-400 font-bold text-lg">${this.formatCurrency(Math.abs(stats.riskMetrics.cvar99))}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 해석 및 권장사항 -->
            <div class="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 class="text-lg font-semibold text-purple-400 mb-3 flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    분석 결과 해석
                </h4>
                <div class="text-sm text-text-secondary leading-relaxed">
                    ${this.generateInsights(stats)}
                </div>
            </div>
        `;

        // 통계 패널 다음에 추가
        this.container.parentNode.insertBefore(detailedPanel, this.container.nextSibling);
    }

    /**
     * 분석 결과 해석 생성
     * @param {Object} stats - 계산된 통계
     * @returns {string} 해석 텍스트
     */
    generateInsights(stats) {
        const insights = [];

        // 수익률 분석
        if (stats.avgReturn > 0) {
            insights.push(`평균 수익률이 ${stats.avgReturn.toFixed(2)}%로 양수를 기록했습니다.`);
        } else {
            insights.push(`평균 수익률이 ${stats.avgReturn.toFixed(2)}%로 음수를 기록했습니다.`);
        }

        // 보험금 지급 확률 분석
        if (stats.payoutProbability > 20) {
            insights.push(`보험금 지급 확률이 ${stats.payoutProbability.toFixed(1)}%로 상당히 높습니다.`);
        } else if (stats.payoutProbability > 10) {
            insights.push(`보험금 지급 확률이 ${stats.payoutProbability.toFixed(1)}%로 적정 수준입니다.`);
        } else {
            insights.push(`보험금 지급 확률이 ${stats.payoutProbability.toFixed(1)}%로 낮은 편입니다.`);
        }

        // 보험 효과성 분석
        if (stats.insuranceEffectiveness.lossReduction > 10) {
            insights.push(`보험을 통해 손실이 ${stats.insuranceEffectiveness.lossReduction.toFixed(1)}% 감소하여 효과적입니다.`);
        } else if (stats.insuranceEffectiveness.lossReduction > 0) {
            insights.push(`보험을 통한 손실 감소 효과가 ${stats.insuranceEffectiveness.lossReduction.toFixed(1)}%로 제한적입니다.`);
        } else {
            insights.push(`현재 조건에서는 보험의 손실 감소 효과가 미미합니다.`);
        }

        // 손해율 분석
        if (stats.insuranceEffectiveness.lossRatio > 100) {
            insights.push(`손해율이 ${stats.insuranceEffectiveness.lossRatio.toFixed(1)}%로 보험사 관점에서 손실이 예상됩니다.`);
        } else {
            insights.push(`손해율이 ${stats.insuranceEffectiveness.lossRatio.toFixed(1)}%로 보험사에게 유리한 조건입니다.`);
        }

        return insights.join(' ');
    }

    /**
     * 통계 카드 애니메이션
     */
    animateStatCards() {
        const statCards = this.container.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * 패널 표시
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
            this.container.classList.add('fade-in');
            this.isVisible = true;
        }
    }

    /**
     * 패널 숨김
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            this.container.classList.remove('fade-in');
            this.isVisible = false;
        }

        // 상세 통계 패널도 숨김
        const detailedPanel = document.getElementById('detailed-statistics');
        if (detailedPanel) {
            detailedPanel.remove();
        }
    }

    /**
     * 요소 업데이트
     * @param {string} elementId - 요소 ID
     * @param {string} value - 새 값
     */
    updateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            // 카운트업 애니메이션 효과
            this.animateValue(element, element.textContent, value);
        }
    }

    /**
     * 값 애니메이션
     * @param {HTMLElement} element - 대상 요소
     * @param {string} start - 시작 값
     * @param {string} end - 종료 값
     */
    animateValue(element, start, end) {
        // 숫자가 포함된 경우에만 애니메이션 적용
        const startNum = parseFloat(start.replace(/[^\d.-]/g, '')) || 0;
        const endNum = parseFloat(end.replace(/[^\d.-]/g, '')) || 0;
        
        if (startNum === endNum) {
            element.textContent = end;
            return;
        }

        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 이징 함수 적용
            const easeProgress = this.easeOutCubic(progress);
            const currentNum = startNum + (endNum - startNum) * easeProgress;
            
            // 원래 형식 유지하면서 숫자만 업데이트
            const currentValue = end.replace(/[\d.-]+/, currentNum.toFixed(0));
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end;
            }
        };
        
        requestAnimationFrame(animate);
    }

    /**
     * 이징 함수
     * @param {number} t - 진행률 (0-1)
     * @returns {number} 이징된 값
     */
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * 평균 계산
     * @param {Array} values - 값 배열
     * @returns {number} 평균값
     */
    calculateMean(values) {
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }

    /**
     * 중간값 계산
     * @param {Array} values - 값 배열
     * @returns {number} 중간값
     */
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
    }

    /**
     * 표준편차 계산
     * @param {Array} values - 값 배열
     * @returns {number} 표준편차
     */
    calculateStandardDeviation(values) {
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = this.calculateMean(squaredDiffs);
        return Math.sqrt(variance);
    }

    /**
     * 통화 형식 포맷팅
     * @param {number} value - 값
     * @returns {string} 포맷된 문자열
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    /**
     * 백분율 형식 포맷팅
     * @param {number} value - 값 (0-100)
     * @returns {string} 포맷된 문자열
     */
    formatPercentage(value) {
        return `${value.toFixed(1)}%`;
    }
}