/**
 * TT-Glücksrad — Segment-Konfiguration & Konstanten
 *
 * System: 1 Gem pro Dreh.
 * Zwei abwechselnde TT-Blautöne für visuellen Rhythmus.
 */

const WHEEL_BLUE_A = '#2560a8'; // helleres TT-Blau
const WHEEL_BLUE_B = '#1c4a88'; // dunkleres TT-Blau

const WHEEL_SEGMENTS = [
    { label: 'WEG',              color: WHEEL_BLUE_A, type: 'mult', mult: 0, icon: 'lose' },
    { label: '×2',               color: WHEEL_BLUE_B, type: 'mult', mult: 2, icon: 'win' },
    { label: 'NETZ-\nROLLER',   color: WHEEL_BLUE_A, type: 'respin', icon: 'action' },
    { label: '×1',               color: WHEEL_BLUE_B, type: 'mult', mult: 1, icon: 'neutral' },
    { label: 'ABGE-\nZOCKT',    color: WHEEL_BLUE_A, type: 'steal', icon: 'action' },
    { label: 'WEG',              color: WHEEL_BLUE_B, type: 'mult', mult: 0, icon: 'lose' },
    { label: '×3',               color: WHEEL_BLUE_A, type: 'mult', mult: 3, icon: 'jackpot' },
    { label: '×1',               color: WHEEL_BLUE_B, type: 'mult', mult: 1, icon: 'neutral' },
    { label: 'DOPPELT\nODER NIX',color: WHEEL_BLUE_A, type: 'aon', icon: 'action' },
    { label: 'WEG',              color: WHEEL_BLUE_B, type: 'mult', mult: 0, icon: 'lose' },
    { label: 'DOPPEL',           color: WHEEL_BLUE_A, type: 'doppel', icon: 'action' },
    { label: '×2',               color: WHEEL_BLUE_B, type: 'mult', mult: 2, icon: 'win' },
];

const WHEEL_N   = 12;
const WHEEL_DEG = 360 / WHEEL_N;
const WHEEL_RAD = (2 * Math.PI) / WHEEL_N;
