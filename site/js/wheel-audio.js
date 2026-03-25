/**
 * TT-Glücksrad — Web Audio API Sound-Effekte
 * Speed-dependent tick pitch/volume, win/lose arpeggios.
 */

class WheelAudio {
    constructor() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.ctx = null;
        }
    }

    resume() {
        if (this.ctx?.state === 'suspended') this.ctx.resume();
    }

    /**
     * Tick sound — speed-dependent pitch and volume.
     * @param {number} volume 0–0.15
     * @param {number} pitch  0.7–1.5 (playback rate multiplier)
     */
    tick(volume, pitch) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.frequency.value = (500 + Math.random() * 200) * (pitch || 1);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(volume || 0.06, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.035);
        } catch (e) { /* silent fail */ }
    }

    playWin() {
        if (!this.ctx) return;
        try {
            [523, 659, 784, 1047].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const t = this.ctx.currentTime + i * 0.11;
                gain.gain.setValueAtTime(0.13, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.start(t);
                osc.stop(t + 0.22);
            });
        } catch (e) { /* silent fail */ }
    }

    playLose() {
        if (!this.ctx) return;
        try {
            [380, 280].forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                const t = this.ctx.currentTime + i * 0.15;
                gain.gain.setValueAtTime(0.07, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.start(t);
                osc.stop(t + 0.25);
            });
        } catch (e) { /* silent fail */ }
    }
}
