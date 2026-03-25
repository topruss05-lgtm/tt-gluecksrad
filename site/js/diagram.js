const STROKE_COLORS = {"KA":"#9b59b6","LA":"#8e44ad","LAU":"#7d3c98","LAÜ":"#6c3483","KR":"#bdc3c7","VHT":"#e74c3c","RHT":"#c0392b","VHK":"#e67e22","RHK":"#d35400","VHS":"#ff4444","RHS":"#dd3333","VHF":"#e84393","RHF":"#d63384","VHB":"#3498db","RHB":"#2980b9","VHAb":"#1abc9c","RHAb":"#16a085","BAb":"#148f77","VHSt":"#85929e","RHSt":"#7f8c8d","VHSch":"#2ecc71","RHSch":"#27ae60","frei":"#95a5a6"};

const ZONE_COORDS = {
    'A_deep_vh':   { x: 125, y: 245 },
    'A_deep_mid':  { x: 76,  y: 245 },
    'A_deep_bh':   { x: 28,  y: 245 },
    'A_short_vh':  { x: 125, y: 165 },
    'A_short_mid': { x: 76,  y: 165 },
    'A_short_bh':  { x: 28,  y: 165 },
    'B_deep_vh':   { x: 28,  y: 29 },
    'B_deep_mid':  { x: 76,  y: 29 },
    'B_deep_bh':   { x: 125, y: 29 },
    'B_short_vh':  { x: 28,  y: 109 },
    'B_short_mid': { x: 76,  y: 109 },
    'B_short_bh':  { x: 125, y: 109 },
};

function getStrokeColor(code) {
    return STROKE_COLORS[code] || '#8886a0';
}

