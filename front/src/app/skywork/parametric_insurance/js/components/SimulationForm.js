// 시뮬레이션 폼 컴포넌트

/**
 * 시뮬레이션 파라미터 입력 폼을 관리하는 클래스
 */
export class SimulationForm {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.isDisabled = false;
        this.validationRules = this.setupValidationRules();
        this.setupEventListeners();
        this.setupTooltips();
        this.setupPresets();
    }

    /**
     * 유효성 검사 규칙 설정
     * @returns {Object} 유효성 검사 규칙
     */
    setupValidationRules() {
        return {
            'initial-price': {
                min: 1000,
                max: 10000000,
                step: 1000,
                required: true,
                message: '초기 주가는 1,000원 이상 10,000,000원 이하여야 합니다.'
            },
            'volatility': {
                min: 1,
                max: 100,
                step: 1,
                required: true,
                message: '변동성은 1% 이상 100% 이하여야 합니다.'
            },
            'drift': {
                min: -50,
                max: 50,
                step: 0.1,
                required: true,
                message: '드리프트는 -50% 이상 50% 이하여야 합니다.'
            },
            'time-horizon': {
                min: 1,
                max: 1000,
                step: 1,
                required: true,
                message: '시뮬레이션 기간은 1일 이상 1,000일 이하여야 합니다.'
            },
            'num-simulations': {
                min: 100,
                max: 100000,
                step: 100,
                required: true,
                message: '시뮬레이션 횟수는 100회 이상 100,000회 이하여야 합니다.'
            },
            'trigger-threshold': {
                min: 1,
                max: 50,
                step: 1,
                required: true,
                message: '트리거 임계값은 1% 이상 50% 이하여야 합니다.'
            },
            'insurance-premium': {
                min: 0.1,
                max: 10,
                step: 0.1,
                required: true,
                message: '보험료율은 0.1% 이상 10% 이하여야 합니다.'
            },
            'payout-amount': {
                min: 100000,
                max: 1000000000,
                step: 100000,
                required: true,
                message: '보험금 지급액은 100,000원 이상이어야 합니다.'
            }
        };
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        if (!this.form) return;

        // 폼 제출 이벤트
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // 실시간 유효성 검사
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.validateField(e.target);
                this.updateEstimatedTime();
            });

            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });

            // 포커스 효과
            input.addEventListener('focus', (e) => {
                this.addFocusEffect(e.target);
            });

            input.addEventListener('blur', (e) => {
                this.removeFocusEffect(e.target);
            });
        });

        // 키보드 단축키
        this.form.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.handleSubmit();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetForm();
                        break;
                }
            }
        });
    }

    /**
     * 툴팁 설정
     */
    setupTooltips() {
        const tooltipData = {
            'initial-price': '시뮬레이션 시작 시점의 주가입니다. 일반적으로 현재 주가를 입력합니다.',
            'volatility': '주가의 연간 변동성입니다. 높을수록 주가 변동이 큽니다.',
            'drift': '주가의 연간 기대 수익률입니다. 양수면 상승, 음수면 하락 추세를 의미합니다.',
            'time-horizon': '시뮬레이션할 기간입니다. 252일은 약 1년(거래일 기준)입니다.',
            'num-simulations': '몬테카를로 시뮬레이션 횟수입니다. 많을수록 정확하지만 시간이 오래 걸립니다.',
            'trigger-threshold': '보험금 지급 조건이 되는 주가 하락률입니다.',
            'insurance-premium': '초기 주가 대비 보험료 비율입니다.',
            'payout-amount': '조건 충족 시 지급되는 보험금 액수입니다.'
        };

        Object.entries(tooltipData).forEach(([id, text]) => {
            const input = document.getElementById(id);
            if (input) {
                const label = input.previousElementSibling;
                if (label) {
                    label.innerHTML += ` <span class="tooltip">
                        <svg class="w-4 h-4 inline text-text-muted cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="tooltiptext">${text}</span>
                    </span>`;
                }
            }
        });
    }

    /**
     * 프리셋 설정
     */
    setupPresets() {
        const presetContainer = document.createElement('div');
        presetContainer.className = 'mt-6 p-4 bg-dark-elevated rounded-lg border border-dark-border';
        presetContainer.innerHTML = `
            <h4 class="text-sm font-medium text-text-primary mb-3">빠른 설정</h4>
            <div class="grid grid-cols-2 gap-2">
                <button type="button" class="preset-btn" data-preset="conservative">
                    보수적
                </button>
                <button type="button" class="preset-btn" data-preset="moderate">
                    중간
                </button>
                <button type="button" class="preset-btn" data-preset="aggressive">
                    공격적
                </button>
                <button type="button" class="preset-btn" data-preset="custom">
                    사용자정의
                </button>
            </div>
        `;

        // 프리셋 버튼 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            .preset-btn {
                padding: 0.5rem 0.75rem;
                background: #334155;
                color: #e2e8f0;
                border: 1px solid #475569;
                border-radius: 0.375rem;
                font-size: 0.75rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .preset-btn:hover {
                background: #475569;
                border-color: #64748b;
            }
            .preset-btn.active {
                background: #3b82f6;
                border-color: #3b82f6;
                color: white;
            }
        `;
        document.head.appendChild(style);

        // 폼 끝에 프리셋 컨테이너 추가
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.parentNode.insertBefore(presetContainer, submitButton);
        }

        // 프리셋 버튼 이벤트 리스너
        presetContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('preset-btn')) {
                this.applyPreset(e.target.dataset.preset);
                
                // 활성 상태 업데이트
                presetContainer.querySelectorAll('.preset-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            }
        });
    }

    /**
     * 프리셋 적용
     * @param {string} presetType - 프리셋 타입
     */
    applyPreset(presetType) {
        const presets = {
            conservative: {
                'initial-price': 100000,
                'volatility': 15,
                'drift': 3,
                'time-horizon': 252,
                'num-simulations': 5000,
                'trigger-threshold': 15,
                'insurance-premium': 0.8,
                'payout-amount': 5000000
            },
            moderate: {
                'initial-price': 100000,
                'volatility': 25,
                'drift': 5,
                'time-horizon': 252,
                'num-simulations': 10000,
                'trigger-threshold': 10,
                'insurance-premium': 0.6,
                'payout-amount': 10000000
            },
            aggressive: {
                'initial-price': 100000,
                'volatility': 35,
                'drift': 8,
                'time-horizon': 252,
                'num-simulations': 15000,
                'trigger-threshold': 5,
                'insurance-premium': 0.4,
                'payout-amount': 15000000
            },
            custom: {
                'initial-price': 100000,
                'volatility': 25,
                'drift': 5,
                'time-horizon': 252,
                'num-simulations': 10000,
                'trigger-threshold': 10,
                'insurance-premium': 0.6,
                'payout-amount': 10000000
            }
        };

        const preset = presets[presetType];
        if (preset) {
            Object.entries(preset).forEach(([id, value]) => {
                const input = document.getElementById(id);
                if (input) {
                    input.value = value;
                    this.validateField(input);
                }
            });
            
            this.updateEstimatedTime();
            this.showMessage(`${presetType === 'custom' ? '기본' : presetType} 설정이 적용되었습니다.`, 'info');
        }
    }

    /**
     * 폼 제출 처리
     */
    handleSubmit() {
        if (this.isDisabled) return;

        // 전체 유효성 검사
        if (!this.validateForm()) {
            this.showMessage('입력값을 확인해주세요.', 'error');
            return;
        }

        // 파라미터 수집
        const parameters = this.collectParameters();
        
        // 시뮬레이션 시작 이벤트 발생
        const event = new CustomEvent('simulationStart', {
            detail: { parameters }
        });
        document.dispatchEvent(event);
    }

    /**
     * 파라미터 수집
     * @returns {Object} 시뮬레이션 파라미터
     */
    collectParameters() {
        return {
            initialPrice: parseFloat(document.getElementById('initial-price').value),
            volatility: parseFloat(document.getElementById('volatility').value) / 100,
            drift: parseFloat(document.getElementById('drift').value) / 100,
            timeHorizon: parseInt(document.getElementById('time-horizon').value),
            numSimulations: parseInt(document.getElementById('num-simulations').value),
            triggerThreshold: parseFloat(document.getElementById('trigger-threshold').value) / 100,
            insurancePremium: parseFloat(document.getElementById('insurance-premium').value),
            payoutAmount: parseFloat(document.getElementById('payout-amount').value)
        };
    }

    /**
     * 전체 폼 유효성 검사
     * @returns {boolean} 유효성 검사 결과
     */
    validateForm() {
        let isValid = true;
        const inputs = this.form.querySelectorAll('input');
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * 개별 필드 유효성 검사
     * @param {HTMLInputElement} input - 입력 필드
     * @returns {boolean} 유효성 검사 결과
     */
    validateField(input) {
        const rule = this.validationRules[input.id];
        if (!rule) return true;

        const value = parseFloat(input.value);
        let isValid = true;
        let errorMessage = '';

        // 필수 값 검사
        if (rule.required && (isNaN(value) || input.value.trim() === '')) {
            isValid = false;
            errorMessage = '필수 입력 항목입니다.';
        }
        // 범위 검사
        else if (!isNaN(value)) {
            if (rule.min !== undefined && value < rule.min) {
                isValid = false;
                errorMessage = `최소값은 ${rule.min}입니다.`;
            } else if (rule.max !== undefined && value > rule.max) {
                isValid = false;
                errorMessage = `최대값은 ${rule.max}입니다.`;
            }
        }

        // UI 업데이트
        this.updateFieldValidation(input, isValid, errorMessage);
        
        return isValid;
    }

    /**
     * 필드 유효성 검사 UI 업데이트
     * @param {HTMLInputElement} input - 입력 필드
     * @param {boolean} isValid - 유효성 여부
     * @param {string} errorMessage - 오류 메시지
     */
    updateFieldValidation(input, isValid, errorMessage) {
        const container = input.closest('.input-group') || input.parentElement;
        let errorElement = container.querySelector('.error-message');

        if (isValid) {
            input.classList.remove('border-red-500');
            input.classList.add('border-green-500');
            if (errorElement) {
                errorElement.remove();
            }
        } else {
            input.classList.remove('border-green-500');
            input.classList.add('border-red-500');
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message text-red-400 text-xs mt-1';
                container.appendChild(errorElement);
            }
            errorElement.textContent = errorMessage;
        }
    }

    /**
     * 예상 실행 시간 업데이트
     */
    updateEstimatedTime() {
        const numSimulations = parseInt(document.getElementById('num-simulations')?.value) || 10000;
        const timeHorizon = parseInt(document.getElementById('time-horizon')?.value) || 252;
        
        // 대략적인 실행 시간 계산 (경험적 공식)
        const estimatedSeconds = (numSimulations * timeHorizon) / 100000;
        const estimatedTime = estimatedSeconds < 1 ? '1초 미만' : 
                             estimatedSeconds < 60 ? `약 ${Math.ceil(estimatedSeconds)}초` :
                             `약 ${Math.ceil(estimatedSeconds / 60)}분`;

        // 예상 시간 표시 요소 찾기 또는 생성
        let timeElement = document.getElementById('estimated-time');
        if (!timeElement) {
            timeElement = document.createElement('div');
            timeElement.id = 'estimated-time';
            timeElement.className = 'text-xs text-text-muted mt-2 text-center';
            
            const submitButton = this.form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.parentNode.insertBefore(timeElement, submitButton.nextSibling);
            }
        }
        
        timeElement.textContent = `예상 실행 시간: ${estimatedTime}`;
    }

    /**
     * 포커스 효과 추가
     * @param {HTMLInputElement} input - 입력 필드
     */
    addFocusEffect(input) {
        const container = input.closest('.input-group') || input.parentElement;
        container.classList.add('focused');
    }

    /**
     * 포커스 효과 제거
     * @param {HTMLInputElement} input - 입력 필드
     */
    removeFocusEffect(input) {
        const container = input.closest('.input-group') || input.parentElement;
        container.classList.remove('focused');
    }

    /**
     * 폼 비활성화/활성화
     * @param {boolean} disabled - 비활성화 여부
     */
    setDisabled(disabled) {
        this.isDisabled = disabled;
        const inputs = this.form.querySelectorAll('input, button');
        
        inputs.forEach(input => {
            input.disabled = disabled;
            if (disabled) {
                input.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                input.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });

        // 제출 버튼 텍스트 변경
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            const buttonText = submitButton.querySelector('span');
            if (buttonText) {
                buttonText.textContent = disabled ? '시뮬레이션 실행 중...' : '시뮬레이션 실행';
            }
        }
    }

    /**
     * 폼 초기화
     */
    resetForm() {
        this.form.reset();
        
        // 유효성 검사 상태 초기화
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('border-red-500', 'border-green-500');
            const container = input.closest('.input-group') || input.parentElement;
            const errorElement = container.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        });

        // 기본 프리셋 적용
        this.applyPreset('moderate');
        
        this.showMessage('폼이 초기화되었습니다.', 'info');
    }

    /**
     * 메시지 표시
     * @param {string} message - 메시지 내용
     * @param {string} type - 메시지 타입 (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `form-message notification ${type} show`;
        messageElement.innerHTML = `
            <div class="flex items-center">
                ${this.getMessageIcon(type)}
                <span>${message}</span>
                <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(messageElement);

        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.classList.remove('show');
                setTimeout(() => messageElement.remove(), 300);
            }
        }, 3000);
    }

    /**
     * 메시지 아이콘 반환
     * @param {string} type - 메시지 타입
     * @returns {string} 아이콘 HTML
     */
    getMessageIcon(type) {
        const icons = {
            success: '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>',
            error: '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
            warning: '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>',
            info: '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
        };
        return icons[type] || icons.info;
    }

    /**
     * 폼 데이터 내보내기
     * @returns {Object} 폼 데이터
     */
    exportFormData() {
        return {
            parameters: this.collectParameters(),
            timestamp: new Date().toISOString(),
            version: '2.0'
        };
    }

    /**
     * 폼 데이터 가져오기
     * @param {Object} data - 가져올 데이터
     */
    importFormData(data) {
        if (data.parameters) {
            const parameterMapping = {
                initialPrice: 'initial-price',
                volatility: 'volatility',
                drift: 'drift',
                timeHorizon: 'time-horizon',
                numSimulations: 'num-simulations',
                triggerThreshold: 'trigger-threshold',
                insurancePremium: 'insurance-premium',
                payoutAmount: 'payout-amount'
            };

            Object.entries(data.parameters).forEach(([key, value]) => {
                const inputId = parameterMapping[key];
                const input = document.getElementById(inputId);
                if (input) {
                    // 백분율 값 변환
                    if (['volatility', 'drift', 'trigger-threshold'].includes(inputId)) {
                        input.value = value * 100;
                    } else {
                        input.value = value;
                    }
                    this.validateField(input);
                }
            });

            this.updateEstimatedTime();
            this.showMessage('설정이 성공적으로 불러와졌습니다.', 'success');
        }
    }
}