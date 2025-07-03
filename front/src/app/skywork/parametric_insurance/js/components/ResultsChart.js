/* eslint-env browser */
/* global Chart */

// 개선된 결과 차트 컴포넌트

import { CanvasManager } from '../utils/canvasManager.js';
import { ErrorHandler } from '../utils/errorHandler.js';

/**
 * 결과 차트를 관리하는 개선된 클래스
 */
export class ResultsChart {
    constructor() {
        this.charts = new Map();
        this.canvasManager = new CanvasManager();
        this.errorHandler = new ErrorHandler();
        this.renderQueue = [];
        this.isRendering = false;
        this.darkModeColors = {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4',
            background: '#1a1f2e',
            surface: '#252b3a',
            text: '#e2e8f0',
            textSecondary: '#94a3b8',
            border: '#334155',
            grid: '#1e293b'
        };
        
        this.setupChartDefaults();
        this.setupEventListeners();
    }

    /**
     * Chart.js 기본 설정
     */
    setupChartDefaults() {
        try {
            Chart.defaults.color = this.darkModeColors.text;
            Chart.defaults.borderColor = this.darkModeColors.border;
            Chart.defaults.backgroundColor = this.darkModeColors.surface;
            Chart.defaults.plugins.legend.labels.color = this.darkModeColors.text;
            Chart.defaults.plugins.tooltip.backgroundColor = this.darkModeColors.surface;
            Chart.defaults.plugins.tooltip.titleColor = this.darkModeColors.text;
            Chart.defaults.plugins.tooltip.bodyColor = this.darkModeColors.textSecondary;
            Chart.defaults.plugins.tooltip.borderColor = this.darkModeColors.border;
            Chart.defaults.plugins.tooltip.borderWidth = 1;
            Chart.defaults.scale.grid.color = this.darkModeColors.grid;
            Chart.defaults.scale.ticks.color = this.darkModeColors.textSecondary;
        } catch (error) {
            console.warn('Chart.js defaults setup failed:', error);
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // Canvas 오류 이벤트
        document.addEventListener('canvasError', (e) => {
            this.handleCanvasError(e.detail.canvasId, e.detail.error);
        });

        // Canvas 리사이즈 이벤트
        document.addEventListener('canvasResized', (e) => {
            this.handleCanvasResize(e.detail.canvasId);
        });

        // 윈도우 리사이즈 이벤트 (디바운싱)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeAllCharts();
            }, 250);
        });
    }

    /**
     * 차트 렌더링 큐에 작업 추가
     * @param {Object} task - 렌더링 작업
     */
    addToRenderQueue(task) {
        this.renderQueue.push({
            ...task,
            retryCount: 0,
            maxRetries: 3,
            timestamp: Date.now()
        });

        if (!this.isRendering) {
            this.processRenderQueue();
        }
    }

    /**
     * 렌더링 큐 처리
     */
    async processRenderQueue() {
        if (this.isRendering || this.renderQueue.length === 0) {
            return;
        }

        this.isRendering = true;

        while (this.renderQueue.length > 0) {
            const task = this.renderQueue.shift();
            
            try {
                await this.executeRenderTask(task);
            } catch (error) {
                console.error(`Render task failed:`, error);
                
                if (task.retryCount < task.maxRetries) {
                    task.retryCount++;
                    this.renderQueue.unshift(task); // 큐 앞쪽에 다시 추가
                    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
                } else {
                    this.errorHandler.handleChartRenderError(error, task.chartType);
                }
            }

            // UI 블로킹 방지
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        this.isRendering = false;
    }

    /**
     * 렌더링 작업 실행
     * @param {Object} task - 렌더링 작업
     */
    async executeRenderTask(task) {
        const { chartType, method, data, parameters } = task;
        
        switch (method) {
            case 'renderPricePathChart':
                await this.renderPricePathChart(data, parameters.initialPrice);
                break;
            case 'renderFinalPriceChart':
                await this.renderFinalPriceChart(data, parameters.initialPrice);
                break;
            case 'renderPayoutChart':
                await this.renderPayoutChart(data);
                break;
            case 'renderReturnDistributionChart':
                await this.renderReturnDistributionChart(data, parameters.initialPrice);
                break;
            case 'renderRiskMetricsChart':
                await this.renderRiskMetricsChart(data);
                break;
            default:
                throw new Error(`Unknown render method: ${method}`);
        }
    }

    /**
     * 주가 경로 차트 렌더링 (개선된 버전)
     * @param {Array} pricePaths - 주가 경로 데이터
     * @param {number} initialPrice - 초기 주가
     */
    async renderPricePathChart(pricePaths, initialPrice) {
        const canvasId = 'price-paths-chart';
        
        if (!this.canvasManager.validateCanvas(canvasId)) {
            if (!this.canvasManager.registerCanvas(canvasId)) {
                throw new Error(`Canvas ${canvasId} registration failed`);
            }
        }

        try {
            // 기존 차트 제거
            this.destroyChart(canvasId);

            const ctx = document.getElementById(canvasId);
            if (!ctx) {
                throw new Error(`Canvas element ${canvasId} not found`);
            }

            // 성능을 위해 샘플 경로 선택
            const samplePaths = this.samplePaths(pricePaths, 50);
            
            const datasets = samplePaths.map((path, index) => ({
                label: `경로 ${index + 1}`,
                data: path.map((price, day) => ({ x: day, y: price })),
                borderColor: this.getPathColor(index, samplePaths.length),
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0,
                pointHoverRadius: 3,
                tension: 0.1,
                showLine: true
            }));

            // 평균 경로 추가
            const avgPath = this.calculateAveragePath(pricePaths);
            datasets.push({
                label: '평균 경로',
                data: avgPath.map((price, day) => ({ x: day, y: price })),
                borderColor: this.darkModeColors.warning,
                backgroundColor: 'transparent',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.1,
                showLine: true
            });

            const chart = new Chart(ctx, {
                type: 'line',
                data: { datasets },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '주가 시뮬레이션 경로',
                            color: this.darkModeColors.text,
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: (context) => `${context[0].parsed.x}일차`,
                                label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.y)}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'linear',
                            title: {
                                display: true,
                                text: '일수',
                                color: this.darkModeColors.text
                            },
                            grid: {
                                color: this.darkModeColors.grid
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '주가 (원)',
                                color: this.darkModeColors.text
                            },
                            grid: {
                                color: this.darkModeColors.grid
                            },
                            ticks: {
                                callback: (value) => this.formatCurrency(value)
                            }
                        }
                    }
                }
            });

            this.charts.set(canvasId, chart);
            this.showChartContainer(canvasId);

        } catch (error) {
            this.errorHandler.handleCanvasError(error, canvasId);
            throw error;
        }
    }

    /**
     * 최종 주가 분포 차트 렌더링 (개선된 버전)
     * @param {Array} finalPrices - 최종 주가 배열
     * @param {number} initialPrice - 초기 주가
     */
    async renderFinalPriceChart(finalPrices, initialPrice) {
        const canvasId = 'price-distribution-chart';
        
        if (!this.canvasManager.validateCanvas(canvasId)) {
            if (!this.canvasManager.registerCanvas(canvasId)) {
                throw new Error(`Canvas ${canvasId} registration failed`);
            }
        }

        try {
            this.destroyChart(canvasId);

            const ctx = document.getElementById(canvasId);
            if (!ctx) {
                throw new Error(`Canvas element ${canvasId} not found`);
            }

            // 히스토그램 데이터 생성
            const histogramData = this.createHistogram(finalPrices, 30);
            
            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: histogramData.labels,
                    datasets: [{
                        label: '빈도',
                        data: histogramData.values,
                        backgroundColor: this.createGradientArray(ctx, this.darkModeColors.primary, 0.7),
                        borderColor: this.darkModeColors.primary,
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1200,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '최종 주가 분포',
                            color: this.darkModeColors.text,
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: (context) => `주가 구간: ${context[0].label}`,
                                label: (context) => `빈도: ${context.parsed.y}회`
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '최종 주가 (원)',
                                color: this.darkModeColors.text
                            },
                            grid: {
                                color: this.darkModeColors.grid
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '빈도',
                                color: this.darkModeColors.text
                            },
                            grid: {
                                color: this.darkModeColors.grid
                            }
                        }
                    }
                }
            });

            this.charts.set(canvasId, chart);
            this.showChartContainer(canvasId);

        } catch (error) {
            this.errorHandler.handleCanvasError(error, canvasId);
            throw error;
        }
    }

    /**
     * 보험금 분포 차트 렌더링 (개선된 버전)
     * @param {Array} payouts - 보험금 배열
     */
    async renderPayoutChart(payouts) {
        const canvasId = 'payout-distribution-chart';
        
        if (!this.canvasManager.validateCanvas(canvasId)) {
            if (!this.canvasManager.registerCanvas(canvasId)) {
                throw new Error(`Canvas ${canvasId} registration failed`);
            }
        }

        try {
            this.destroyChart(canvasId);

            const ctx = document.getElementById(canvasId);
            if (!ctx) {
                throw new Error(`Canvas element ${canvasId} not found`);
            }

            // 보험금 지급 여부 분석
            const noPayout = payouts.filter(p => p === 0).length;
            const withPayout = payouts.length - noPayout;
            const payoutProbability = (withPayout / payouts.length * 100).toFixed(1);

            const chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['보험금 미지급', '보험금 지급'],
                    datasets: [{
                        data: [noPayout, withPayout],
                        backgroundColor: [
                            this.darkModeColors.success,
                            this.darkModeColors.danger
                        ],
                        borderColor: this.darkModeColors.border,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: `보험금 지급 분포 (지급 확률: ${payoutProbability}%)`,
                            color: this.darkModeColors.text,
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: this.darkModeColors.text,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const percentage = ((context.parsed / payouts.length) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed}회 (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

            this.charts.set(canvasId, chart);
            this.showChartContainer(canvasId);

        } catch (error) {
            this.errorHandler.handleCanvasError(error, canvasId);
            throw error;
        }
    }

    /**
     * 수익률 분포 차트 렌더링
     * @param {Array} finalPrices - 최종 주가 배열
     * @param {number} initialPrice - 초기 주가
     */
    async renderReturnDistributionChart(finalPrices, initialPrice) {
        const canvasId = 'return-distribution-chart';
        
        if (!this.canvasManager.validateCanvas(canvasId)) {
            if (!this.canvasManager.registerCanvas(canvasId)) {
                throw new Error(`Canvas ${canvasId} registration failed`);
            }
        }

        try {
            this.destroyChart(canvasId);

            const ctx = document.getElementById(canvasId);
            if (!ctx) {
                throw new Error(`Canvas element ${canvasId} not found`);
            }

            // 수익률 계산
            const returns = finalPrices.map(price => ((price - initialPrice) / initialPrice) * 100);
            const histogramData = this.createHistogram(returns, 40);

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: histogramData.labels,
                    datasets: [{
                        label: '빈도',
                        data: histogramData.values,
                        backgroundColor: histogramData.labels.map(label => {
                            const value = parseFloat(label.split('~')[0]);
                            return value >= 0 ? this.darkModeColors.success : this.darkModeColors.danger;
                        }),
                        borderColor: this.darkModeColors.border,
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1200,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '수익률 분포',
                            color: this.darkModeColors.text,
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                title: (context) => `수익률 구간: ${context[0].label}`,
                                label: (context) => `빈도: ${context.parsed.y}회`
                            }
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: '수익률 (%)',
                                color: this.darkModeColors.text
                            },
                            grid: {
                                color: this.darkModeColors.grid
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: '빈도',
                                color: this.darkModeColors.text
                            },
                            grid: {
                                color: this.darkModeColors.grid
                            }
                        }
                    }
                }
            });

            this.charts.set(canvasId, chart);
            this.showChartContainer(canvasId);

        } catch (error) {
            this.errorHandler.handleCanvasError(error, canvasId);
            throw error;
        }
    }

    /**
     * 리스크 지표 차트 렌더링
     * @param {Object} riskMetrics - 리스크 지표
     */
    async renderRiskMetricsChart(riskMetrics) {
        const canvasId = 'risk-metrics-chart';
        
        if (!this.canvasManager.validateCanvas(canvasId)) {
            if (!this.canvasManager.registerCanvas(canvasId)) {
                throw new Error(`Canvas ${canvasId} registration failed`);
            }
        }

        try {
            this.destroyChart(canvasId);

            const ctx = document.getElementById(canvasId);
            if (!ctx) {
                throw new Error(`Canvas element ${canvasId} not found`);
            }

            const chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['VaR 95%', 'VaR 99%', 'Expected Shortfall 95%', 'Expected Shortfall 99%', '최대 손실', '평균 손실'],
                    datasets: [{
                        label: '보험 적용 전',
                        data: [
                            riskMetrics.var95,
                            riskMetrics.var99,
                            riskMetrics.expectedShortfall95,
                            riskMetrics.expectedShortfall99,
                            riskMetrics.maxLoss,
                            riskMetrics.avgLoss
                        ],
                        borderColor: this.darkModeColors.danger,
                        backgroundColor: this.addAlpha(this.darkModeColors.danger, 0.2),
                        borderWidth: 2,
                        pointBackgroundColor: this.darkModeColors.danger,
                        pointBorderColor: this.darkModeColors.danger,
                        pointRadius: 4
                    }, {
                        label: '보험 적용 후',
                        data: [
                            riskMetrics.netVar95,
                            riskMetrics.netVar99,
                            riskMetrics.netExpectedShortfall95,
                            riskMetrics.netExpectedShortfall99,
                            riskMetrics.netMaxLoss,
                            riskMetrics.netAvgLoss
                        ],
                        borderColor: this.darkModeColors.success,
                        backgroundColor: this.addAlpha(this.darkModeColors.success, 0.2),
                        borderWidth: 2,
                        pointBackgroundColor: this.darkModeColors.success,
                        pointBorderColor: this.darkModeColors.success,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: '리스크 지표 비교',
                            color: this.darkModeColors.text,
                            font: { size: 16, weight: 'bold' }
                        },
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: this.darkModeColors.text,
                                padding: 20
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.dataset.label}: ${this.formatCurrency(context.parsed.r)}`
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            grid: {
                                color: this.darkModeColors.grid
                            },
                            pointLabels: {
                                color: this.darkModeColors.text,
                                font: { size: 12 }
                            },
                            ticks: {
                                color: this.darkModeColors.textSecondary,
                                callback: (value) => this.formatCurrency(value)
                            }
                        }
                    }
                }
            });

            this.charts.set(canvasId, chart);
            this.showChartContainer(canvasId);

        } catch (error) {
            this.errorHandler.handleCanvasError(error, canvasId);
            throw error;
        }
    }

    /**
     * 차트 제거
     * @param {string} canvasId - Canvas ID
     */
    destroyChart(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            try {
                chart.destroy();
            } catch (error) {
                console.warn(`Error destroying chart ${canvasId}:`, error);
            }
            this.charts.delete(canvasId);
        }
    }

    /**
     * 모든 차트 크기 조정
     */
    resizeAllCharts() {
        for (const [canvasId, chart] of this.charts) {
            try {
                if (this.canvasManager.validateCanvas(canvasId)) {
                    chart.resize();
                }
            } catch (error) {
                console.warn(`Error resizing chart ${canvasId}:`, error);
            }
        }
    }

    /**
     * Canvas 리사이즈 처리
     * @param {string} canvasId - Canvas ID
     */
    handleCanvasResize(canvasId) {
        const chart = this.charts.get(canvasId);
        if (chart) {
            try {
                chart.resize();
            } catch (error) {
                console.warn(`Error resizing chart ${canvasId}:`, error);
            }
        }
    }

    /**
     * Canvas 오류 처리
     * @param {string} canvasId - Canvas ID
     * @param {Error} error - 오류
     */
    handleCanvasError(canvasId, error) {
        this.destroyChart(canvasId);
        this.errorHandler.handleCanvasError(error, canvasId);
    }

    // 유틸리티 메서드들...
    
    /**
     * 경로 색상 생성
     * @param {number} index - 인덱스
     * @param {number} total - 전체 개수
     * @returns {string} 색상
     */
    getPathColor(index, total) {
        const hue = (index / total) * 360;
        return `hsla(${hue}, 70%, 60%, 0.6)`;
    }

    /**
     * 평균 경로 계산
     * @param {Array} pricePaths - 주가 경로 배열
     * @returns {Array} 평균 경로
     */
    calculateAveragePath(pricePaths) {
        if (!pricePaths.length) return [];
        
        const pathLength = pricePaths[0].length;
        const avgPath = new Array(pathLength).fill(0);
        
        for (const path of pricePaths) {
            for (let i = 0; i < pathLength; i++) {
                avgPath[i] += path[i];
            }
        }
        
        return avgPath.map(sum => sum / pricePaths.length);
    }

    /**
     * 경로 샘플링
     * @param {Array} pricePaths - 주가 경로 배열
     * @param {number} sampleSize - 샘플 크기
     * @returns {Array} 샘플 경로
     */
    samplePaths(pricePaths, sampleSize) {
        if (pricePaths.length <= sampleSize) {
            return pricePaths;
        }
        
        const step = Math.floor(pricePaths.length / sampleSize);
        const sampled = [];
        
        for (let i = 0; i < pricePaths.length; i += step) {
            if (sampled.length < sampleSize) {
                sampled.push(pricePaths[i]);
            }
        }
        
        return sampled;
    }

    /**
     * 히스토그램 데이터 생성
     * @param {Array} data - 데이터 배열
     * @param {number} bins - 구간 수
     * @returns {Object} 히스토그램 데이터
     */
    createHistogram(data, bins) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const binWidth = (max - min) / bins;
        
        const labels = [];
        const values = new Array(bins).fill(0);
        
        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            labels.push(`${this.formatNumber(binStart)}~${this.formatNumber(binEnd)}`);
        }
        
        for (const value of data) {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            values[binIndex]++;
        }
        
        return { labels, values };
    }

    /**
     * 그라디언트 배열 생성
     * @param {CanvasRenderingContext2D} ctx - Canvas 컨텍스트
     * @param {string} color - 기본 색상
     * @param {number} alpha - 투명도
     * @returns {Array} 그라디언트 배열
     */
    createGradientArray(ctx, color, alpha) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, this.addAlpha(color, alpha));
        gradient.addColorStop(1, this.addAlpha(color, alpha * 0.3));
        return gradient;
    }

    /**
     * 색상에 투명도 추가
     * @param {string} color - 색상
     * @param {number} alpha - 투명도
     * @returns {string} 투명도가 적용된 색상
     */
    addAlpha(color, alpha) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return color;
    }

    /**
     * 통화 형식으로 포맷
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
     * 숫자 포맷
     * @param {number} value - 값
     * @returns {string} 포맷된 문자열
     */
    formatNumber(value) {
        return new Intl.NumberFormat('ko-KR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(value);
    }

    /**
     * 차트 컨테이너 표시
     * @param {string} canvasId - Canvas ID
     */
    showChartContainer(canvasId) {
        const container = document.getElementById(`${canvasId}-container`);
        if (container) {
            container.style.display = 'block';
            container.classList.add('fade-in');
        }
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        // 모든 차트 제거
        for (const canvasId of this.charts.keys()) {
            this.destroyChart(canvasId);
        }

        // Canvas 관리자 정리
        this.canvasManager.cleanup();

        // 렌더링 큐 정리
        this.renderQueue = [];
        this.isRendering = false;
    }
}