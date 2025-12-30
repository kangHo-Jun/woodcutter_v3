/**
 * 대장간 V3 - Mobile-First App Logic
 */

/* Removed WheelSelector class */

class CuttingAppMobile {
    constructor() {
        this.currentStep = 1;
        this.currentField = 'boardWidth'; // Start with board width
        this.inputValues = {
            boardWidth: '2400',
            boardHeight: '1220',
            width: '',
            height: '',
            qty: '1'
        };
        this.parts = [];
        this.kerf = 4.2; // Optimized blade size
        this.lastResult = null;
        this.currentBoardIndex = 0;
        this.renderer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStepIndicator();
    }

    bindEvents() {
        // Step Navigation
        document.getElementById('toStep2Btn')?.addEventListener('click', () => this.goToStep(2));
        document.getElementById('toStep1Btn')?.addEventListener('click', () => this.goToStep(1));
        document.getElementById('backToInputBtn')?.addEventListener('click', () => this.goToStep(2));

        // Preset Cards
        document.querySelectorAll('.preset-card:not(.add-preset)').forEach(card => {
            card.addEventListener('click', (e) => this.selectPreset(e.currentTarget));
        });

        // Board Selection (Step 1)
        document.querySelectorAll('[data-board-field]').forEach(field => {
            field.addEventListener('click', (e) => this.selectField(e.currentTarget.dataset.boardField, true, true));
        });

        // Remove Grain Toggle listeners as it's deleted from UI

        // Input Fields (Step 2)
        document.querySelectorAll('.input-field[data-field]').forEach(field => {
            field.addEventListener('click', (e) => {
                this.selectField(e.currentTarget.dataset.field, false, true);
                this.updateNextButtonText();
            });
        });

        // Keypad
        document.querySelectorAll('.key').forEach(key => {
            key.addEventListener('click', (e) => this.handleKeyPress(e.currentTarget.dataset.key));
        });

        // Calculate
        document.getElementById('calculateBtn')?.addEventListener('click', () => this.calculate());

        // Clear All Parts
        document.getElementById('clearAllBtn')?.addEventListener('click', () => this.clearParts());

        // Board Navigation
        document.getElementById('prevBoard')?.addEventListener('click', () => this.navigateBoard(-1));
        document.getElementById('nextBoard')?.addEventListener('click', () => this.navigateBoard(1));

        // PDF Download
        document.getElementById('downloadPdfBtn')?.addEventListener('click', () => this.downloadPDF());

        // Share
        document.getElementById('shareBtn')?.addEventListener('click', () => this.share());

        // Debug Event (Logo click)
        document.querySelector('.logo')?.addEventListener('click', () => this.debug());

        // Step 1: Settings Toggle
        document.getElementById('toggleSettingsBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            const form = document.getElementById('settingsForm');
            const link = e.target;
            if (form.classList.contains('hidden')) {
                form.classList.remove('hidden');
                link.textContent = '설정 숨기기 ›';
            } else {
                form.classList.add('hidden');
                link.textContent = '다른 설정 선택 ›';
            }
        });

