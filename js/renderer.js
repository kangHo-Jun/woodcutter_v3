/**
 * Canvas 기반 재단 패턴 렌더러
 */

class CuttingRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.padding = 40;
        this.colors = [
            '#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
            '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
        ];
    }

    /**
     * 재단 결과 렌더링
     */
    render(binWidth, binHeight, placedItems, kerf = 0) {
        const scale = this.calculateScale(binWidth, binHeight);

        // 캔버스 크기 조정
        this.canvas.width = binWidth * scale + this.padding * 2;
        this.canvas.height = binHeight * scale + this.padding * 2;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 배경
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 원판 그리기
        this.drawBoard(binWidth, binHeight, scale);

        // 부품들 그리기
        placedItems.forEach((item, index) => {
            this.drawPart(item, scale, index);
        });

        // 치수 표시
        this.drawDimensions(binWidth, binHeight, scale);
    }

    calculateScale(binWidth, binHeight) {
        const maxWidth = Math.min(800, window.innerWidth - 80);
        const maxHeight = 500;
        const scaleX = (maxWidth - this.padding * 2) / binWidth;
        const scaleY = (maxHeight - this.padding * 2) / binHeight;
        return Math.min(scaleX, scaleY, 0.5);
    }

    drawBoard(width, height, scale) {
        const x = this.padding;
        const y = this.padding;
        const w = width * scale;
        const h = height * scale;

        // 원판 배경 (나무색상)
        this.ctx.fillStyle = '#3d2b1f';
        this.ctx.fillRect(x, y, w, h);

        // 나무 무늬 그리기
        this.drawWoodTexture(x, y, w, h, false, true);

        // 원판 테두리
        this.ctx.strokeStyle = '#4a3424';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, w, h);

        // 그리드 (더 연하게)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.lineWidth = 0.5;
        const gridSize = 100 * scale;

        for (let gx = gridSize; gx < w; gx += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + gx, y);
            this.ctx.lineTo(x + gx, y + h);
            this.ctx.stroke();
        }
        for (let gy = gridSize; gy < h; gy += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y + gy);
            this.ctx.lineTo(x + w, y + gy);
            this.ctx.stroke();
        }
    }

    drawWoodTexture(x, y, w, h, rotated, isBoard = false) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(x, y, w, h);
        this.ctx.clip();

        // Base wood color (from approved image style)
        this.ctx.fillStyle = isBoard ? '#E5C49F' : 'rgba(0,0,0,0.05)';
        this.ctx.fillRect(x, y, w, h);

        // More visible grain texture
        this.ctx.strokeStyle = isBoard ? 'rgba(101, 67, 33, 0.3)' : 'rgba(101, 67, 33, 0.2)';
        this.ctx.lineWidth = 1.2;

        // Long grain lines with waves (Standardized to horizontal along width)
        const grainAlongWidth = !rotated;
        const lineSpacing = 15;
        const lineCount = (grainAlongWidth ? h : w) / lineSpacing + 5;

        for (let i = 0; i < lineCount; i++) {
            this.ctx.beginPath();
            let currentPos = 0;
            const targetTotal = grainAlongWidth ? w : h;

            if (grainAlongWidth) {
                this.ctx.moveTo(x, y + i * lineSpacing);
            } else {
                this.ctx.moveTo(x + i * lineSpacing, y);
            }

            while (currentPos < targetTotal) {
                const step = 50 + Math.random() * 50;
                currentPos += step;

                const wave = (Math.random() - 0.5) * 8;
                if (grainAlongWidth) {
                    this.ctx.quadraticCurveTo(
                        x + currentPos - step / 2, y + i * lineSpacing + wave,
                        x + Math.min(w, currentPos), y + i * lineSpacing
                    );
                } else {
                    this.ctx.quadraticCurveTo(
                        x + i * lineSpacing + wave, y + currentPos - step / 2,
                        x + i * lineSpacing, y + Math.min(h, currentPos)
                    );
                }
            }
            this.ctx.stroke();
        }

        // Knots (occasionally)
        if (isBoard && Math.random() > 0.5) {
            this.ctx.beginPath();
            this.ctx.ellipse(
                x + w * 0.3, y + h * 0.4,
                20, 10,
                Math.random(), 0, Math.PI * 2
            );
            this.ctx.fillStyle = 'rgba(101, 67, 33, 0.1)';
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawPart(item, scale, index) {
        const x = this.padding + item.x * scale;
        const y = this.padding + item.y * scale;
        const w = (item.isRotated ? item.height : item.width) * scale;
        const h = (item.isRotated ? item.width : item.height) * scale;

        this.ctx.save();

        // Shadow for depth
        this.ctx.shadowColor = 'rgba(0,0,0,0.1)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 4;

        // Base Part (White minimalist)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x + 1, y + 1, w - 2, h - 2);

        this.ctx.shadowColor = 'transparent';

        // Border
        this.ctx.strokeStyle = '#EEEEEE';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

        // Corner Mark (Optional aesthetic)
        this.ctx.fillStyle = '#00D4AA';
        this.ctx.fillRect(x + 1, y + 1, Math.min(10, w), 2);

        // Label
        const originalW = item.isRotated ? item.height : item.width;
        const originalH = item.isRotated ? item.width : item.height;
        const label = `${originalW}×${originalH}`;

        if (w > 20 && h > 20) {
            this.ctx.fillStyle = '#333333';
            this.ctx.font = `bold ${Math.max(12, 16 * scale)}px Inter, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(label, x + w / 2, y + h / 2);
        }

        this.ctx.restore();
    }

    drawDimensions(width, height, scale) {
        const x = this.padding;
        const y = this.padding;
        const w = width * scale;
        const h = height * scale;

        this.ctx.fillStyle = '#888';
        this.ctx.font = '12px Inter, sans-serif';
        this.ctx.textAlign = 'center';

        // 상단 치수
        this.ctx.fillText(`${width} mm`, x + w / 2, y - 15);

        // 좌측 치수
        this.ctx.save();
        this.ctx.translate(x - 15, y + h / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText(`${height} mm`, 0, 0);
        this.ctx.restore();
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    /**
     * 캔버스를 이미지로 다운로드
     */
    downloadImage() {
        const link = document.createElement('a');
        link.download = `cutting-pattern-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

// 전역 노출
window.CuttingRenderer = CuttingRenderer;
