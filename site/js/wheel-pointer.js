/**
 * TT-Glücksrad — Pointer Rigid-Body Physics
 *
 * Simple impulse model: every time a peg crosses the pointer,
 * the pointer gets kicked away. Spring + damping pull it back.
 * At high speed: kicks come faster than the spring restores → pointer stays deflected.
 * At low speed: pointer swings back between kicks → visible bounces.
 */

class WheelPointer {
    constructor(element) {
        this.el = element;
        this.angle = 0;         // deflection (degrees)
        this.velocity = 0;      // deg/s
        this.mass = 2.0;        // higher = heavier, more sluggish
        this.stiffness = 180;   // restoring spring
        this.damping = 12;      // pivot friction
        this.maxDeflection = 30;
        this._lastPegIdx = null;
    }

    /**
     * Call every frame with current wheel state.
     * Returns true if a peg was crossed (for tick sound).
     */
    update(wheelAngle, wheelSpeed, dt) {
        dt = Math.min(dt, 0.05);
        let pegCrossed = false;

        // Use CUMULATIVE angle (not normalized) to avoid wraparound and jitter.
        // Peg lines at every 30°, offset by -15°: ..., -15, 15, 45, 75, ...
        // In cumulative space: floor((angle + 15) / 30) counts total pegs passed.
        const pegIdx = Math.floor((wheelAngle + 15) / 30);

        if (this._lastPegIdx !== null && pegIdx !== this._lastPegIdx) {
            pegCrossed = true;

            // Kick strength: proportional to speed, but rigid-body capped
            const speedFactor = Math.min(1, Math.abs(wheelSpeed) / 800);
            const kickStrength = 400 + speedFactor * 600; // deg/s² impulse

            // Direction based on which way the pegIdx changed (not wheelSpeed sign)
            // pegIdx increasing → peg came from one side
            // pegIdx decreasing → peg came from the other side
            const pegDelta = pegIdx - this._lastPegIdx;
            const dir = pegDelta > 0 ? -1 : 1;
            this.velocity += dir * kickStrength;
        }
        this._lastPegIdx = pegIdx;

        // Physics substeps
        const substeps = Math.max(2, Math.ceil(dt * 120));
        const subDt = dt / substeps;

        for (let i = 0; i < substeps; i++) {
            const force = -this.stiffness * this.angle - this.damping * this.velocity;
            this.velocity += (force / this.mass) * subDt;
            this.angle += this.velocity * subDt;

            // Rigid clamp
            if (this.angle > this.maxDeflection) {
                this.angle = this.maxDeflection;
                if (this.velocity > 0) this.velocity *= -0.2; // small bounce off limit
            } else if (this.angle < -this.maxDeflection) {
                this.angle = -this.maxDeflection;
                if (this.velocity < 0) this.velocity *= -0.2;
            }
        }

        this.el.style.transform = `translateX(-50%) rotate(${this.angle}deg)`;
        return pegCrossed;
    }

    isAtRest() {
        return Math.abs(this.angle) < 0.3 && Math.abs(this.velocity) < 5;
    }

    reset() {
        this.angle = 0;
        this.velocity = 0;
        this._lastPegIdx = null;
        this.el.style.transform = 'translateX(-50%) rotate(0deg)';
    }
}
