// 시뮬레이션 제어 유틸리티

/**
 * 시뮬레이션 실행을 제어하는 클래스
 */
export class SimulationController {
    constructor() {
        this.isRunning = false;
        this.isPaused = false;
        this.progress = 0;
        this.abortController = null;
        this.startTime = null;
        this.pauseTime = null;
        this.totalPauseTime = 0;
        this.progressCallbacks = [];
        this.statusCallbacks = [];
    }

    /**
     * 진행 상황 콜백 등록
     * @param {Function} callback - 콜백 함수
     */
    onProgress(callback) {
        if (typeof callback === 'function') {
            this.progressCallbacks.push(callback);
        }
    }

    /**
     * 상태 변경 콜백 등록
     * @param {Function} callback - 콜백 함수
     */
    onStatusChange(callback) {
        if (typeof callback === 'function') {
            this.statusCallbacks.push(callback);
        }
    }

    /**
     * 시뮬레이션 시작
     * @param {Object} parameters - 시뮬레이션 파라미터
     * @param {Function} simulationFunction - 시뮬레이션 함수
     * @returns {Promise} 시뮬레이션 결과
     */
    async start(parameters, simulationFunction) {
        if (this.isRunning) {
            throw new Error('시뮬레이션이 이미 실행 중입니다.');
        }

        try {
            this.isRunning = true;
            this.isPaused = false;
            this.progress = 0;
            this.startTime = Date.now();
            this.totalPauseTime = 0;
            this.abortController = new AbortController();

            this.notifyStatusChange('started');

            // 파라미터 유효성 검증
            this.validateParameters(parameters);

            // 진행 상황 콜백 함수
            const progressCallback = (progress, stage) => {
                if (this.abortController.signal.aborted) {
                    throw new Error('시뮬레이션이 취소되었습니다.');
                }

                this.updateProgress(progress, stage);
            };

            // 시뮬레이션 실행
            const result = await simulationFunction(parameters, progressCallback, this.abortController.signal);

            this.notifyStatusChange('completed');
            return result;

        } catch (error) {
            this.notifyStatusChange('error', error);
            throw error;
        } finally {
            this.isRunning = false;
            this.isPaused = false;
            this.abortController = null;
        }
    }

    /**
     * 시뮬레이션 일시 정지
     */
    pause() {
        if (!this.isRunning || this.isPaused) {
            return;
        }

        this.isPaused = true;
        this.pauseTime = Date.now();
        this.notifyStatusChange('paused');
    }

    /**
     * 시뮬레이션 재개
     */
    resume() {
        if (!this.isRunning || !this.isPaused) {
            return;
        }

        if (this.pauseTime) {
            this.totalPauseTime += Date.now() - this.pauseTime;
            this.pauseTime = null;
        }

        this.isPaused = false;
        this.notifyStatusChange('resumed');
    }

    /**
     * 시뮬레이션 취소
     */
    cancel() {
        if (!this.isRunning) {
            return;
        }

        if (this.abortController) {
            this.abortController.abort();
        }

        this.notifyStatusChange('cancelled');
    }

    /**
     * 진행 상황 업데이트
     * @param {number} progress - 진행률 (0-100)
     * @param {string} stage - 현재 단계
     */
    updateProgress(progress, stage = '') {
        this.progress = Math.max(0, Math.min(100, progress));
        
        const progressInfo = {
            progress: this.progress,
            stage,
            elapsedTime: this.getElapsedTime(),
            estimatedTimeRemaining: this.getEstimatedTimeRemaining()
        };

        this.notifyProgress(progressInfo);
    }

    /**
     * 경과 시간 계산
     * @returns {number} 경과 시간 (밀리초)
     */
    getElapsedTime() {
        if (!this.startTime) return 0;
        
        const currentTime = this.isPaused ? this.pauseTime : Date.now();
        return currentTime - this.startTime - this.totalPauseTime;
    }

    /**
     * 예상 남은 시간 계산
     * @returns {number} 예상 남은 시간 (밀리초)
     */
    getEstimatedTimeRemaining() {
        if (this.progress <= 0) return 0;
        
        const elapsedTime = this.getElapsedTime();
        const totalEstimatedTime = (elapsedTime / this.progress) * 100;
        return Math.max(0, totalEstimatedTime - elapsedTime);
    }

