/**
 * TT-Glücksrad — Konfetti-Partikelsystem
 */

class WheelConfetti {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.running = false;
    }

    burst(x, y, count = 60) {
        // TT balls: white and orange, round
        const colors = ['#fff', '#fff', '#fff', '#f0f0f0', '#ff6b35', '#ff8855', '#ffa060'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 12;
            const r = 2 + Math.random() * 4; // ball radius
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 6,
                r: r,
                rot: 0,
                rotV: 0,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 0.18 + Math.random() * 0.12,
                life: 1,
                decay: 0.006 + Math.random() * 0.008,
            });
        }
        if (!this.running) {
            this.running = true;
            this._loop();
        }
    }

    _loop() {
        const { ctx, canvas, particles } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= 0.99;
            p.life -= p.decay;

            if (p.life <= 0) { particles.splice(i, 1); continue; }

            ctx.globalAlpha = Math.min(1, p.life * 2);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }

        if (particles.length > 0) {
            requestAnimationFrame(() => this._loop());
        } else {
            this.running = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
}