        // Step 1: Sync inputs with summary
        ['boardWidth', 'boardHeight', 'boardThickness', 'kerfInput'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => this.updateSettingsSummary());
        });

        // Step 2: Add Part Button
        document.getElementById('addPartBtn')?.addEventListener('click', () => this.addPart());
    }

    // ============================================
    // Step Navigation
    // ============================================

    goToStep(step) {
        const prevStep = this.currentStep;
        this.currentStep = step;

        // Update screen visibility
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active', 'prev');
        });

        const targetScreen = document.getElementById(`step${step}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }

        // Mark previous screens
        for (let i = 1; i < step; i++) {
            const prevScreen = document.getElementById(`step${i}`);
            if (prevScreen) prevScreen.classList.add('prev');
        }

        this.updateStepIndicator();

        // Initialize Step 1: Hide keypad initially
        if (step === 1) {
            this.setKeypadVisibility(false);
            document.querySelectorAll('.input-field').forEach(f => f.classList.remove('active'));
            this.currentField = 'boardWidth';
        }

        // Initialize Step 2 from Step 1
        if (step === 2 && prevStep === 1) {
            this.resetInputFields();
        }

        // Initialize Step 2 from Step 3 (No reset, just hide keypad)
        if (step === 2 && prevStep === 3) {
            this.setKeypadVisibility(false);
            document.querySelectorAll('.input-field').forEach(f => f.classList.remove('active'));
        }

        // Initialize Step 3: Hide keypad
        if (step === 3) {
            this.setKeypadVisibility(false);
        }
    }

    updateStepIndicator() {
        document.querySelectorAll('.step-indicator .step').forEach((stepEl, index) => {
            const stepNum = index + 1;
            stepEl.classList.remove('active', 'done');
            if (stepNum === this.currentStep) {
                stepEl.classList.add('active');
            } else if (stepNum < this.currentStep) {
                stepEl.classList.add('done');
            }
        });
    }

    changeQty(delta) {
        let current = parseInt(this.inputValues.qty) || 1;
        current += delta;
        if (current < 1) current = 1;
        if (current > 100) current = 100;
        this.inputValues.qty = String(current);
        this.updateInputField('qty', current);
    }

    updateSettingsSummary() {
        const w = document.getElementById('boardWidth').value;
        const h = document.getElementById('boardHeight').value;
        const t = document.getElementById('boardThickness').value;
        const k = document.getElementById('kerfInput').value;

        document.getElementById('displayBoardSize').textContent = `${w} × ${h} mm`;
        document.getElementById('displayThickness').textContent = `${t} mm`;
        document.getElementById('displayKerf').textContent = `${k} mm`;

        // Also update home screen title if it matches default
        const title = document.querySelector('.home-title');
        if (title) title.textContent = `합판 ${t}T`;
    }

    // ============================================
    // Step 1: Settings
    // ============================================

    selectPreset(card) {
        // Remove active from all
        document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const w = card.dataset.w;
        const h = card.dataset.h;
        const t = card.dataset.t;
        const k = card.dataset.k;

        // Update hidden inputs
        document.getElementById('boardWidth').value = w;
        document.getElementById('boardHeight').value = h;
        document.getElementById('boardThickness').value = t;
        document.getElementById('kerfInput').value = k;
        this.kerf = parseInt(k);

        // Update display
        document.getElementById('displayBoardSize').textContent = `${w} × ${h} mm`;
        document.getElementById('displayThickness').textContent = `${t} mm`;
        document.getElementById('displayKerf').textContent = `${k} mm`;
    }

    // ============================================
    // Step 2: Parts Input
    // ============================================

    selectField(field, isBoard = false, showKeypad = true) {
        this.currentField = field;

        // Remove active from all
        document.querySelectorAll('.input-field').forEach(f => f.classList.remove('active'));

        // Add active to correct one
        const selector = isBoard ? `[data-board-field="${field}"]` : `[data-field="${field}"]`;
        const fieldEl = document.querySelector(selector);
        if (fieldEl) fieldEl.classList.add('active');

        if (field === 'qty') {
            this.setKeypadVisibility(false);
            return;
        }

        // Clear field on click as requested: "가로, 세로를 클릭하면 값이 초기화되어야 한다"
        this.inputValues[field] = '';
        this.updateInputField(field, '');

        // Handle Keypad Visibility
        if (showKeypad) {
            this.setKeypadVisibility(true);

            // Scroll field into view
            setTimeout(() => {
                fieldEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }

    setKeypadVisibility(visible) {
        const keypad = document.querySelector('.keypad-container');
        if (!keypad) return;

        if (visible) {
            keypad.classList.remove('hidden');
            // Resize active screen to avoid overlap
            document.querySelectorAll('.screen').forEach(s => s.classList.add('has-keypad'));
        } else {
            keypad.classList.add('hidden');
            document.querySelectorAll('.screen').forEach(s => s.classList.remove('has-keypad'));
        }
    }

    updateInputField(field, value) {
        if (this.currentStep === 1) {
            // Handle board fields in Step 1
            if (field === 'boardWidth') {
                const displayEl = document.getElementById('displayBoardWidth');
                if (displayEl) displayEl.textContent = value || '-';
                const realEl = document.getElementById('boardWidth');
                if (realEl) realEl.value = value;
            } else if (field === 'boardHeight') {
                const displayEl = document.getElementById('displayBoardHeight');
                if (displayEl) displayEl.textContent = value || '-';
                const realEl = document.getElementById('boardHeight');
                if (realEl) realEl.value = value;
            }
        } else {
            const displayId = field === 'qty' ? 'displayQty' : `input${field.charAt(0).toUpperCase() + field.slice(1)}`;
            const element = document.getElementById(displayId);
            if (element) {
                element.textContent = value || '';
                // Add a placeholder-like state if empty
                if (!value) element.innerHTML = '<span style="color:var(--text-dim); opacity:0.3">0</span>';
            }
        }
    }

    handleKeyPress(key) {
        let currentValue = this.inputValues[this.currentField];

        switch (key) {
            case 'C':
                this.inputValues[this.currentField] = '';
                break;

            case '←':
                if (currentValue.length > 0) {
                    this.inputValues[this.currentField] = currentValue.slice(0, -1);
                }
                break;

            case '+50':
            case '+100':
                const addValue = parseInt(key.replace('+', ''));
                const current = parseInt(currentValue) || 0;
                this.inputValues[this.currentField] = String(current + addValue);
                break;

            case 'next':
                if (this.currentStep === 1) {
                    if (this.currentField === 'boardWidth') {
                        this.selectField('boardHeight', true, true);
                    } else {
                        this.goToStep(2);
                    }
                } else {
                    const fieldOrder = ['width', 'height'];
                    const currentIndex = fieldOrder.indexOf(this.currentField);
                    if (currentIndex < fieldOrder.length - 1) {
                        this.selectField(fieldOrder[currentIndex + 1], false, true);
                    } else {
                        this.addPart();
                    }
                }
                return;

            case '00':
                if (currentValue.length > 0 && currentValue !== '0') {
                    this.inputValues[this.currentField] = currentValue + '00';
                }
                break;

            default:
                if (currentValue === '' && key === '0') return;
                this.inputValues[this.currentField] = currentValue + key;
                break;
        }

        // Update display
        this.updateInputField(this.currentField, this.inputValues[this.currentField]);

        // Update next button text
        this.updateNextButtonText();
    }

    handleNext() {
        const fieldOrder = ['width', 'height', 'qty'];
        const currentIndex = fieldOrder.indexOf(this.currentField);

        if (currentIndex < fieldOrder.length - 1) {
            // Move to next field
            this.selectField(fieldOrder[currentIndex + 1], false, true);
        } else {
            // Add part
            this.addPart();
        }
    }

    updateNextButtonText() {
        const btn = document.getElementById('keyNext');
        if (!btn) return;

        if (this.currentStep === 1) {
            btn.textContent = this.currentField === 'boardHeight' ? '입력 완료' : '다음';
        } else {
            const fieldOrder = ['width', 'height'];
            const currentIndex = fieldOrder.indexOf(this.currentField);
            btn.textContent = currentIndex < fieldOrder.length - 1 ? '다음' : '추가하기';
        }
    }

    addPart() {
        const w = parseInt(this.inputValues.width);
        const h = parseInt(this.inputValues.height);
        const qty = parseInt(this.inputValues.qty) || 1;

        if (!w || !h || w <= 0 || h <= 0) {
            this.showToast('가로와 세로를 입력하세요', 'error');
            return;
        }

        const rotatable = document.getElementById('partRotatable')?.checked ?? true;

        this.parts.push({ width: w, height: h, qty, rotatable });
        this.renderPartsList();
        this.resetInputFields();
        this.showToast(`${w}×${h} ×${qty} 추가됨`, 'success');
    }

    resetInputFields() {
        this.inputValues.width = '';
        this.inputValues.height = '';
        // Keep qty as is

        this.updateInputField('width', '');
        this.updateInputField('height', '');
        this.updateInputField('qty', this.inputValues.qty);
        // Select width but DO NOT OPEN KEYPAD (wait for user)
        this.selectField('width', false, false);
    }

    renderPartsList() {
        const container = document.getElementById('partsList');
        if (!container) return;

        container.innerHTML = this.parts.map((part, index) => `
            <div class="part-item">
                <span class="part-info">
                    ${part.width}×${part.height}
                    <span class="part-qty">×${part.qty}</span>
                </span>
                <button class="part-delete" onclick="app.removePart(${index})">×</button>
            </div>
        `).join('');

        const totalParts = this.parts.reduce((sum, p) => sum + p.qty, 0);
        document.getElementById('partsCount').textContent = `절단 ${totalParts}개`;
    }

    removePart(index) {
        this.parts.splice(index, 1);
        this.renderPartsList();
    }

    clearParts() {
        this.parts = [];
        this.renderPartsList();
    }

    // ============================================
    // Step 3: Calculate & Results
    // ============================================

    calculate() {
        if (this.parts.length === 0) {
            this.showToast('부품을 추가해주세요', 'error');
            return;
        }

        let boardW = parseInt(document.getElementById('boardWidth').value);
        let boardH = parseInt(document.getElementById('boardHeight').value);
        const thickness = parseInt(document.getElementById('boardThickness').value);
        const preCutting = document.getElementById('preCutting')?.checked ?? false;

        // Apply pre-cutting logic (12mm each side = 24mm total)
        if (preCutting) {
            boardW -= 24;
            boardH -= 24;
        }

        // Use packer
        const packer = new GuillotinePacker(boardW, boardH, this.kerf);
        const result = packer.pack(this.parts);

        this.lastResult = result;
        this.currentBoardIndex = 0;

        // Calculate stats
        const totalCuts = result.bins.reduce((sum, bin) => sum + (bin.cuttingCount || 0), 0);
        const cost = this.calculateCuttingCost(thickness, totalCuts, preCutting, result.bins.length);
        const efficiency = result.totalEfficiency || 0;

        // Update UI
        document.getElementById('statCost').textContent = cost.toLocaleString() + '원';
        document.getElementById('statCuts').textContent = totalCuts + '회';
        document.getElementById('statBoards').textContent = result.bins.length + '장';
        document.getElementById('statEfficiency').textContent = efficiency.toFixed(1) + '%';

        // Results page labels
        const boardSizeLabel = document.getElementById('boardSizeLabel');
        if (boardSizeLabel) boardSizeLabel.textContent = `${boardW} × ${boardH} mm`;

        // Render canvas
        this.renderResult();

        // Go to Step 3
        this.goToStep(3);
    }

    calculateCuttingCost(thickness, totalCuts, isPreCut, binCount) {
        let costPerCut = 1000;
        if (thickness >= 13 && thickness <= 23) {
            costPerCut = 1500;
        } else if (thickness >= 24) {
            costPerCut = 2000;
        }
        return totalCuts * costPerCut;
    }

    renderResult() {
        if (!this.lastResult || this.lastResult.bins.length === 0) return;

        const bin = this.lastResult.bins[this.currentBoardIndex];
        const canvas = document.getElementById('resultCanvas');
        if (!canvas) return;

        // Initialize renderer if needed
        if (!this.renderer) {
            this.renderer = new CuttingRenderer('resultCanvas');
        }

        const boardW = parseInt(document.getElementById('boardWidth').value);
        const boardH = parseInt(document.getElementById('boardHeight').value);

        this.renderer.render(boardW, boardH, bin.placed, this.kerf);

        // Update indicator
        document.getElementById('boardIndicator').textContent =
            `${this.currentBoardIndex + 1} / ${this.lastResult.bins.length}`;
    }

    navigateBoard(delta) {
        if (!this.lastResult) return;
        const newIndex = this.currentBoardIndex + delta;
        if (newIndex >= 0 && newIndex < this.lastResult.bins.length) {
            this.currentBoardIndex = newIndex;
            this.renderResult();
        }
    }

    // ============================================
    // Export & Share
    // ============================================

    downloadPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const canvas = document.getElementById('resultCanvas');

        doc.setFontSize(20);
        doc.text('Wood Cutter 재단 도면', 20, 20);

        doc.setFontSize(12);
        doc.text(`원판: ${document.getElementById('boardWidth').value} x ${document.getElementById('boardHeight').value}`, 20, 30);
        doc.text(`비용: ${document.getElementById('statCost').textContent}`, 20, 38);
        doc.text(`효율: ${document.getElementById('statEfficiency').textContent}`, 20, 46);

        if (canvas) {
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 20, 60, 170, 0);
        }

        doc.save(`woodcutter-result-${Date.now()}.pdf`);
        this.showToast('PDF 다운로드가 시작되었습니다', 'success');
    }

    share() {
        const cost = document.getElementById('statCost').textContent;
        const cuts = document.getElementById('statCuts').textContent;
        const shareText = `[대장간 V3] 재단 결과\n💰 예상 비용: ${cost}\n✂️ 절단 횟수: ${cuts}\n\n도면 결과가 이미지로 공유되었습니다.`;

        // If Web Share API supports files (png from canvas)
        const canvas = document.getElementById('resultCanvas');
        if (navigator.share && canvas) {
            canvas.toBlob((blob) => {
                const file = new File([blob], 'result.png', { type: 'image/png' });
                navigator.share({
                    files: [file],
                    title: '대장간 V3 재단 결과',
                    text: shareText,
                }).catch(() => {
                    // Fallback to text
                    navigator.share({
                        title: '대장간 V3 재단 결과',
                        text: shareText,
                    });
                });
            });
        } else {
            // Very simple fallback for desktop or older browsers
            navigator.clipboard.writeText(shareText);
            this.showToast('결과가 클립보드에 복사되었습니다 (카톡/메세지에 붙여넣으세요)', 'success');
        }
    }

    // ============================================
    // Utilities
    // ============================================

    showToast(message, type = 'info') {
        // Simple toast implementation
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#FF6B6B' : type === 'success' ? '#00D4AA' : '#2D2D2D'};
            color: ${type === 'info' ? '#F5F5F5' : '#1A1A1A'};
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 9999;
            animation: fadeInUp 0.3s ease;
        `;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    // ============================================
    // Debugging
    // ============================================

    debug() {
        console.group('/debug - Application State');
        console.log('Current Step:', this.currentStep);
        console.log('Current Field:', this.currentField);
        console.log('Input Values:', { ...this.inputValues });
        console.log('Parts:', [...this.parts]);
        console.log('Last Result:', this.lastResult);
        console.log('Board Specs:', {
            width: document.getElementById('boardWidth')?.value,
            height: document.getElementById('boardHeight')?.value,
            thickness: document.getElementById('boardThickness')?.value,
            kerf: this.kerf
        });
        console.groupEnd();

        this.showToast('디버그 정보가 콘솔에 출력되었습니다', 'success');
    }
}

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CuttingAppMobile();
});
