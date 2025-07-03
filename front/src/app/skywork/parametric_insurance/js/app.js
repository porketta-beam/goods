// 개선된 메인 애플리케이션

import { SimulationForm } from './components/SimulationForm.js';
import { ResultsChart } from './components/ResultsChart.js';
import { StatisticsPanel } from './components/StatisticsPanel.js';
import { runMonteCarloSimulation, optimizeSimulationParameters, validateSimulationResult } from './utils/monteCarloSimulation.js';
import { SimulationController } from './utils/simulationController.js';
import { ErrorHandler } from './utils/errorHandler.js';
import { CanvasManager } from './utils/canvasManager.js';

/**
 * 개선된 메인 애플리케이션 클래스
 */
class App {
    constructor() {
        this.simulationForm = null;
        this.resultsChart = null;
        this.statisticsPanel = null;
        this.simulationController = new SimulationController();
        this.errorHandler = new ErrorHandler();
        this.canvasManager = new CanvasManager();
        this.currentResult = null;
        this.isInitialized = false;
        
        this.darkModeColors = {
            primary: '#3b82f6',
            secondary: '#8b5cf6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            info: '#06b6d4'
        };
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        try {
            console.log('파라메트릭 보험 시뮬레이션 애플리케이션 초기화 시작...');
            
            // 로딩 화면 표시
            this.showLoadingScreen();

            // 브라우저 호환성 확인
            const compatibility = this.errorHandler.checkBrowserCompatibility();
            console.log('브라우저 호환성:', compatibility);

            // 컴포넌트 초기화
            await this.initializeComponents();

            // 이벤트 리스너 설정
            this.setupEventListeners();

            // Canvas 등록
            this.registerCanvases();

            // 초기 상태 설정
            this.hideResults();

            // 환영 메시지 표시
            this.showWelcomeMessage();

            // 로딩 화면 숨김
            this.hideLoadingScreen();

            this.isInitialized = true;
            console.log('파라메트릭 보험 시뮬레이션 애플리케이션이 성공적으로 초기화되었습니다.');

        } catch (error) {
            console.error('애플리케이션 초기화 중 오류 발생:', error);
            this.errorHandler.handleSimulationError(error);
            this.hideLoadingScreen();
            this.showInitializationError(error);
        }
    }

    /**
     * 컴포넌트 초기화
     */
    async initializeComponents() {
        try {
            // 시뮬레이션 폼 초기화
            this.simulationForm = new SimulationForm('simulation-form');
            
            // 결과 차트 초기화
            this.resultsChart = new ResultsChart();
            
            // 통계 패널 초기화
            this.statisticsPanel = new StatisticsPanel('statistics-panel');

            // 컴포넌트 간 연결 설정
            this.setupComponentConnections();

            console.log('모든 컴포넌트가 성공적으로 초기화되었습니다.');

        } catch (error) {
            console.error('컴포넌트 초기화 실패:', error);
            throw new Error(`컴포넌트 초기화 실패: ${error.message}`);
        }
    }

    /**
     * Canvas 등록
     */
    registerCanvases() {
        const canvasIds = [
            'price-paths-chart',
            'price-distribution-chart',
            'payout-distribution-chart',
            'return-distribution-chart',
            'risk-metrics-chart'
        ];

        for (const canvasId of canvasIds) {
            if (!this.canvasManager.registerCanvas(canvasId)) {
                console.warn(`Canvas ${canvasId} 등록 실패`);
            }
        }
    }

