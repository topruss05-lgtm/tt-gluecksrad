/**
 * TT-Glücksrad — Canvas-Rendering
 *
 * Minimalistisch: Einfarbige TT-Platte, weiße Linien, Netzpfosten als Pegs.
 */

function drawWheel(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = devicePixelRatio || 1;
    const size = Math.round(canvas.parentElement.getBoundingClientRect().width);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const N = WHEEL_N;
    const RAD = WHEEL_RAD;

    const lineW = Math.max(1.5, size * 0.004);     // dünn wie auf echtem Tisch
    const postH = Math.max(8, size * 0.02);       // kompakte Netzpfosten
    const postW = Math.max(3.5, size * 0.01);
    const outerR = size / 2 - postH - 1;          // Platte so groß wie möglich
    const playR = outerR;

    // ══════════════════════════════════
    // 1. PLAYING SURFACE — alternating blue tones
    // ══════════════════════════════════
    WHEEL_SEGMENTS.forEach((seg, i) => {
        const a0 = i * RAD - Math.PI / 2 - RAD / 2;
        const a1 = a0 + RAD;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, playR, a0, a1);
        ctx.closePath();
        ctx.fillStyle = seg.color;
        ctx.fill();
    });

    // ══════════════════════════════════
    // 2. WHITE EDGE LINE
    // ══════════════════════════════════
    ctx.beginPath();
    ctx.arc(cx, cy, playR - lineW / 2 - 1, 0, Math.PI * 2);
    ctx.lineWidth = lineW;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // ══════════════════════════════════
    // 3. WHITE DIVIDER LINES (stop before center)
    // ══════════════════════════════════
    const centerR = playR * 0.08; // lines stop just before the HTML ball covers them
    for (let i = 0; i < N; i++) {
        const a = i * RAD - Math.PI / 2 - RAD / 2;
        ctx.beginPath();
        ctx.moveTo(
            cx + Math.cos(a) * centerR,
            cy + Math.sin(a) * centerR
        );
        ctx.lineTo(
            cx + Math.cos(a) * (playR - lineW - 1),
            cy + Math.sin(a) * (playR - lineW - 1)
        );
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = lineW;
        ctx.stroke();
    }

    // (Center covered by fixed HTML TT ball element)

    // ══════════════════════════════════
    // 4. TEXT
    // ══════════════════════════════════
    _drawSegmentLabels(ctx, cx, cy, playR, size);

    // ══════════════════════════════════
    // 5. NETZPFOSTEN als Pegs
    // ══════════════════════════════════
    for (let i = 0; i < N; i++) {
        const a = i * RAD - Math.PI / 2 - RAD / 2;
        const baseDist = playR + 2;
        const bx = cx + Math.cos(a) * (baseDist + postH / 2);
        const by = cy + Math.sin(a) * (baseDist + postH / 2);

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a + Math.PI / 2);

        // Pfosten-Körper (dunkelgrau Metall)
        const postGrad = ctx.createLinearGradient(-postW / 2, 0, postW / 2, 0);
        postGrad.addColorStop(0, '#888');
        postGrad.addColorStop(0.3, '#ccc');
        postGrad.addColorStop(0.5, '#ddd');
        postGrad.addColorStop(0.7, '#bbb');
        postGrad.addColorStop(1, '#777');

        const r = postW * 0.3; // leichte Abrundung
        ctx.beginPath();
        ctx.roundRect(-postW / 2, -postH / 2, postW, postH, r);
        ctx.fillStyle = postGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Klemme oben (hält das Netz)
        ctx.beginPath();
        ctx.roundRect(-postW * 0.7, -postH / 2 - 2, postW * 1.4, 3, 1.5);
        ctx.fillStyle = '#999';
        ctx.fill();

        ctx.restore();
    }
}


/**
 * Segment labels — weiß auf einfarbiger Fläche.
 */
function _drawSegmentLabels(ctx, cx, cy, playR, size) {
    const RAD = WHEEL_RAD;
    // All text centered at the SAME radius — no swirling when spinning
    const textR = playR * 0.66;

    WHEEL_SEGMENTS.forEach((seg, i) => {
        const midAngle = i * RAD - Math.PI / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(midAngle);

        const lines = seg.label.split('\n');

        let fontSize;
        if (lines.length === 1 && lines[0].length <= 3) {
            fontSize = size * 0.082;
        } else if (lines.length === 1) {
            fontSize = size * 0.048;
        } else {
            fontSize = size * 0.034;
        }

        ctx.font = `700 ${fontSize}px 'Fredoka', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = seg.icon === 'lose' ? 'rgba(255,255,255,0.45)' : '#ffffff';

        const lineH = fontSize * 1.2;
        const yStart = -(lines.length - 1) * lineH / 2;

        lines.forEach((line, li) => {
            ctx.fillText(line, textR, yStart + li * lineH);
        });
        ctx.restore();
    });
}
