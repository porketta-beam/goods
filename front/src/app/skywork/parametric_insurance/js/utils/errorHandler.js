// 오류 처리 유틸리티

/**
 * 애플리케이션 전역 오류 처리 클래스
 */
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.setupGlobalErrorHandlers();
    }

    /**
     * 전역 오류 핸들러 설정
     */
    setupGlobalErrorHandlers() {
        // 일반 JavaScript 오류
        window.addEventListener('error', (event) => {
            this.logError(event.error, 'Global Error', {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Promise rejection 오류
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, 'Unhandled Promise Rejection');
            event.preventDefault();
        });
    }

    /**
     * Canvas 관련 오류 처리
     * @param {Error} error - 오류 객체
     * @param {string} canvasId - Canvas ID
     */
    handleCanvasError(error, canvasId) {
        this.logError(error, 'Canvas Error', { canvasId });
        
        const canvas = document.getElementById(canvasId);
        if (canvas) {
            // Canvas 컨테이너에 오류 메시지 표시
            const container = canvas.parentElement;
            if (container) {
                container.innerHTML = `
                    <div class="flex items-center justify-center h-64 bg-dark-elevated rounded-lg border border-dark-border">
                        <div class="text-center">
                            <div class="text-red-400 mb-2">
                                <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"/>
                                </svg>
                            </div>
                            <p class="text-text-secondary">차트를 렌더링할 수 없습니다</p>
                            <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                새로고침
                            </button>
                        </div>
                    </div>
                `;
            }
        }
    }

    /**
     * 시뮬레이션 오류 처리
     * @param {Error} error - 오류 객체
     */
    handleSimulationError(error) {
        this.logError(error, 'Simulation Error');
        
        let userMessage = '시뮬레이션 실행 중 오류가 발생했습니다.';
        
        // 특정 오류 타입에 따른 사용자 친화적 메시지
        if (error.message.includes('memory') || error.message.includes('Memory')) {
            userMessage = '메모리가 부족합니다. 시뮬레이션 횟수를 줄여주세요.';
        } else if (error.message.includes('parameter') || error.message.includes('Parameter')) {
            userMessage = '입력 파라미터가 올바르지 않습니다. 값을 확인해주세요.';
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
            userMessage = '시뮬레이션이 시간 초과되었습니다. 다시 시도해주세요.';
        }
        
        this.showUserFriendlyError(userMessage);
    }

    /**
     * 차트 렌더링 오류 처리
     * @param {Error} error - 오류 객체
     * @param {string} chartType - 차트 타입
     */
    handleChartRenderError(error, chartType) {
        this.logError(error, 'Chart Render Error', { chartType });
        
        // 차트별 대체 렌더링 시도
        this.attemptFallbackRendering(chartType);
    }

    /**
     * 대체 렌더링 시도
     * @param {string} chartType - 차트 타입
     */
    attemptFallbackRendering(chartType) {
        const fallbackElement = document.getElementById(`${chartType}-fallback`);
        if (fallbackElement) {
            fallbackElement.style.display = 'block';
        }
        
        // 간단한 텍스트 기반 결과 표시
        this.renderTextBasedResults(chartType);
    }

    /**
     * 텍스트 기반 결과 렌더링
     * @param {string} chartType - 차트 타입
     */
    renderTextBasedResults(chartType) {
        const container = document.getElementById(`${chartType}-container`);
        if (!container) return;

        container.innerHTML = `
            <div class="bg-dark-elevated p-6 rounded-lg border border-dark-border">
                <h3 class="text-lg font-semibold text-text-primary mb-4">
                    ${this.getChartTitle(chartType)}
                </h3>
                <p class="text-text-secondary">
                    차트를 표시할 수 없어 텍스트 형태로 결과를 제공합니다.
                </p>
                <div id="${chartType}-text-results" class="mt-4 space-y-2">
                    <!-- 텍스트 결과가 여기에 표시됩니다 -->
                </div>
            </div>
        `;
    }

    /**
     * 차트 제목 반환
     * @param {string} chartType - 차트 타입
     * @returns {string} 차트 제목
     */
    getChartTitle(chartType) {
        const titles = {
            'price-paths': '주가 시뮬레이션 경로',
            'price-distribution': '최종 주가 분포',
            'payout-distribution': '보험금 분포',
            'return-distribution': '수익률 분포',
            'risk-metrics': '리스크 지표'
        };
        return titles[chartType] || '차트';
    }

    /**
     * 사용자 친화적 오류 메시지 표시
     * @param {string} message - 오류 메시지
     */
    showUserFriendlyError(message) {
        // 기존 오류 메시지 제거
        const existingError = document.getElementById('error-notification');
        if (existingError) {
            existingError.remove();
        }

        // 새 오류 메시지 생성
        const errorDiv = document.createElement('div');
        errorDiv.id = 'error-notification';
        errorDiv.className = 'fixed top-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
        errorDiv.innerHTML = `
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <svg class="w-5 h-5 text-red-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3 flex-1">
                    <p class="text-sm font-medium">${message}</p>
                </div>
                <div class="ml-4 flex-shrink-0">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                            class="text-red-200 hover:text-white">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * 오류 로깅
     * @param {Error} error - 오류 객체
     * @param {string} context - 오류 컨텍스트
     * @param {Object} additionalInfo - 추가 정보
     */
    logError(error, context, additionalInfo = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            additionalInfo,
            userAgent: navigator.userAgent
        };

        this.errorLog.push(errorEntry);
        
        // 콘솔에 상세 오류 정보 출력
        console.error(`[${context}]`, error, additionalInfo);
        
        // 오류 로그가 너무 많이 쌓이지 않도록 제한
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-50);
        }
    }

    /**
     * 오류 로그 내보내기
     * @returns {string} JSON 형태의 오류 로그
     */
    exportErrorLog() {
        return JSON.stringify(this.errorLog, null, 2);
    }

    /**
     * 오류 로그 지우기
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * 브라우저 호환성 확인
     * @returns {Object} 호환성 정보
     */
    checkBrowserCompatibility() {
        const compatibility = {
            canvas: !!document.createElement('canvas').getContext,
            webgl: !!document.createElement('canvas').getContext('webgl'),
            es6: typeof Symbol !== 'undefined',
            fetch: typeof fetch !== 'undefined',
            promise: typeof Promise !== 'undefined',
            asyncAwait: (async () => {})().constructor === Promise,
            modules: 'noModule' in HTMLScriptElement.prototype
        };

        // 호환성 문제가 있는 경우 경고
        const incompatibleFeatures = Object.entries(compatibility)
            .filter(([, supported]) => !supported)
            .map(([feature]) => feature);

        if (incompatibleFeatures.length > 0) {
            this.showUserFriendlyError(
                `브라우저가 일부 기능을 지원하지 않습니다: ${incompatibleFeatures.join(', ')}. 최신 브라우저를 사용해주세요.`
            );
        }

        return compatibility;
    }
}