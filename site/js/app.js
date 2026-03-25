function app() {
    return {
        exercises: [],
        loading: true,

        async init() {
            const res = await fetch('exercises.json');
            this.exercises = await res.json();
            this.loading = false;
        },

        search: '',
        mirrored: false,
        selected: null,
        selectedId: null,
        activeVariation: null,
        activeContent: [],
        activeFormat: null,
        activeLevel: null,

        contentOptions: [
            { key: 'technik', label: 'Technik' },
            { key: 'beinarbeit', label: 'Beinarbeit' },
            { key: 'aufschlag', label: 'Aufschlag' },
            { key: 'taktik', label: 'Taktik' },
            { key: 'abwehr', label: 'Abwehr' },
            { key: 'athletik', label: 'Athletik' },
            { key: 'koordination', label: 'Koordination' },
            { key: 'spiel_spass', label: 'Spiel & Spaß' },
        ],
        formatOptions: [
            { key: 'partner', label: 'Partnerübung' },
            { key: 'multiball', label: 'Multiball' },
            { key: 'spielform', label: 'Spielform' },
            { key: 'solo', label: 'Solo' },
            { key: 'aufwaermen', label: 'Aufwärmen' },
        ],
        levelOptions: [
            { key: 'anfaenger', label: 'Anfänger' },
            { key: 'fortgeschritten', label: 'Fortgeschritten' },
            { key: 'leistung', label: 'Leistung' },
            { key: 'alle', label: 'Alle Level' },
        ],
        contentLabels: { technik:'Technik', beinarbeit:'Beinarbeit', aufschlag:'Aufschlag', taktik:'Taktik', abwehr:'Abwehr', athletik:'Athletik', koordination:'Koordination', spiel_spass:'Spiel & Spaß' },
        formatLabels: { partner:'Partnerübung', multiball:'Multiball', spielform:'Spielform', solo:'Solo', aufwaermen:'Aufwärmen' },
        levelLabels: { anfaenger:'Anfänger', fortgeschritten:'Fortgeschritten', leistung:'Leistung', alle:'Alle Level' },
        formatOrder: ['aufwaermen', 'partner', 'multiball', 'solo', 'spielform'],

        toggleContent(key) {
            const idx = this.activeContent.indexOf(key);
            if (idx >= 0) this.activeContent.splice(idx, 1);
            else this.activeContent.push(key);
        },

        contentCount(key) {
            return this.exercises.filter(ex => (ex.content || []).includes(key)).length;
        },

        get filteredExercises() {
            return this.exercises.filter(ex => {
                if (this.activeContent.length) {
                    const exContent = ex.content || [];
                    if (!this.activeContent.some(c => exContent.includes(c))) return false;
                }
                if (this.activeFormat && ex.format !== this.activeFormat) return false;
                if (this.activeLevel) {
                    if (this.activeLevel === 'alle') {
                        if (ex.level !== 'alle') return false;
                    } else {
                        if (ex.level !== this.activeLevel && ex.level !== 'alle') return false;
                    }
                }
                if (this.search) {
                    const q = this.search.toLowerCase();
                    const h = [ex.name, ex.format, ex.level, ex.description || '',
                        ...(ex.content || []),
                        ...(ex.strokes||[]).map(s => s.stroke_type_code)].join(' ').toLowerCase();
                    if (!h.includes(q)) return false;
                }
                return true;
            });
        },

        get groupedExercises() {
            const filtered = this.filteredExercises;
            filtered.sort((a, b) => a.name.localeCompare(b.name, 'de'));

            const groups = [];
            const byFormat = {};
            filtered.forEach(ex => {
                const fmt = ex.format || 'partner';
                if (!byFormat[fmt]) byFormat[fmt] = [];
                byFormat[fmt].push(ex);
            });

            const allFormats = [...new Set([...this.formatOrder, ...Object.keys(byFormat)])];
            allFormats.forEach(fmt => {
                if (!byFormat[fmt] || !byFormat[fmt].length) return;
                const exercises = byFormat[fmt];
                groups.push({ type: fmt, subGroups: [{ label: null, exercises }], total: exercises.length });
            });
            return groups;
        },

        select(ex) {
            this.selected = ex;
            this.selectedId = ex.id;
            this.activeVariation = null;
            this.$nextTick(() => this.doRenderDiagram());
        },

        toggleVariation(v) {
            if (this.activeVariation?.id === v.id) {
                this.activeVariation = null;
            } else {
                this.activeVariation = v;
            }
            this.$nextTick(() => this.doRenderDiagram());
        },

        doRenderDiagram() {
            const overrideMap = {};
            if (this.activeVariation?.overrides) {
                this.activeVariation.overrides.forEach(o => {
                    overrideMap[o.target_sequence] = o.new_stroke_type_code;
                });
            }
            renderDiagram(this.$refs.diagram, this.selected?.strokes, overrideMap, this.mirrored);
        },

        // Delegate to diagram.js functions
        getStrokeColor(code) { return getStrokeColor(code); },
        highlightStrokeCodes(text) { return highlightStrokeCodes(text); },
        zoneLabel(zone) { return zoneLabel(zone); },

        detectEquipment(ex) {
            const d = (ex.description || '').toLowerCase();
            const equipment = [];
            if (d.includes('balleimer') || d.includes('multiball')) equipment.push('Balleimer');
            if (d.includes('theraband') || d.includes('widerstandsband')) equipment.push('Theraband');
            if (d.includes('koordinationsleiter') || d.includes('agility')) equipment.push('Leiter');
            if (d.includes('springseil') || d.includes('seilspringen')) equipment.push('Springseil');
            if (d.includes('hütchen') || d.includes('pylone') || d.includes('kegel')) equipment.push('Hütchen');
            if (d.includes('handtuch') || d.includes('schnur') || d.includes('stange')) equipment.push('Hilfsmittel');
            return equipment;
        },
    };
}
