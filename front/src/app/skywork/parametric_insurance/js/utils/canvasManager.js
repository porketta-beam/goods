// Canvas 관리 유틸리티

/**
 * Canvas 요소와 렌더링 컨텍스트를 관리하는 클래스
 */
export class CanvasManager {
    constructor() {
        this.canvasElements = new Map();
        this.contexts = new Map();
        this.canvasStates = new Map();
        this.resizeObserver = null;
        this.setupResizeObserver();
    }

    /**
     * ResizeObserver 설정
     */
    setupResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    const canvas = entry.target;
                    if (canvas.tagName === 'CANVAS') {
                        this.handleCanvasResize(canvas.id);
                    }
                }
            });
        }
    }

    /**
     * Canvas 요소 등록 및 초기화
     * @param {string} canvasId - Canvas ID
     * @returns {boolean} 성공 여부
     */
    registerCanvas(canvasId) {
        try {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.warn(`Canvas element with id '${canvasId}' not found`);
                return false;
            }

            // Canvas 상태 초기화
            this.canvasStates.set(canvasId, {
                isValid: true,
                lastRenderTime: 0,
                renderCount: 0,
                hasError: false,
                errorMessage: null,
                isResizing: false
            });

            // Canvas 요소 저장
            this.canvasElements.set(canvasId, canvas);

            // 컨텍스트 획득 시도
            const context = this.getContext(canvasId);
            if (!context) {
                this.markCanvasAsInvalid(canvasId, 'Failed to get 2D context');
                return false;
            }

            // ResizeObserver 등록
            if (this.resizeObserver) {
                this.resizeObserver.observe(canvas);
            }

            // Canvas 초기 설정
            this.setupCanvas(canvasId);

            console.log(`Canvas '${canvasId}' registered successfully`);
            return true;

        } catch (error) {
            console.error(`Failed to register canvas '${canvasId}':`, error);
            this.markCanvasAsInvalid(canvasId, error.message);
            return false;
        }
    }

    /**
     * Canvas 초기 설정
     * @param {string} canvasId - Canvas ID
     */
    setupCanvas(canvasId) {
        const canvas = this.canvasElements.get(canvasId);
        const context = this.contexts.get(canvasId);
        
        if (!canvas || !context) return;

        // 고해상도 디스플레이 지원
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        
        canvas.width = rect.width * devicePixelRatio;
        canvas.height = rect.height * devicePixelRatio;
        
        context.scale(devicePixelRatio, devicePixelRatio);
        
        // CSS 크기 설정
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }

    /**
     * Canvas 유효성 검증
     * @param {string} canvasId - Canvas ID
     * @returns {boolean} 유효성 여부
     */
    validateCanvas(canvasId) {
        const state = this.canvasStates.get(canvasId);
        if (!state || !state.isValid) {
            return false;
        }

        const canvas = this.canvasElements.get(canvasId);
        if (!canvas || !canvas.parentElement) {
            this.markCanvasAsInvalid(canvasId, 'Canvas element not in DOM');
            return false;
        }

        const context = this.contexts.get(canvasId);
        if (!context) {
            this.markCanvasAsInvalid(canvasId, 'No valid context');
            return false;
        }

        return true;
    }

    /**
     * 2D 렌더링 컨텍스트 획득
     * @param {string} canvasId - Canvas ID
     * @returns {CanvasRenderingContext2D|null} 2D 컨텍스트
     */
    getContext(canvasId) {
        // 캐시된 컨텍스트 확인
        if (this.contexts.has(canvasId)) {
            return this.contexts.get(canvasId);
        }

        const canvas = this.canvasElements.get(canvasId) || document.getElementById(canvasId);
        if (!canvas) {
            console.warn(`Canvas '${canvasId}' not found`);
            return null;
        }

        try {
            const context = canvas.getContext('2d', {
                alpha: true,
                desynchronized: true,
                willReadFrequently: false
            });

            if (context) {
                this.contexts.set(canvasId, context);
                return context;
            } else {
                console.error(`Failed to get 2D context for canvas '${canvasId}'`);
                return null;
            }
        } catch (error) {
            console.error(`Error getting context for canvas '${canvasId}':`, error);
            return null;
        }
    }

    /**
     * Canvas 지우기
     * @param {string} canvasId - Canvas ID
     */
    clearCanvas(canvasId) {
        if (!this.validateCanvas(canvasId)) {
            return;
        }

        try {
            const canvas = this.canvasElements.get(canvasId);
            const context = this.contexts.get(canvasId);
            
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // 상태 업데이트
            const state = this.canvasStates.get(canvasId);
            if (state) {
                state.lastRenderTime = Date.now();
            }
        } catch (error) {
            console.error(`Error clearing canvas '${canvasId}':`, error);
            this.handleCanvasError(canvasId, error);
        }
    }

    /**
     * Canvas 크기 조정
     * @param {string} canvasId - Canvas ID
     */
    resizeCanvas(canvasId) {
        if (!this.validateCanvas(canvasId)) {
            return;
        }

        try {
            const state = this.canvasStates.get(canvasId);
            if (state) {
                state.isResizing = true;
            }

            this.setupCanvas(canvasId);

            if (state) {
                state.isResizing = false;
            }

            // 리사이즈 이벤트 발생
            document.dispatchEvent(new CustomEvent('canvasResized', {
                detail: { canvasId }
            }));

        } catch (error) {
            console.error(`Error resizing canvas '${canvasId}':`, error);
            this.handleCanvasError(canvasId, error);
        }
    }

    /**
     * Canvas 리사이즈 처리
     * @param {string} canvasId - Canvas ID
     */
    handleCanvasResize(canvasId) {
        // 디바운싱을 위한 지연
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.resizeCanvas(canvasId);
        }, 100);
    }

    /**
     * Canvas를 무효로 표시
     * @param {string} canvasId - Canvas ID
     * @param {string} errorMessage - 오류 메시지
     */
    markCanvasAsInvalid(canvasId, errorMessage) {
        const state = this.canvasStates.get(canvasId) || {};
        state.isValid = false;
        state.hasError = true;
        state.errorMessage = errorMessage;
        this.canvasStates.set(canvasId, state);
        
        console.error(`Canvas '${canvasId}' marked as invalid: ${errorMessage}`);
    }

    /**
     * Canvas 오류 처리
     * @param {string} canvasId - Canvas ID
     * @param {Error} error - 오류 객체
     */
    handleCanvasError(canvasId, error) {
        this.markCanvasAsInvalid(canvasId, error.message);
        
        // 오류 이벤트 발생
        document.dispatchEvent(new CustomEvent('canvasError', {
            detail: { canvasId, error }
        }));
    }

    /**
     * Canvas 상태 정보 반환
     * @param {string} canvasId - Canvas ID
     * @returns {Object|null} Canvas 상태
     */
    getCanvasState(canvasId) {
        return this.canvasStates.get(canvasId) || null;
    }

    /**
     * 모든 Canvas 상태 반환
     * @returns {Map} 모든 Canvas 상태
     */
    getAllCanvasStates() {
        return new Map(this.canvasStates);
    }

    /**
     * Canvas 등록 해제
     * @param {string} canvasId - Canvas ID
     */
    unregisterCanvas(canvasId) {
        // ResizeObserver에서 제거
        if (this.resizeObserver) {
            const canvas = this.canvasElements.get(canvasId);
            if (canvas) {
                this.resizeObserver.unobserve(canvas);
            }
        }

        // 캐시에서 제거
        this.canvasElements.delete(canvasId);
        this.contexts.delete(canvasId);
        this.canvasStates.delete(canvasId);
        
        console.log(`Canvas '${canvasId}' unregistered`);
    }

    /**
     * 모든 Canvas 정리
     */
    cleanup() {
        // ResizeObserver 해제
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }

        // 모든 Canvas 등록 해제
        for (const canvasId of this.canvasElements.keys()) {
            this.unregisterCanvas(canvasId);
        }

        // 타이머 정리
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
    }

    /**
     * Canvas 성능 통계 반환
     * @returns {Object} 성능 통계
     */
    getPerformanceStats() {
        const stats = {
            totalCanvases: this.canvasElements.size,
            validCanvases: 0,
            invalidCanvases: 0,
            totalRenders: 0,
            averageRenderTime: 0
        };

        let totalRenderTime = 0;
        
        for (const [canvasId, state] of this.canvasStates) {
            if (state.isValid) {
                stats.validCanvases++;
            } else {
                stats.invalidCanvases++;
            }
            
            stats.totalRenders += state.renderCount;
            if (state.lastRenderTime > 0) {
                totalRenderTime += state.lastRenderTime;
            }
        }

        if (stats.totalRenders > 0) {
            stats.averageRenderTime = totalRenderTime / stats.totalRenders;
        }

        return stats;
    }
}