    /**
     * 컴포넌트 간 연결 설정
     */
    setupComponentConnections() {
        // 폼과 차트 간 연결
        document.addEventListener('formParametersChanged', (e) => {
            this.updateChartPreview(e.detail.parameters);
        });

        // 차트와 통계 패널 간 연결
        document.addEventListener('chartDataUpdated', (e) => {
            if (this.statisticsPanel) {
                this.statisticsPanel.updateFromChartData(e.detail.data);
            }
        });
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 시뮬레이션 시작 이벤트
        document.addEventListener('simulationStart', (e) => {
            this.runSimulation(e.detail.parameters);
        });

        // 시뮬레이션 컨트롤러 이벤트
        this.simulationController.onProgress((progressInfo) => {
            this.updateProgressDisplay(progressInfo);
        });

        this.simulationController.onStatusChange((statusInfo) => {
            this.handleSimulationStatusChange(statusInfo);
        });

        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', this.debounce(() => {
            if (this.resultsChart) {
                this.resultsChart.resizeAllCharts();
            }
        }, 250));

        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // 페이지 가시성 변경 이벤트
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.simulationController.isRunning) {
                this.simulationController.pause();
            } else if (!document.hidden && this.simulationController.isPaused) {
                this.simulationController.resume();
            }
        });

        // 오류 이벤트
        document.addEventListener('canvasError', (e) => {
            this.handleCanvasError(e.detail.canvasId, e.detail.error);
        });

        // 내보내기/가져오기 버튼
        this.setupExportImportButtons();
    }

    /**
     * 키보드 단축키 처리
     * @param {KeyboardEvent} e - 키보드 이벤트
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    if (!this.simulationController.isRunning) {
                        document.getElementById('run-simulation')?.click();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    this.exportResults();
                    break;
                case 'r':
                    e.preventDefault();
                    this.resetApplication();
                    break;
                case 'i':
                    e.preventDefault();
                    this.importSettings();
                    break;
                case 'h':
                    e.preventDefault();
                    this.showHelpDialog();
                    break;
            }
        }

        // ESC 키로 실행 중인 시뮬레이션 중단
        if (e.key === 'Escape' && this.simulationController.isRunning) {
            this.simulationController.cancel();
        }
    }

    /**
     * 시뮬레이션 실행
     * @param {Object} parameters - 시뮬레이션 파라미터
     */
    async runSimulation(parameters) {
        if (!this.isInitialized) {
            this.errorHandler.showUserFriendlyError('애플리케이션이 아직 초기화되지 않았습니다.');
            return;
        }

        try {
            console.log('시뮬레이션 시작:', parameters);

            // 파라미터 최적화
            const optimizedParams = optimizeSimulationParameters(parameters);
            if (optimizedParams.numSimulations !== parameters.numSimulations) {
                this.showNotification(
                    `메모리 제약으로 시뮬레이션 횟수가 ${optimizedParams.numSimulations}로 조정되었습니다.`,
                    'warning'
                );
            }

            // 폼 비활성화
            if (this.simulationForm) {
                this.simulationForm.setDisabled(true);
            }

            // 결과 영역 숨김
            this.hideResults();

            // 시뮬레이션 실행
            const result = await this.simulationController.start(
                optimizedParams,
                (params, progressCallback, abortSignal) => 
                    runMonteCarloSimulation(params, progressCallback, abortSignal)
            );

            // 결과 검증
            if (!validateSimulationResult(result, optimizedParams)) {
                throw new Error('시뮬레이션 결과가 유효하지 않습니다.');
            }

            // 결과 저장
            this.currentResult = result;
            this.currentResult.parameters = optimizedParams;

            console.log(`시뮬레이션 완료 (${result.statistics.executionTime.toFixed(2)}초):`, result);

            // 결과 표시
            await this.displayResults(result, optimizedParams);
            
            // 성공 메시지
            this.showNotification(
                `시뮬레이션이 성공적으로 완료되었습니다. (실행시간: ${result.statistics.executionTime.toFixed(2)}초)`, 
                'success'
            );

            // 분석 완료 이벤트 발생
            this.dispatchAnalysisCompleteEvent(result);

        } catch (error) {
            console.error('시뮬레이션 실행 중 오류 발생:', error);
            this.errorHandler.handleSimulationError(error);
        } finally {
            // 폼 활성화
            if (this.simulationForm) {
                this.simulationForm.setDisabled(false);
            }
        }
    }

    /**
     * 결과 표시
     * @param {Object} result - 시뮬레이션 결과
     * @param {Object} parameters - 시뮬레이션 파라미터
     */
    async displayResults(result, parameters) {
        try {
            // 통계 패널 업데이트 (애니메이션과 함께)
            await this.animateStatisticsDisplay(result);

            // 차트 렌더링 (순차적으로 애니메이션)
            await this.animateChartsDisplay(result, parameters);

            // 결과 영역 표시
            this.showResults();

            // 추가 분석 도구 표시
            this.showAnalysisTools();

        } catch (error) {
            console.error('결과 표시 중 오류 발생:', error);
            this.errorHandler.handleChartRenderError(error, 'results-display');
        }
    }

    /**
     * 통계 표시 애니메이션
     * @param {Object} result - 시뮬레이션 결과
     */
    async animateStatisticsDisplay(result) {
        return new Promise((resolve) => {
            try {
                // 통계 패널 표시
                if (this.statisticsPanel) {
                    this.statisticsPanel.displayStatistics(result);
                }
                
                // 애니메이션 완료 후 resolve
                setTimeout(resolve, 600);
            } catch (error) {
                console.error('통계 표시 애니메이션 오류:', error);
                resolve(); // 오류가 있어도 계속 진행
            }
        });
    }

    /**
     * 차트 표시 애니메이션
     * @param {Object} result - 시뮬레이션 결과
     * @param {Object} parameters - 시뮬레이션 파라미터
     */
    async animateChartsDisplay(result, parameters) {
        const chartTasks = [
            {
                chartType: 'price-paths',
                method: 'renderPricePathChart',
                data: result.pricePaths,
                parameters
            },
            {
                chartType: 'price-distribution',
                method: 'renderFinalPriceChart',
                data: result.finalPrices,
                parameters
            },
            {
                chartType: 'payout-distribution',
                method: 'renderPayoutChart',
                data: result.payouts,
                parameters
            },
            {
                chartType: 'return-distribution',
                method: 'renderReturnDistributionChart',
                data: result.finalPrices,
                parameters
            },
            {
                chartType: 'risk-metrics',
                method: 'renderRiskMetricsChart',
                data: result.riskMetrics,
                parameters
            }
        ];

        // 차트 렌더링 큐에 추가
        for (const task of chartTasks) {
            if (this.resultsChart) {
                this.resultsChart.addToRenderQueue(task);
            }
            // 각 차트 간 200ms 간격
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    /**
     * 진행 상황 표시 업데이트
     * @param {Object} progressInfo - 진행 정보
     */
    updateProgressDisplay(progressInfo) {
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progressStage = document.getElementById('progress-stage');
        const timeRemaining = document.getElementById('time-remaining');

        if (progressBar) {
            progressBar.style.width = `${progressInfo.progress}%`;
        }

        if (progressText) {
            progressText.textContent = `${progressInfo.progress.toFixed(1)}%`;
        }

        if (progressStage && progressInfo.stage) {
            progressStage.textContent = progressInfo.stage;
        }

        if (timeRemaining && progressInfo.estimatedTimeRemaining > 0) {
            const minutes = Math.floor(progressInfo.estimatedTimeRemaining / 60000);
            const seconds = Math.floor((progressInfo.estimatedTimeRemaining % 60000) / 1000);
            timeRemaining.textContent = `예상 남은 시간: ${minutes}분 ${seconds}초`;
        }
    }

    /**
     * 시뮬레이션 상태 변경 처리
     * @param {Object} statusInfo - 상태 정보
     */
    handleSimulationStatusChange(statusInfo) {
        const { status, error } = statusInfo;

        switch (status) {
            case 'started':
                this.showProgress();
                break;
            case 'paused':
                this.showNotification('시뮬레이션이 일시 정지되었습니다.', 'info');
                break;
            case 'resumed':
                this.showNotification('시뮬레이션이 재개되었습니다.', 'info');
                break;
            case 'cancelled':
                this.hideProgress();
                this.showNotification('시뮬레이션이 취소되었습니다.', 'warning');
                break;
            case 'completed':
                this.hideProgress();
                break;
            case 'error':
                this.hideProgress();
                if (error) {
                    this.errorHandler.handleSimulationError(error);
                }
                break;
        }
    }

    /**
     * Canvas 오류 처리
     * @param {string} canvasId - Canvas ID
     * @param {Error} error - 오류
     */
    handleCanvasError(canvasId, error) {
        console.error(`Canvas ${canvasId} 오류:`, error);
        this.errorHandler.handleCanvasError(error, canvasId);
    }

    /**
     * 로딩 화면 표시
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * 로딩 화면 숨김
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    /**
     * 진행 상황 표시
     */
    showProgress() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
    }

    /**
     * 진행 상황 숨김
     */
    hideProgress() {
        const progressContainer = document.getElementById('progress-container');
        if (progressContainer) {
            progressContainer.style.display = 'none';
        }
    }

    /**
     * 결과 영역 표시
     */
    showResults() {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
            resultsContainer.classList.add('fade-in');
        }
    }

    /**
     * 결과 영역 숨김
     */
    hideResults() {
        const resultsContainer = document.getElementById('results-container');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
            resultsContainer.classList.remove('fade-in');
        }
    }

    /**
     * 분석 도구 표시
     */
    showAnalysisTools() {
        const analysisTools = document.getElementById('analysis-tools');
        if (analysisTools) {
            analysisTools.style.display = 'block';
        }
    }

    /**
     * 환영 메시지 표시
     */
    showWelcomeMessage() {
        this.showNotification(
            '파라메트릭 보험 시뮬레이션에 오신 것을 환영합니다. 파라미터를 설정하고 시뮬레이션을 시작해보세요.',
            'info'
        );
    }

    /**
     * 초기화 오류 표시
     * @param {Error} error - 오류
     */
    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed inset-0 bg-dark-bg flex items-center justify-center z-50';
        errorDiv.innerHTML = `
            <div class="bg-dark-surface p-8 rounded-lg border border-red-500 max-w-md">
                <div class="text-center">
                    <div class="text-red-400 mb-4">
                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                        </svg>
                    </div>
                    <h2 class="text-xl font-bold text-text-primary mb-4">초기화 실패</h2>
                    <p class="text-text-secondary mb-6">${error.message}</p>
                    <button onclick="location.reload()" 
                            class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        새로고침
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    /**
     * 알림 메시지 표시
     * @param {string} message - 메시지
     * @param {string} type - 타입 (success, warning, error, info)
     */
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = document.getElementById('notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const colors = {
            success: 'bg-green-600',
            warning: 'bg-yellow-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };

        const notificationDiv = document.createElement('div');
        notificationDiv.id = 'notification';
        notificationDiv.className = `fixed top-4 right-4 ${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-md`;
        notificationDiv.innerHTML = `
            <div class="flex items-start">
                <div class="flex-1">
                    <p class="text-sm">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="text-white hover:text-gray-200">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(notificationDiv);

        // 자동 제거 (성공/정보 메시지는 5초, 경고/오류는 10초)
        const autoRemoveTime = (type === 'success' || type === 'info') ? 5000 : 10000;
        setTimeout(() => {
            if (notificationDiv.parentElement) {
                notificationDiv.remove();
            }
        }, autoRemoveTime);
    }

    /**
     * 디바운스 함수
     * @param {Function} func - 함수
     * @param {number} wait - 대기 시간
     * @returns {Function} 디바운스된 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * 분석 완료 이벤트 발생
     * @param {Object} result - 시뮬레이션 결과
     */
    dispatchAnalysisCompleteEvent(result) {
        document.dispatchEvent(new CustomEvent('analysisComplete', {
            detail: { result }
        }));
    }

    /**
     * 내보내기/가져오기 버튼 설정
     */
    setupExportImportButtons() {
        // 구현 예정
    }

    /**
     * 결과 내보내기
     */
    exportResults() {
        // 구현 예정
    }

    /**
     * 설정 가져오기
     */
    importSettings() {
        // 구현 예정
    }

    /**
     * 도움말 대화상자 표시
     */
    showHelpDialog() {
        // 구현 예정
    }

    /**
     * 애플리케이션 재설정
     */
    resetApplication() {
        if (this.simulationController.isRunning) {
            this.simulationController.cancel();
        }

        this.hideResults();
        this.hideProgress();
        this.currentResult = null;

        if (this.simulationForm) {
            this.simulationForm.reset();
        }

        this.showNotification('애플리케이션이 재설정되었습니다.', 'info');
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        // 시뮬레이션 컨트롤러 정리
        if (this.simulationController) {
            this.simulationController.cleanup();
        }

        // 차트 정리
        if (this.resultsChart) {
            this.resultsChart.cleanup();
        }

        // Canvas 관리자 정리
        if (this.canvasManager) {
            this.canvasManager.cleanup();
        }

        console.log('애플리케이션 리소스가 정리되었습니다.');
    }
}

// 애플리케이션 인스턴스 생성 및 초기화
const app = new App();

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// 페이지 언로드 시 리소스 정리
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// 전역 오류 처리
window.addEventListener('error', (event) => {
    console.error('전역 오류:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
});

export default app;