    /**
     * 파라미터 유효성 검증
     * @param {Object} parameters - 시뮬레이션 파라미터
     */
    validateParameters(parameters) {
        const required = [
            'initialPrice', 'volatility', 'drift', 'timeHorizon', 
            'numSimulations', 'triggerThreshold', 'insurancePremium', 'payoutAmount'
        ];

        for (const param of required) {
            if (!(param in parameters)) {
                throw new Error(`필수 파라미터가 누락되었습니다: ${param}`);
            }
        }

        // 값 범위 검증
        if (parameters.initialPrice <= 0) {
            throw new Error('초기 주가는 0보다 커야 합니다.');
        }

        if (parameters.volatility < 0 || parameters.volatility > 200) {
            throw new Error('변동성은 0-200% 범위여야 합니다.');
        }

        if (parameters.timeHorizon <= 0 || parameters.timeHorizon > 10000) {
            throw new Error('시뮬레이션 기간은 1-10000일 범위여야 합니다.');
        }

        if (parameters.numSimulations < 100 || parameters.numSimulations > 1000000) {
            throw new Error('시뮬레이션 횟수는 100-1,000,000 범위여야 합니다.');
        }

        if (parameters.triggerThreshold <= 0 || parameters.triggerThreshold > 100) {
            throw new Error('트리거 임계값은 0-100% 범위여야 합니다.');
        }

        if (parameters.insurancePremium < 0 || parameters.insurancePremium > 50) {
            throw new Error('보험료율은 0-50% 범위여야 합니다.');
        }

        if (parameters.payoutAmount <= 0) {
            throw new Error('보험금 지급액은 0보다 커야 합니다.');
        }

        // 메모리 사용량 추정
        const estimatedMemoryMB = this.estimateMemoryUsage(parameters);
        const availableMemoryMB = this.getAvailableMemory();
        
        if (estimatedMemoryMB > availableMemoryMB * 0.8) {
            throw new Error(`메모리 부족: 예상 사용량 ${estimatedMemoryMB.toFixed(1)}MB, 사용 가능 ${availableMemoryMB.toFixed(1)}MB`);
        }
    }

    /**
     * 메모리 사용량 추정
     * @param {Object} parameters - 시뮬레이션 파라미터
     * @returns {number} 예상 메모리 사용량 (MB)
     */
    estimateMemoryUsage(parameters) {
        const { numSimulations, timeHorizon } = parameters;
        
        // 각 시뮬레이션당 대략적인 메모리 사용량 (바이트)
        const bytesPerSimulation = timeHorizon * 8; // 8바이트 (double) per price point
        const bytesPerResult = 16; // final price + payout
        const samplePaths = Math.min(100, numSimulations);
        const bytesForSamplePaths = samplePaths * timeHorizon * 8;
        
        const totalBytes = (numSimulations * bytesPerResult) + bytesForSamplePaths + (numSimulations * 8);
        return totalBytes / (1024 * 1024); // MB로 변환
    }

    /**
     * 사용 가능한 메모리 추정
     * @returns {number} 사용 가능한 메모리 (MB)
     */
    getAvailableMemory() {
        // 브라우저별 메모리 제한 추정
        if (navigator.deviceMemory) {
            return navigator.deviceMemory * 1024 * 0.5; // 50% 사용 가능하다고 가정
        }
        
        // 기본값: 2GB
        return 2048;
    }

    /**
     * 진행 상황 알림
     * @param {Object} progressInfo - 진행 정보
     */
    notifyProgress(progressInfo) {
        this.progressCallbacks.forEach(callback => {
            try {
                callback(progressInfo);
            } catch (error) {
                console.error('Progress callback error:', error);
            }
        });
    }

    /**
     * 상태 변경 알림
     * @param {string} status - 상태
     * @param {Error} error - 오류 (선택사항)
     */
    notifyStatusChange(status, error = null) {
        const statusInfo = {
            status,
            timestamp: Date.now(),
            elapsedTime: this.getElapsedTime(),
            error
        };

        this.statusCallbacks.forEach(callback => {
            try {
                callback(statusInfo);
            } catch (err) {
                console.error('Status callback error:', err);
            }
        });
    }

    /**
     * 현재 상태 반환
     * @returns {Object} 현재 상태
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            progress: this.progress,
            elapsedTime: this.getElapsedTime(),
            estimatedTimeRemaining: this.getEstimatedTimeRemaining()
        };
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        if (this.isRunning) {
            this.cancel();
        }
        
        this.progressCallbacks = [];
        this.statusCallbacks = [];
    }
}