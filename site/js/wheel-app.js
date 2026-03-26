/**
 * TT-Glücksrad — Alpine.js App
 * Hybrid spin (easing → physics), pointer-peg interaction, coin-flip swipe.
 */

function wheelApp() {
    return {
        segments: WHEEL_SEGMENTS,
        spinning: false,
        rotation: 0,
        shaking: false,
        bet: 1,
        betConfirmed: false, // true after player confirms bet → wheel unlocked

        // Result overlay
        showResult: false,
        rType: '', rTitle: '', rMsg: '', rPay: 0, rPartner: 0, rSteal: false,
        _pendingRespin: false,

        // Ball pick (Doppelt oder Nix)
        showBallPick: false,
        ballResults: [false, false],
        ball0Revealed: false,
        ball1Revealed: false,
        _ballPickDone: false,
        _pickedBallIdx: null,

        // Internal
        _audio: null,
        _confetti: null,
        _pointer: null,
        _drag: null,
        _lastSeg: -1,
        _prevRotation: 0,

        /* ═══════════════════════════════════
           INIT
           ═══════════════════════════════════ */

        init() {
            this._audio = new WheelAudio();
            this._pointer = new WheelPointer(this.$refs.pointerWrap);

            // iOS/Android: AudioContext must be resumed from the FIRST user gesture
            const unlockAudio = () => {
                this._audio.resume();
                document.removeEventListener('touchstart', unlockAudio);
                document.removeEventListener('mousedown', unlockAudio);
            };
            document.addEventListener('touchstart', unlockAudio, { once: true });
            document.addEventListener('mousedown', unlockAudio, { once: true });

            const cc = this.$refs.confettiCanvas;
            const resize = () => {
                cc.width = innerWidth * devicePixelRatio;
                cc.height = innerHeight * devicePixelRatio;
                cc.style.width = innerWidth + 'px';
                cc.style.height = innerHeight + 'px';
                drawWheel(this.$refs.wheelCanvas);
            };
            this._confetti = new WheelConfetti(cc);

            document.fonts.ready.then(resize);
            addEventListener('resize', resize);
        },

        /* ═══════════════════════════════════
           SWIPE-TO-SPIN (Bidirectional)
           ═══════════════════════════════════ */

        onDown(e) {
            if (this.spinning || !this.betConfirmed) return;
            const pt = e.touches ? e.touches[0] : e;
            const r = this.$refs.stage.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const a = Math.atan2(pt.clientY - cy, pt.clientX - cx);
            this._drag = { cx, cy, prevA: a, prevT: performance.now(), vel: 0 };
        },

        onMove(e) {
            if (!this._drag || this.spinning) return;
            const pt = e.touches ? e.touches[0] : e;
            const a = Math.atan2(pt.clientY - this._drag.cy, pt.clientX - this._drag.cx);
            let d = a - this._drag.prevA;
            if (d > Math.PI) d -= 2 * Math.PI;
            if (d < -Math.PI) d += 2 * Math.PI;
            const now = performance.now();
            const dt = (now - this._drag.prevT) / 1000; // seconds
            if (dt > 0) this._drag.vel = this._drag.vel * 0.6 + (d / dt) * 0.4; // rad/s smoothed
            const deltaDeg = d * 180 / Math.PI;
            this.rotation += deltaDeg;

            // Pointer physics also during manual drag
            const wheelSpeed = dt > 0 ? deltaDeg / dt : 0;
            const pegHit = this._pointer.update(this.rotation, wheelSpeed, Math.max(dt, 1/60));
            if (pegHit) {
                const vol = Math.min(0.12, 0.03 + Math.abs(wheelSpeed) / 5000);
                const pitch = 0.8 + Math.min(0.6, Math.abs(wheelSpeed) / 3000);
                this._audio.tick(vol, pitch);
            }

            this._drag.prevA = a;
            this._drag.prevT = now;
        },

        onUp() {
            if (!this._drag) return;
            const velDeg = this._drag.vel * (180 / Math.PI); // rad/s → deg/s
            this._drag = null;
            if (Math.abs(velDeg) > 90) this.doSpin(velDeg);
        },

        /* ═══════════════════════════════════
           SPIN (Hybrid: Easing → Physics)
           ═══════════════════════════════════ */

        spin() {
            if (this.spinning || !this.betConfirmed) return;
            this.doSpin(0);
        },

        doSpin(vel) {
            this._audio.resume();
            this.spinning = true;
            this._pointer.reset();
            this._prevRotation = this.rotation;

            const clockwise = vel >= 0;
            const absVel = Math.abs(vel);
            const idx = this.pickSegment();
            const curMod = ((this.rotation % 360) + 360) % 360;
            const tgtMod = ((360 - idx * WHEEL_DEG) % 360 + 360) % 360;
            const off = (Math.random() - 0.5) * WHEEL_DEG * 0.4;

            const rots = absVel
                ? Math.min(10, Math.floor(absVel / 140)) + 3
                : 6 + Math.floor(Math.random() * 4);

            let final_;
            if (clockwise) {
                let delta = tgtMod + off - curMod;
                if (delta <= 0) delta += 360;
                delta += rots * 360;
                final_ = this.rotation + delta;
            } else {
                let delta = curMod - (tgtMod + off);
                if (delta <= 0) delta += 360;
                delta += rots * 360;
                final_ = this.rotation - delta;
            }

            this._lastSeg = -1;
            const dur = 6500 + Math.random() * 2000;

            this._animateHybrid(final_, dur, () => {
                this.spinning = false;
                this.resolve(idx);
            });
        },

        pickSegment() {
            return Math.floor(Math.random() * WHEEL_N);
        },

        /**
         * Hybrid animation:
         * - Phase 1 (0–85%): easeOutPow6 drives the main spin.
         *   Pointer gets kicked visually at each peg crossing.
         * - Phase 2 (85–100%): slower deceleration with pointer physics
         *   creating the dramatic "will it pass the next peg?" suspense.
         */
        _animateHybrid(target, dur, cb) {
            const start = this.rotation;
            const totalDelta = target - start;
            const t0 = performance.now();
            let prevTime = t0;

            const step = (now) => {
                const elapsed = now - t0;
                const p = Math.min(elapsed / dur, 1);
                const dt = (now - prevTime) / 1000; // seconds
                prevTime = now;

                // Easing: power 6 for dramatic slowdown
                const ease = 1 - Math.pow(1 - p, 6);
                this.rotation = start + totalDelta * ease;

                // Calculate instantaneous wheel speed (deg/s)
                const wheelSpeed = (this.rotation - this._prevRotation) / Math.max(dt, 0.001);

                // Pointer physics with peg contact detection
                const pegHit = this._pointer.update(this.rotation, wheelSpeed, dt);
                if (pegHit) {
                    const vol = Math.min(0.15, 0.02 + Math.abs(wheelSpeed) / 5000);
                    const pitch = 0.7 + Math.min(0.8, Math.abs(wheelSpeed) / 2500);
                    this._audio.tick(vol, pitch);
                }
                this._prevRotation = this.rotation;

                // End when nearly stopped (< 2°/s) OR time is up
                const nearlyDone = Math.abs(wheelSpeed) < 2 && p > 0.8;
                if (p >= 1 || nearlyDone) {
                    this.rotation = target; // snap to exact target
                    cb();
                } else {
                    requestAnimationFrame(step);
                }
            };
            requestAnimationFrame(step);
        },

        /** After the wheel stops, let the pointer swing back to rest. */
        _settlePointer(cb) {
            let prevTime = performance.now();
            const settle = (now) => {
                const dt = (now - prevTime) / 1000;
                prevTime = now;
                this._pointer.update(this.rotation, 0, dt);
                if (this._pointer.isAtRest()) {
                    cb();
                } else {
                    requestAnimationFrame(settle);
                }
            };
            requestAnimationFrame(settle);
        },

        /* ═══════════════════════════════════
           RESOLVE RESULT
           ═══════════════════════════════════ */

        resolve(idx) {
            const s = WHEEL_SEGMENTS[idx];
            const b = this.bet;

            if (s.type === 'mult') {
                const payout = b * s.mult;
                if (s.mult === 0) {
                    this.doShake();
                    this.showRes('lose', 'Weg!',
                        b === 1 ? 'Chip verloren' : `${b} Chips verloren`, 0);
                } else if (s.mult === 1) {
                    this.showRes('neutral', 'Zurück',
                        b === 1 ? 'Chip gerettet' : `${b} Chips gerettet`, payout);
                } else {
                    this.burstConfetti();
                    this.showRes('win', 'Doppelt!',
                        `Du bekommst ${payout} Chips`, payout);
                }
            } else if (s.type === 'respin') {
                this._pendingRespin = true;
                this.showRes('special', 'Netzroller!', 'Nochmal!', -1);
            } else if (s.type === 'steal') {
                this.showRes('win', 'Abgezockt!',
                    `${b === 1 ? 'Chip' : b + ' Chips'} zurück`, b, 0, true);
            } else if (s.type === 'doppel') {
                this.burstConfetti(70);
                this.showRes('jackpot', 'Doppelsieg!',
                    `Du bekommst ${b * 2} Chips<br>+ wähl einen Partner, der 1 Chip bekommt`, b * 2, 1);
            } else if (s.type === 'aon') {
                const winBall = Math.random() < 0.5 ? 0 : 1;
                this.ballResults = [winBall === 0, winBall === 1];
                this.ball0Revealed = false;
                this.ball1Revealed = false;
                this._ballPickDone = false;
                this._pickedBallIdx = null;
                this.showBallPick = true;
            }
        },

        /* ═══════════════════════════════════
           BALL PICK (Doppelt oder Nix)
           ═══════════════════════════════════ */

        pickBall(idx) {
            if (this._ballPickDone) return;
            this._ballPickDone = true;
            this._pickedBallIdx = idx;

            // 1) Flip the chosen ball (0.9s CSS transition)
            if (idx === 0) this.ball0Revealed = true;
            else this.ball1Revealed = true;

            // 2) After chosen ball has flipped, flip the other
            setTimeout(() => {
                this.ball0Revealed = true;
                this.ball1Revealed = true;
            }, 1200);

            // 3) Show result popup ON TOP of the balls
            setTimeout(() => {
                const b = this.bet;
                if (this.ballResults[idx]) {
                    this.burstConfetti();
                    this.showRes('jackpot', 'Doppelt!', `Du bekommst ${b * 2} Chips`, b * 2);
                } else {
                    this.doShake();
                    this.showRes('lose', 'Nix!', b === 1 ? 'Chip verloren' : `${b} Chips verloren`, 0);
                }
                // Close the ball overlay behind the result popup
                this.showBallPick = false;
            }, 2600);
        },

        /* ═══════════════════════════════════
           HELPERS
           ═══════════════════════════════════ */

        showRes(type, title, msg, pay, partnerPay = 0, steal = false) {
            this.rType = type;
            this.rTitle = title;
            this.rMsg = msg;
            this.rPay = pay;
            this.rPartner = partnerPay;
            this.rSteal = steal;
            this.showResult = true;

            if (type === 'win' || type === 'jackpot') this._audio.playWin();
            else if (type === 'lose') this._audio.playLose();
        },

        dismissResult() {
            this.showResult = false;
            if (this._pendingRespin) {
                // Netzroller: stay on wheel, player spins again manually (same bet)
                this._pendingRespin = false;
                return; // betConfirmed stays true, wheel is ready
            }
            // Back to bet selection for next player
            this.betConfirmed = false;
        },

        doShake() {
            this.shaking = true;
            setTimeout(() => this.shaking = false, 450);
        },

        burstConfetti(n) {
            const x = innerWidth / 2;
            const y = innerHeight * 0.33;
            this._confetti?.burst(
                x * devicePixelRatio,
                y * devicePixelRatio,
                (n || 55) * devicePixelRatio
            );
        },
    };
}