function highlightStrokeCodes(text) {
    if (!text) return '';
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const codes = Object.keys(STROKE_COLORS).sort((a, b) => b.length - a.length);
    const pattern = new RegExp('\\b(' + codes.map(c => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'g');
    return escaped.replace(pattern, (match) => {
        const color = STROKE_COLORS[match] || '#8886a0';
        return `<span style="color:${color};font-family:'JetBrains Mono',monospace;font-weight:600;font-size:0.85em;background:${color}15;padding:1px 4px;border-radius:3px">${match}</span>`;
    });
}

function zoneLabel(zone) {
    if (!zone) return '';
    return zone.replace('deep_', '').replace('short_', 'k.').toUpperCase();
}

function getCoords(zone, player, mirrored) {
    const key = player + '_' + zone;
    let c = ZONE_COORDS[key];
    if (!c) c = ZONE_COORDS[player + '_deep_mid'];
    if (!c) return { x: 76, y: 137 };
    if (mirrored) return { x: 152.5 - c.x, y: c.y };
    return c;
}

function renderDiagram(container, strokes, overrideMap, mirrored) {
    if (!container) return;
    container.replaceChildren();
    if (!strokes || !strokes.length) return;

    const pairs = [];
    for (let i = 0; i < strokes.length; i += 2) {
        pairs.push(strokes.slice(i, i + 2));
    }

    pairs.forEach(pair => renderMiniTable(container, pair, overrideMap, mirrored));
}

function renderMiniTable(container, strokes, overrideMap = {}, mirrored = false) {
    const W = 120, H = 216;
    const ns = 'http://www.w3.org/2000/svg';

    const el = (tag, attrs) => {
        const e = document.createElementNS(ns, tag);
        Object.entries(attrs).forEach(([k,v]) => e.setAttribute(k, v));
        return e;
    };

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px';

    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '140');
    svg.setAttribute('height', '252');
    svg.style.cssText = 'border-radius:10px;border:1px solid rgba(255,255,255,0.06);overflow:hidden';

    const netY = H / 2;

    const defs = document.createElementNS(ns, 'defs');
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.setAttribute('id', 'tableGrad-' + Math.random().toString(36).substr(2, 5));
    grad.setAttribute('x1', '0'); grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '0'); grad.setAttribute('y2', '1');
    const s1 = document.createElementNS(ns, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#1a6b3a');
    const s2 = document.createElementNS(ns, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#145a30');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
    svg.appendChild(defs);

    svg.appendChild(el('rect', {x:0,y:0,width:W,height:H,fill:`url(#${grad.id})`}));
    svg.appendChild(el('line', {x1:0,y1:netY,x2:W,y2:netY,stroke:'rgba(255,255,255,0.5)','stroke-width':'1.5'}));
    svg.appendChild(el('line', {x1:W/2,y1:0,x2:W/2,y2:H,stroke:'rgba(255,255,255,0.08)','stroke-width':'0.5','stroke-dasharray':'4,4'}));

    const addText = (text, x, y, fill, size = '7') => {
        const t = el('text', {x,y,'text-anchor':'middle','dominant-baseline':'middle',fill,'font-size':size,'font-weight':'600','font-family':'JetBrains Mono,monospace'});
        t.textContent = text;
        svg.appendChild(t);
    };

    addText('A', W/2, H - 8, 'rgba(255,107,53,0.6)', '8');
    addText('B', W/2, 8, 'rgba(91,155,213,0.6)', '8');

    const scaleCoord = (zone, player) => {
        const key = player + '_' + zone;
        let c = ZONE_COORDS[key];
        if (!c) c = ZONE_COORDS[player + '_deep_mid'];
        if (!c) return { x: W/2, y: netY };
        let x = c.x * (W / 152.5);
        let y = c.y * (H / 274);
        if (mirrored) x = W - x;
        return { x, y };
    };

    const hasOverrides = Object.keys(overrideMap).length > 0;
    const pairHasOverride = hasOverrides && strokes.some(s => overrideMap[s.sequence_order]);

    strokes.forEach(stroke => {
        const seq = stroke.sequence_order;
        const overrideCode = overrideMap[seq];
        const isOverridden = !!overrideCode;
        const effectiveCode = overrideCode || stroke.stroke_type_code;
        const originalColor = getStrokeColor(stroke.stroke_type_code);
        const effectiveColor = getStrokeColor(effectiveCode);
        const startZone = stroke.start_zone || 'deep_mid';
        const endZone = stroke.end_zone || 'deep_mid';
        const start = scaleCoord(startZone, stroke.player);
        const end = scaleCoord(endZone, stroke.player === 'A' ? 'B' : 'A');

        let overrideEnd = end;
        if (isOverridden) {
            const side = effectiveCode.startsWith('VH') ? 'VH' : effectiveCode.startsWith('RH') ? 'RH' : 'M';
            const dir = stroke.direction;
            let newEndZone = endZone;
            if (dir === 'diagonal') newEndZone = side === 'VH' ? 'deep_vh' : side === 'RH' ? 'deep_bh' : 'deep_mid';
            else if (dir === 'parallel') newEndZone = side === 'VH' ? 'deep_bh' : side === 'RH' ? 'deep_vh' : 'deep_mid';
            overrideEnd = scaleCoord(newEndZone, stroke.player === 'A' ? 'B' : 'A');
        }

        const drawArrow = (sx, sy, ex, ey, color, opacity, width, dash) => {
            const attrs = {x1:sx,y1:sy,x2:ex,y2:ey,stroke:color,'stroke-width':width,'stroke-linecap':'round',opacity};
            if (dash) attrs['stroke-dasharray'] = dash;
            svg.appendChild(el('line', attrs));
            const angle = Math.atan2(ey-sy, ex-sx);
            const aL = 5;
            svg.appendChild(el('polygon', {
                points: `${ex},${ey} ${ex-aL*Math.cos(angle-0.4)},${ey-aL*Math.sin(angle-0.4)} ${ex-aL*Math.cos(angle+0.4)},${ey-aL*Math.sin(angle+0.4)}`,
                fill: color, opacity
            }));
        };

        if (isOverridden) {
            drawArrow(start.x, start.y, end.x, end.y, originalColor, '0.2', '1.5', '3,3');
            drawArrow(start.x, start.y, overrideEnd.x, overrideEnd.y, effectiveColor, '1', '2.5', null);
            svg.appendChild(el('circle', {cx:start.x,cy:start.y,r:'11',fill:'none',stroke:'#facc15','stroke-width':'1.5',opacity:'0.6'}));
        } else if (hasOverrides && !pairHasOverride) {
            drawArrow(start.x, start.y, end.x, end.y, effectiveColor, '0.3', '2', null);
        } else {
            drawArrow(start.x, start.y, end.x, end.y, effectiveColor, '0.85', '2', null);
        }

        const circColor = stroke.player === 'A' ? '#ff6b35' : '#5b9bd5';
        const circOpacity = (hasOverrides && !pairHasOverride) ? '0.3' : '0.9';
        svg.appendChild(el('circle', {cx:start.x,cy:start.y,r:'8',fill:circColor,opacity:circOpacity}));
        const numT = el('text', {x:start.x,y:start.y+3,'text-anchor':'middle',fill:'#000','font-size':'8','font-weight':'700','font-family':'JetBrains Mono,monospace'});
        numT.textContent = seq;
        svg.appendChild(numT);
    });

    wrapper.appendChild(svg);

    const label = document.createElement('div');
    label.style.cssText = 'font-family:JetBrains Mono,monospace;font-size:9px;text-align:center;max-width:140px;letter-spacing:0.02em';
    label.style.color = pairHasOverride ? '#facc15' : 'rgba(255,255,255,0.2)';
    label.textContent = strokes.map(s => {
        const ov = overrideMap[s.sequence_order];
        return ov ? `${s.stroke_type_code}→${ov}` : s.stroke_type_code;
    }).join(' | ');
    wrapper.appendChild(label);

    container.appendChild(wrapper);
}
