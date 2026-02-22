// ============================================================
//  APP.JS — State Management, Routing, Core Logic
// ============================================================

import { SPORTS, GOALS, EXPERIENCE_LEVELS, ATHLETIC_QUALITIES, BIOMARKER_CATEGORIES, EXERCISE_LIBRARY, RPE_DESCRIPTIONS } from './data.js';
import { chatWithAI, generateWorkoutPlan, getNextSetSuggestion, analyzeBiomarkers, getDailyTip } from './ai.js';
import { renderVolumeChart, renderBiomarkerChart, renderPRChart } from './charts.js';

// ─── Global Configuration (SaaS Lockdown) ──────────────────────
const GLOBAL_CONFIG = {
    // [PRO TIP]: Set these to your project values for production
    SB_URL: "https://xjwxafhvjjmfgscbnnyg.supabase.co",
    SB_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqd3hhZmh2amptZmdzY2JubnlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2OTU5OTYsImV4cCI6MjA4NzI3MTk5Nn0.jtoFqMGVxHeBhPsrKwN8dSouaMlpZxKZaVT0EF0XpPE",
    ADMIN_PATH: "admin" // secret keyword to activate config panel
};

// ─── Supabase Service ─────────────────────────────────────────
const SupabaseService = {
    get url() {
        const params = new URLSearchParams(window.location.search);
        return params.get("sb_url") || localStorage.getItem("ag_sb_url") || GLOBAL_CONFIG.SB_URL;
    },
    get key() {
        const params = new URLSearchParams(window.location.search);
        return params.get("sb_key") || localStorage.getItem("ag_sb_key") || GLOBAL_CONFIG.SB_KEY;
    },
    get client() {
        if (!this.url || !this.key || this.url === "PLACEHOLDER_URL") return null;
        try {
            const clientFactory = window.supabase?.createClient;
            return clientFactory ? clientFactory(this.url, this.key) : null;
        } catch (e) {
            console.error("Supabase init failed", e);
            return null;
        }
    },
    isConfigured() {
        return this.url && this.key && this.url !== "PLACEHOLDER_URL" && this.url.startsWith("https://");
    }
};

const sb = SupabaseService.client;

// ─── App Engine ─────────────────────────────────────────────
const App = {
    STATE: {
        currentView: "dashboard",
        user: null,           // Supabase Auth User
        profile: {},
        workouts: [],         // Array of session objects
        biomarkers: [],       // Array of biomarker entries
        chatHistory: [],      // [{role, content}]
        activeWorkout: null,  // Currently logging session
        aiGeneratedPlan: null,
        restTimer: {
            active: false,
            remaining: 0,
            interval: null
        },
        isLoading: false
    },

    async save(type = 'all') {
        const { STATE } = this;
        // 1. Local Fallback
        localStorage.setItem("ag_profile", JSON.stringify(STATE.profile));
        localStorage.setItem("ag_workouts", JSON.stringify(STATE.workouts));
        localStorage.setItem("ag_biomarkers", JSON.stringify(STATE.biomarkers));

        // 2. Supabase Cloud Sync
        if (!STATE.user || !sb) return;

        try {
            if (type === 'workout' || type === 'all') {
                const latest = STATE.workouts[STATE.workouts.length - 1];
                if (latest) await this.saveWorkouts(latest);
            }
            if (type === 'profile' || type === 'all') {
                await sb.from('profiles').upsert({ id: STATE.user.id, ...STATE.profile });
            }
            if (type === 'biomarker' || type === 'all') {
                const latest = STATE.biomarkers[STATE.biomarkers.length - 1];
                if (latest) await sb.from('biomarkers').upsert({ user_id: STATE.user.id, ...latest });
            }
        } catch (err) {
            console.warn("Cloud sync delayed", err);
        }
    },

    async saveWorkouts(workout) {
        if (!this.STATE.user || !sb) return;
        try {
            const { data: wData } = await sb.from('workouts').upsert({
                id: workout.id, user_id: this.STATE.user.id, date: workout.date, sport: workout.sport, notes: workout.notes
            }).select();

            if (wData?.[0]) {
                for (let ei = 0; ei < workout.exercises.length; ei++) {
                    const ex = workout.exercises[ei];
                    const { data: exData } = await sb.from('exercise_sessions').upsert({
                        workout_id: wData[0].id, exercise_name: ex.name, quality: ex.quality, order: ei
                    }).select();

                    if (exData?.[0]) {
                        for (let si = 0; si < ex.sets.length; si++) {
                            const s = ex.sets[si];
                            await sb.from('sets').upsert({
                                session_id: exData[0].id, weight: s.weight, reps: s.reps, rpe: s.rpe, e1rm: calculateE1RM(s.weight, s.reps), order: si
                            });
                        }
                    }
                }
            }
        } catch (err) { console.error("Database sync error:", err); }
    },

    async loadData() {
        if (!this.STATE.user || !sb) return;
        this.STATE.isLoading = true;
        try {
            const { data: pData } = await sb.from('profiles').select().eq('id', this.STATE.user.id).single();
            if (pData) this.STATE.profile = pData;

            const { data: wData } = await sb.from('workouts').select('*, exercise_sessions(*, sets(*))').eq('user_id', this.STATE.user.id).order('date', { ascending: false });
            if (wData) {
                this.STATE.workouts = wData.map(w => ({
                    ...w,
                    exercises: w.exercise_sessions.map(es => ({
                        ...es,
                        name: es.exercise_name,
                        sets: es.sets.sort((a, b) => a.order - b.order)
                    })).sort((a, b) => a.order - b.order)
                }));
            }

            const { data: bData } = await sb.from('biomarkers').select().eq('user_id', this.STATE.user.id).order('date', { ascending: false });
            if (bData) this.STATE.biomarkers = bData;

            renderDashboard();
        } catch (err) { console.error("Database load error:", err); }
        finally { this.STATE.isLoading = false; }
    }
};

const STATE = App.STATE;

// Global wrapper for legacy calls
async function save(type = 'all') { return App.save(type); }
async function loadData() { return App.loadData(); }
async function saveWorkouts(w) { return App.saveWorkouts(w); }

// ─── Utility ────────────────────────────────────────────────
function today() {
    return new Date().toISOString().split("T")[0];
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function calcVolume(workout) {
    return workout.exercises.reduce((total, ex) =>
        total + ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0), 0
    );
}

function calculateE1RM(weight, reps) {
    if (!weight || !reps) return 0;
    if (reps === 1) return weight;
    // Brzycki Formula: Weight / (1.0278 - (0.0278 * Reps))
    return Math.round(weight / (1.0278 - (0.0278 * reps)));
}

function getStreak() {
    const dates = [...new Set(STATE.workouts.map(w => w.date))].sort().reverse();
    if (!dates.length) return 0;
    let streak = 0;
    let curr = new Date();
    for (const d of dates) {
        const diff = Math.floor((curr - new Date(d + "T12:00:00")) / 86400000);
        if (diff <= 1) { streak++; curr = new Date(d + "T12:00:00"); }
        else break;
    }
    return streak;
}

function getPRs() {
    const prs = {};
    for (const w of STATE.workouts) {
        for (const ex of w.exercises) {
            const maxWeight = Math.max(...ex.sets.map(s => s.weight || 0));
            const maxReps = Math.max(...ex.sets.map(s => s.reps || 0));
            if (!prs[ex.name] || maxWeight > prs[ex.name].weight) {
                prs[ex.name] = { weight: maxWeight, reps: maxReps, date: w.date };
            }
        }
    }
    return prs;
}

// ─── Router ─────────────────────────────────────────────────
function navigate(view) {
    STATE.currentView = view;
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const navEl = document.querySelector(`[data-view="${view}"]`);
    if (navEl) navEl.classList.add("active");

    document.querySelectorAll(".view").forEach(v => v.classList.remove("active-view"));
    const viewEl = document.getElementById(`view-${view}`);
    if (viewEl) viewEl.classList.add("active-view");

    // Lifecycle hooks
    const hooks = {
        dashboard: renderDashboard,
        analytics: renderAnalytics,
        library: renderLibrary,
        biomarkers: renderBiomarkerUI,
        profile: renderProfile,
        settings: renderSettings
    };
    if (hooks[view]) hooks[view]();

    // Mobile close sidebar
    document.getElementById("sidebar").classList.remove("open");
}

// ─── DASHBOARD ───────────────────────────────────────────────
async function renderDashboard() {
    const name = STATE.profile.name || "Athlete";
    const sport = STATE.profile.sport || "General Fitness";
    const streak = getStreak();
    const prs = getPRs();
    const totalWorkouts = STATE.workouts.length;

    document.getElementById("dash-greeting").textContent = `Welcome back, ${name} 👋`;
    document.getElementById("dash-sport").textContent = sport;
    document.getElementById("dash-streak").textContent = `${streak} day${streak !== 1 ? "s" : ""}`;
    document.getElementById("dash-total-workouts").textContent = totalWorkouts;

    const prsEl = document.getElementById("dash-prs");
    if (Object.keys(prs).length) {
        const prList = Object.entries(prs).slice(0, 5).map(([name, data], i) =>
            `<div class="pr-row stagger-item delay-${Math.min(i + 1, 5)}"><span class="pr-name">${name}</span><span class="pr-val">${data.weight}kg × ${data.reps}</span><span class="pr-date">${formatDate(data.date)}</span></div>`
        ).join("");
        prsEl.innerHTML = prList;
    } else {
        prsEl.innerHTML = `<p class="muted stagger-item">Log your first workout to see PRs here.</p>`;
    }

    const recentEl = document.getElementById("dash-recent");
    const recent = [...STATE.workouts].reverse().slice(0, 3);
    if (recent.length) {
        recentEl.innerHTML = recent.map((w, i) => `
      <div class="workout-card-mini stagger-item delay-${Math.min(i + 1, 5)}">
        <div class="wcm-date">${formatDate(w.date)}</div>
        <div class="wcm-exercises">${w.exercises.map(e => e.name).join(" · ")}</div>
        <div class="wcm-volume">${Math.round(calcVolume(w)).toLocaleString()} kg volume</div>
      </div>`).join("");
    } else {
        recentEl.innerHTML = `<p class="muted stagger-item">No workouts yet. Start logging!</p>`;
    }

    // AI daily tip
    const tipEl = document.getElementById("dash-ai-tip");
    tipEl.textContent = "Loading AI tip...";
    const tip = await getDailyTip(STATE.profile);
    tipEl.textContent = tip || "Enter your Gemini API key in Settings to get personalized AI tips.";
}

// ─── WORKOUT LOGGER ──────────────────────────────────────────
function startWorkout() {
    STATE.activeWorkout = {
        id: uid(),
        date: today(),
        sport: STATE.profile.sport || "General Fitness",
        exercises: [],
        notes: ""
    };
    renderActiveWorkout();
    document.getElementById("workout-empty-state").style.display = "none";
    document.getElementById("workout-logger").style.display = "block";
}

function renderActiveWorkout() {
    const wk = STATE.activeWorkout;
    if (!wk) return;

    const container = document.getElementById("exercises-container");
    container.innerHTML = wk.exercises.map((ex, ei) => `
    <div class="exercise-block" id="ex-${ei}">
      <div class="ex-header">
        <div>
          <div class="ex-name">${ex.name}</div>
          <div class="ex-quality-badge">${ex.quality || ""}</div>
        </div>
        <button class="btn-icon danger" onclick="removeExercise(${ei})" title="Remove exercise">
          <i class="ph ph-trash"></i>
        </button>
      </div>
      <div class="sets-table">
        <div class="set-header-row">
          <span>Set</span><span>Weight</span><span>Reps</span><span>RPE</span><span>e1RM</span><span></span>
        </div>
        ${ex.sets.map((s, si) => {
        const e1rm = calculateE1RM(s.weight, s.reps);
        return `
          <div class="set-row" id="set-${ei}-${si}">
            <span class="set-num">${si + 1}</span>
            <input type="number" class="set-input" min="0" step="0.5" value="${s.weight || ""}" placeholder="kg"
              onchange="updateSet(${ei},${si},'weight',this.value)">
            <input type="number" class="set-input" min="1" value="${s.reps || ""}" placeholder="reps"
              onchange="updateSet(${ei},${si},'reps',this.value)">
            <select class="set-input rpe-select" onchange="updateSet(${ei},${si},'rpe',this.value)">
              ${[6, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(r =>
            `<option value="${r}" ${s.rpe == r ? "selected" : ""}>${r}</option>`
        ).join("")}
            </select>
            <span class="set-num" style="color:var(--green)">${e1rm ? e1rm + 'kg' : '—'}</span>
            <button class="btn-icon" onclick="removeSet(${ei},${si})" title="Remove set">
              <i class="ph ph-x"></i>
            </button>
          </div>`;
    }).join("")}
      </div>
      <div class="ex-actions">
        <button class="btn-sm" onclick="addSet(${ei})"><i class="ph ph-plus"></i> Add Set</button>
        <button class="btn-sm accent" onclick="suggestNextSet(${ei})"><i class="ph ph-robot"></i> AI Suggest</button>
      </div>
      <div id="ai-suggest-${ei}" class="ai-suggest-box" style="display:none"></div>
    </div>`).join("");
}

window.removeExercise = function (ei) {
    STATE.activeWorkout.exercises.splice(ei, 1);
    renderActiveWorkout();
};

window.addSet = function (ei) {
    const lastSet = STATE.activeWorkout.exercises[ei].sets.slice(-1)[0] || {};
    STATE.activeWorkout.exercises[ei].sets.push({
        weight: lastSet.weight || 0,
        reps: lastSet.reps || 5,
        rpe: lastSet.rpe || 8
    });
    renderActiveWorkout();
};

window.removeSet = function (ei, si) {
    STATE.activeWorkout.exercises[ei].sets.splice(si, 1);
    renderActiveWorkout();
};

window.updateSet = function (ei, si, field, val) {
    STATE.activeWorkout.exercises[ei].sets[si][field] = parseFloat(val) || val;
    if (field === 'weight' || field === 'reps') {
        renderActiveWorkout();
        if (STATE.activeWorkout.exercises[ei].sets[si].weight > 0 && STATE.activeWorkout.exercises[ei].sets[si].reps > 0) {
            startRestTimer(120); // Default 2 min rest
        }
    }
};

window.suggestNextSet = async function (ei) {
    const ex = STATE.activeWorkout.exercises[ei];
    if (ex.sets.length === 0) { alert("Log at least one set first."); return; }
    const box = document.getElementById(`ai-suggest-${ei}`);
    box.style.display = "block";
    box.innerHTML = `<span class="loading-dots">AI thinking<span>.</span><span>.</span><span>.</span></span>`;
    const suggestion = await getNextSetSuggestion(ex.name, ex.sets, STATE.profile);
    if (suggestion) {
        box.innerHTML = `
      <div class="suggest-content">
        <strong>AI Recommends:</strong>
        <span class="suggest-val">${suggestion.weight}kg × ${suggestion.reps} reps @ RPE ${suggestion.rpe}</span>
        <span class="suggest-note">${suggestion.note}</span>
        <button class="btn-sm accent" onclick="applyAiSet(${ei}, ${JSON.stringify(suggestion).replace(/"/g, '&quot;')})">
          Apply
        </button>
      </div>`;
    } else {
        box.innerHTML = `<span class="muted">AI suggestion unavailable. Check API key in Settings.</span>`;
    }
};

window.applyAiSet = function (ei, suggestion) {
    STATE.activeWorkout.exercises[ei].sets.push({
        weight: suggestion.weight,
        reps: suggestion.reps,
        rpe: suggestion.rpe
    });
    document.getElementById(`ai-suggest-${ei}`).style.display = "none";
    renderActiveWorkout();
};

function addExerciseToWorkout(exercise) {
    if (!STATE.activeWorkout) startWorkout();
    STATE.activeWorkout.exercises.push({
        name: exercise.name,
        quality: exercise.quality,
        sets: [{ weight: 0, reps: 5, rpe: 8 }]
    });
    renderActiveWorkout();
    navigate("logger");
    document.getElementById("workout-empty-state").style.display = "none";
    document.getElementById("workout-logger").style.display = "block";
}

function finishWorkout() {
    if (!STATE.activeWorkout) return;
    const notes = document.getElementById("workout-notes")?.value || "";
    STATE.activeWorkout.notes = notes;
    STATE.workouts.push({ ...STATE.activeWorkout });
    STATE.activeWorkout = null;
    save();

    document.getElementById("workout-logger").style.display = "none";
    document.getElementById("workout-empty-state").style.display = "block";

    showToast("Workout saved! 💪");
}

// ─── BIOMARKER TRACKER ───────────────────────────────────────
function renderBiomarkerUI() {
    const catEl = document.getElementById("bm-categories");
    catEl.innerHTML = Object.keys(BIOMARKER_CATEGORIES).map(cat => `
    <button class="bm-cat-btn" data-cat="${cat}" onclick="selectBMCategory('${cat}')">${cat}</button>
  `).join("");

    // Show recent entries
    renderRecentBiomarkers();
    renderBiomarkerAnalytics();
}

window.startRestTimer = function (seconds) {
    if (STATE.restTimer.interval) clearInterval(STATE.restTimer.interval);
    STATE.restTimer.active = true;
    STATE.restTimer.remaining = seconds;
    document.getElementById("rest-timer-overlay").style.display = "flex";
    updateTimerDisplay();

    STATE.restTimer.interval = setInterval(() => {
        STATE.restTimer.remaining--;
        if (STATE.restTimer.remaining <= 0) {
            clearInterval(STATE.restTimer.interval);
            STATE.restTimer.active = false;
            document.getElementById("rest-timer-overlay").style.display = "none";
            showToast("Rest finished! Next set. ⚡");
        }
        updateTimerDisplay();
    }, 1000);
};

window.adjustTimer = function (seconds) {
    STATE.restTimer.remaining = Math.max(0, STATE.restTimer.remaining + seconds);
    updateTimerDisplay();
};

function updateTimerDisplay() {
    const mins = Math.floor(STATE.restTimer.remaining / 60);
    const secs = STATE.restTimer.remaining % 60;
    document.getElementById("rest-timer-display").textContent =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

window.selectBMCategory = function (cat) {
    document.querySelectorAll(".bm-cat-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(`[data-cat="${cat}"]`)?.classList.add("active");

    const markers = BIOMARKER_CATEGORIES[cat];
    const selectEl = document.getElementById("bm-name");
    selectEl.innerHTML = markers.map(m =>
        `<option value="${m.name}" data-unit="${m.unit}">${m.icon} ${m.name} (${m.unit})</option>`
    ).join("");
    updateBMUnit();
};

window.updateBMUnit = function () {
    const sel = document.getElementById("bm-name");
    const opt = sel.selectedOptions[0];
    const unit = opt?.getAttribute("data-unit") || "";
    document.getElementById("bm-unit-label").textContent = unit;
};

function logBiomarker() {
    const name = document.getElementById("bm-name").value;
    const value = parseFloat(document.getElementById("bm-value").value);
    const date = document.getElementById("bm-date").value || today();
    const opt = document.querySelector("#bm-name option:checked");
    const unit = opt?.getAttribute("data-unit") || "";

    if (!name || isNaN(value)) { showToast("Please fill in name and value.", "error"); return; }

    STATE.biomarkers.push({ id: uid(), date, name, value, unit, category: getCurrentBMCategory() });
    STATE.biomarkers.sort((a, b) => a.date.localeCompare(b.date));
    save();
    document.getElementById("bm-value").value = "";
    renderRecentBiomarkers();
    showToast("Biomarker logged! 📊");
}

function getCurrentBMCategory() {
    return document.querySelector(".bm-cat-btn.active")?.getAttribute("data-cat") || "Body Composition";
}

function renderRecentBiomarkers() {
    const el = document.getElementById("bm-recent-list");
    const recent = [...STATE.biomarkers].reverse().slice(0, 15);
    if (!recent.length) {
        el.innerHTML = `<p class="muted stagger-item">No biomarkers logged yet.</p>`;
        return;
    }
    el.innerHTML = recent.map((b, i) => `
      <div class="bm-entry-row stagger-item delay-${Math.min(i + 1, 5)}">
        <span class="bm-date">${formatDate(b.date)}</span>
        <span class="bm-name">${b.name}</span>
        <span class="bm-value">${b.value} <span class="bm-unit">${b.unit}</span></span>
        <button class="btn-icon-sm danger" onclick="deleteBiomarker('${b.id}')"><i class="ph ph-trash"></i></button>
      </div>
    `).join("");
}

window.deleteBiomarker = function (id) {
    STATE.biomarkers = STATE.biomarkers.filter(b => b.id !== id);
    save();
    renderRecentBiomarkers();
};

async function runBiomarkerAnalysis() {
    const btn = document.getElementById("btn-analyze-bio"); // Changed from btn-run-analysis
    const resultEl = document.getElementById("bio-analysis-result"); // Changed from analysis-result
    if (STATE.biomarkers.length < 3) { showToast("Need at least 3 entries to analyze trends. 📊", "error"); return; } // Added error type

    btn.disabled = true;
    btn.textContent = "Analyzing..."; // Added this line back
    resultEl.innerHTML = `<div class="ai-thinking animate-pulse">Running patterns through AI Coach...</div>`;
    resultEl.style.display = "block";

    try {
        const analysis = await analyzeBiomarkers(STATE.biomarkers, STATE.profile);
        resultEl.innerHTML = `
      <div class="analysis-box stagger-item fadeInUp">
        <div class="analysis-header"><i class="ph ph-sparkle"></i> AI HEALTH INSIGHT</div>
        <div class="analysis-content">${markdownToHTML(analysis)}</div>
      </div>`;
    } catch (err) {
        resultEl.innerHTML = `<p class="error">Analysis failed. Check your API key.</p>`;
    } finally {
        btn.disabled = false;
        btn.textContent = "AI Analysis"; // Added this line back
    }
}

// ─── ANALYTICS ───────────────────────────────────────────────
function renderAnalytics() {
    if (!STATE.workouts.length) {
        document.getElementById("analytics-empty").style.display = "block";
        return;
    }
    document.getElementById("analytics-empty").style.display = "none";

    // Weekly volume
    const volumeData = buildVolumeData();
    renderVolumeChart("chart-volume", volumeData);

    // Top 5 exercises by volume
    const topExData = buildTopExercisesData();
    renderPRChart("chart-exercises", topExData);

    // PRs table
    const prs = getPRs();
    const prTableEl = document.getElementById("pr-table-body");
    prTableEl.innerHTML = Object.entries(prs).map(([name, data]) =>
        `<tr><td>${name}</td><td>${data.weight} kg</td><td>${data.reps}</td><td>${formatDate(data.date)}</td></tr>`
    ).join("");

    renderBiomarkerAnalytics();
}

function renderBiomarkerAnalytics() {
    const container = document.getElementById("analytics-charts-grid"); // Need to add this to HTML
    if (!container) return;

    const uniqueMarkers = [...new Set(STATE.biomarkers.map(b => b.name))];
    container.innerHTML = uniqueMarkers.map(m => `
        <div class="card" style="margin-bottom:1rem">
            <div class="card-header"><i class="ph ph-chart-line"></i><span>${m} History</span></div>
            <div class="chart-wrap"><canvas id="chart-bm-${m.replace(/\s+/g, '-')}"></canvas></div>
        </div>
    `).join("");

    uniqueMarkers.forEach(m => {
        const data = STATE.biomarkers.filter(b => b.name === m);
        renderBiomarkerChart(`chart-bm-${m.replace(/\s+/g, '-')}`, {
            markerName: m,
            labels: data.map(d => formatDate(d.date)),
            values: data.map(d => d.value)
        });
    });
}

function buildVolumeData() {
    const byDate = {};
    for (const w of STATE.workouts) {
        byDate[w.date] = (byDate[w.date] || 0) + calcVolume(w);
    }
    const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).slice(-12);
    return { labels: sorted.map(([d]) => formatDate(d)), values: sorted.map(([, v]) => Math.round(v)) };
}

function buildTopExercisesData() {
    const vol = {};
    for (const w of STATE.workouts) {
        for (const ex of w.exercises) {
            const v = ex.sets.reduce((s, set) => s + (set.weight || 0) * (set.reps || 0), 0);
            vol[ex.name] = (vol[ex.name] || 0) + v;
        }
    }
    const top = Object.entries(vol).sort(([, a], [, b]) => b - a).slice(0, 8);
    return { labels: top.map(([n]) => n), values: top.map(([, v]) => Math.round(v)) };
}

// ─── EXERCISE LIBRARY ────────────────────────────────────────
function renderLibrary(filter = "", qualityFilter = "") {
    let exercises = EXERCISE_LIBRARY;
    if (qualityFilter) exercises = exercises.filter(e => e.quality === qualityFilter);
    if (filter) {
        const f = filter.toLowerCase();
        exercises = exercises.filter(e =>
            e.name.toLowerCase().includes(f) ||
            e.muscles.some(m => m.toLowerCase().includes(f)) ||
            e.quality.toLowerCase().includes(f)
        );
    }

    const el = document.getElementById("library-grid");
    if (!exercises.length) {
        el.innerHTML = `<p class="muted">No exercises found.</p>`;
        return;
    }
    el.innerHTML = exercises.map(ex => `
    <div class="lib-card">
      <div class="lib-quality">${ex.quality}</div>
      <div class="lib-name">${ex.name}</div>
      <div class="lib-muscles">${ex.muscles.join(" · ")}</div>
      <div class="lib-equipment">${ex.equipment}</div>
      <p class="lib-instructions">${ex.instructions}</p>
      <button class="btn-sm accent" onclick="quickAddExercise('${ex.name.replace(/'/g, "\\'")}')">
        <i class="ph ph-plus"></i> Add to Workout
      </button>
    </div>`).join("");

    // Populate quality filter chips
    const chipsEl = document.getElementById("quality-chips");
    const qualities = [...new Set(EXERCISE_LIBRARY.map(e => e.quality))];
    chipsEl.innerHTML = `<button class="chip ${!qualityFilter ? "active" : ""}" onclick="filterLibrary('', '')">All</button>` +
        qualities.map(q => `<button class="chip ${qualityFilter === q ? "active" : ""}" onclick="filterLibrary('', '${q}')">${q}</button>`).join("");
}

window.filterLibrary = function (search, quality) {
    const searchVal = search || document.getElementById("lib-search")?.value || "";
    renderLibrary(searchVal, quality);
};

window.quickAddExercise = function (name) {
    const ex = EXERCISE_LIBRARY.find(e => e.name === name);
    if (ex) { addExerciseToWorkout(ex); showToast(`${name} added to workout!`); }
};

// ─── PROFILE ─────────────────────────────────────────────────
function renderProfile() {
    document.getElementById("prof-name").value = STATE.profile.name || "";
    document.getElementById("prof-age").value = STATE.profile.age || "";
    document.getElementById("prof-weight").value = STATE.profile.weight || "";
    document.getElementById("prof-height").value = STATE.profile.height || "";

    const sportSel = document.getElementById("prof-sport");
    sportSel.innerHTML = SPORTS.map(s => `<option value="${s}" ${STATE.profile.sport === s ? "selected" : ""}>${s}</option>`).join("");
    const goalSel = document.getElementById("prof-goal");
    goalSel.innerHTML = GOALS.map(g => `<option value="${g}" ${STATE.profile.goal === g ? "selected" : ""}>${g}</option>`).join("");
    const expSel = document.getElementById("prof-exp");
    expSel.innerHTML = EXPERIENCE_LEVELS.map(e => `<option value="${e}" ${STATE.profile.experience === e ? "selected" : ""}>${e}</option>`).join("");
}

function saveProfile() {
    STATE.profile.name = document.getElementById("prof-name").value;
    STATE.profile.sport = document.getElementById("prof-sport").value;
    STATE.profile.goal = document.getElementById("prof-goal").value;
    STATE.profile.experience = document.getElementById("prof-exp").value;
    STATE.profile.age = document.getElementById("prof-age").value;
    STATE.profile.weight = document.getElementById("prof-weight").value;
    STATE.profile.height = document.getElementById("prof-height").value;
    save();
    showToast("Profile saved! ✅");
}

// ─── AI COACH CHAT ───────────────────────────────────────────
async function sendChatMessage() {
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg) return;

    appendChatBubble("user", msg);
    STATE.chatHistory.push({ role: "user", content: msg });
    input.value = "";
    input.style.height = "auto";

    const typingId = appendChatBubble("model", null, true);
    try {
        const response = await chatWithAI(msg, STATE.profile, STATE.workouts, STATE.biomarkers, STATE.chatHistory.slice(-20));
        document.getElementById(typingId).remove();
        appendChatBubble("model", response);
        STATE.chatHistory.push({ role: "model", content: response });
        save();
    } catch (e) {
        document.getElementById(typingId).remove();
        const errMsg = e.message === "NO_API_KEY"
            ? "Please set your Gemini API key in Settings to use the AI Coach."
            : `Error: ${e.message}`;
        appendChatBubble("model", errMsg, false, true);
    }
    scrollChatToBottom();
}

function appendChatBubble(role, content, isTyping = false, isError = false) {
    const id = `msg-${uid()}`;
    const container = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.id = id;
    div.className = `chat-bubble ${role === "user" ? "user-bubble" : "ai-bubble"}${isError ? " error-bubble" : ""}`;
    if (isTyping) {
        div.innerHTML = `<span class="loading-dots animate-pulse"><span>.</span><span>.</span><span>.</span></span>`;
    } else {
        div.innerHTML = markdownToHTML(content || "");
    }
    container.appendChild(div);
    scrollChatToBottom();
    return id;
}

function scrollChatToBottom() {
    const el = document.getElementById("chat-messages");
    el.scrollTop = el.scrollHeight;
}

function clearChat() {
    if (!confirm("Clear all chat history?")) return;
    STATE.chatHistory = [];
    save();
    document.getElementById("chat-messages").innerHTML = "";
    showToast("Chat cleared.");
}

async function generatePlan() {
    if (!STATE.profile.sport) { showToast("Please fill in your profile first.", "error"); return; }
    const btn = document.getElementById("btn-gen-plan");
    btn.disabled = true;
    btn.textContent = "Generating...";
    appendChatBubble("user", `Generate a training program for me (${STATE.profile.sport}, ${STATE.profile.goal}, ${STATE.profile.experience})`);
    const typingId = appendChatBubble("model", null, true);
    try {
        const plan = await generateWorkoutPlan(STATE.profile);
        document.getElementById(typingId).remove();
        appendChatBubble("model", plan);
        STATE.chatHistory.push({ role: "user", content: `Generate a training program for me` }, { role: "model", content: plan });
        save();
        navigate("coach");
    } catch (e) {
        document.getElementById(typingId).remove();
        appendChatBubble("model", e.message === "NO_API_KEY" ? "Set your API key in Settings first." : e.message, false, true);
        navigate("coach");
    }
    btn.disabled = false;
    btn.textContent = "Generate Plan";
}

// ─── SETTINGS ────────────────────────────────────────────────
function renderSettings() {
    const key = localStorage.getItem("ag_api_key") || "";
    document.getElementById("api-key-input").value = key ? "••••••••••••" + key.slice(-4) : "";
    document.getElementById("api-key-real").value = key;

    // Supabase
    document.getElementById("sb-url-input").value = localStorage.getItem("ag_sb_url") || "";
    document.getElementById("sb-key-input").value = localStorage.getItem("ag_sb_key") || "";
}

function saveApiKey() {
    const key = document.getElementById("api-key-real").value.trim();
    if (!key) { showToast("Please enter a valid API key.", "error"); return; }
    localStorage.setItem("ag_api_key", key);
    renderSettings();
    showToast("API key saved! 🔑");
}

function saveSupabaseConfig() {
    const url = document.getElementById("sb-url-input").value.trim();
    const key = document.getElementById("sb-key-input").value.trim();
    if (!url || !key) { showToast("Enter URL and Key. 🔌"); return; }

    localStorage.setItem("ag_sb_url", url);
    localStorage.setItem("ag_sb_key", key);
    showToast("Supabase linked! Reloading... 🔄");
    setTimeout(() => location.reload(), 1000);
}

function exportData() {
    const data = {
        profile: STATE.profile,
        workouts: STATE.workouts,
        biomarkers: STATE.biomarkers,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `athlete-data-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Data exported! 📤");
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.profile) STATE.profile = data.profile;
            if (data.workouts) STATE.workouts = data.workouts;
            if (data.biomarkers) STATE.biomarkers = data.biomarkers;
            save();
            renderDashboard();
            showToast("Data imported! 📥");
        } catch { showToast("Invalid file.", "error"); }
    };
    reader.readAsText(file);
}

// ─── Utility UI ─────────────────────────────────────────────
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function markdownToHTML(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/^### (.+)$/gm, "<h4>$1</h4>")
        .replace(/^## (.+)$/gm, "<h3>$1</h3>")
        .replace(/^# (.+)$/gm, "<h2>$1</h2>")
        .replace(/^- (.+)$/gm, "<li>$1</li>")
        .replace(/(<li>.+<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
        .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/^(?!<[hul]|<li|<\/)(.*)/gm, (m, p1) => p1 ? `<p>${p1}</p>` : "")
        .replace(/`(.+?)`/g, "<code>$1</code>");
}

// ─── Authentication ──────────────────────────────────────────
async function handleLogin() {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    if (!email || !password) return showToast("Enter credentials. 🔑");

    if (!SupabaseService.isConfigured() || !sb) {
        return showToast("Please configure Supabase first. ⚙️", "error");
    }

    document.getElementById("btn-login").disabled = true;
    try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
    } catch (err) {
        showToast(err.message + " ❌");
        document.getElementById("btn-login").disabled = false;
    }
}

async function handleRegister() {
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    if (!email || password.length < 6) return showToast("Valid email + 6 char pass. 📝");

    if (!SupabaseService.isConfigured() || !sb) {
        return showToast("Please configure Supabase first. ⚙️", "error");
    }

    document.getElementById("btn-register").disabled = true;
    try {
        const { error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        showToast("Welcome! Check email if confirmation enabled. 📧");
    } catch (err) {
        showToast(err.message + " ❌");
        document.getElementById("btn-register").disabled = false;
    }
}

async function handleLogout() {
    if (sb) await sb.auth.signOut();
    location.reload();
}

function handleAuthConfigSave() {
    const url = document.getElementById("auth-sb-url").value.trim();
    const key = document.getElementById("auth-sb-key").value.trim();
    if (!url || !key) return showToast("Enter valid URL and Key. 🔌");

    localStorage.setItem("ag_sb_url", url);
    localStorage.setItem("ag_sb_key", key);
    showToast("Supabase configured! Reloading... 🔄");
    setTimeout(() => location.reload(), 1000);
}

function updateAuthState(session) {
    STATE.user = session?.user || null;
    const overlay = document.getElementById("auth-overlay");
    if (STATE.user) {
        overlay.style.display = "none";
        loadData(); // FIX: Changed from load() to loadData()
        renderDashboard();
        navigate("dashboard");
    } else {
        overlay.style.display = "flex";
    }
}

// ─── INIT ────────────────────────────────────────────────────
function init() {
    // Admin Mode Detection
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === GLOBAL_CONFIG.ADMIN_PATH) {
        document.querySelectorAll(".admin-only").forEach(el => el.style.display = "block");
        console.log("Admin Mode Active");
    }

    // Auth Toggles
    document.getElementById("link-show-register")?.addEventListener("click", () => {
        document.getElementById("auth-view-login").style.display = "none";
        document.getElementById("auth-view-register").style.display = "block";
    });
    document.getElementById("link-show-login")?.addEventListener("click", () => {
        document.getElementById("auth-view-register").style.display = "none";
        document.getElementById("auth-view-login").style.display = "block";
    });

    // Auth Actions
    document.getElementById("btn-login")?.addEventListener("click", handleLogin);
    document.getElementById("btn-register")?.addEventListener("click", handleRegister);
    document.getElementById("btn-logout")?.addEventListener("click", handleLogout);
    document.getElementById("btn-auth-save-config")?.addEventListener("click", handleAuthConfigSave);

    // Config Toggles
    const showConfig = () => {
        document.getElementById("auth-view-login").style.display = "none";
        document.getElementById("auth-view-register").style.display = "none";
        document.getElementById("auth-view-config").style.display = "block";
        document.getElementById("auth-sb-url").value = localStorage.getItem("ag_sb_url") || "";
        document.getElementById("auth-sb-key").value = localStorage.getItem("ag_sb_key") || "";
    };
    document.getElementById("link-show-config")?.addEventListener("click", showConfig);
    document.getElementById("link-show-config-reg")?.addEventListener("click", showConfig);
    document.getElementById("link-back-to-login")?.addEventListener("click", () => {
        document.getElementById("auth-view-config").style.display = "none";
        document.getElementById("auth-view-login").style.display = "block";
    });

    // Supabase Auth Listener
    if (SupabaseService.isConfigured() && sb) {
        sb.auth.onAuthStateChange((event, session) => {
            updateAuthState(session);
        });

        // Check current session
        sb.auth.getSession().then(({ data: { session } }) => {
            updateAuthState(session);
        });
    } else {
        document.getElementById("auth-overlay").style.display = "flex";
        // If not configured, auto-show the config view to solve the loop
        if (!SupabaseService.isConfigured()) {
            setTimeout(showConfig, 100);
        }
    }

    // Nav
    document.querySelectorAll(".nav-item").forEach(el => {
        el.addEventListener("click", () => navigate(el.dataset.view));
    });

    // Sidebar toggle
    document.getElementById("hamburger")?.addEventListener("click", () => {
        document.getElementById("sidebar").classList.toggle("open");
    });
    document.getElementById("sidebar-overlay")?.addEventListener("click", () => {
        document.getElementById("sidebar").classList.remove("open");
    });

    // Profile
    renderProfile();
    document.getElementById("prof-sport").addEventListener("change", () => {
        STATE.profile.sport = document.getElementById("prof-sport").value;
    });

    // Workout start
    document.getElementById("btn-start-workout")?.addEventListener("click", startWorkout);
    document.getElementById("btn-finish-workout")?.addEventListener("click", finishWorkout);
    document.getElementById("btn-cancel-workout")?.addEventListener("click", () => {
        if (confirm("Discard this workout?")) {
            STATE.activeWorkout = null;
            document.getElementById("workout-logger").style.display = "none";
            document.getElementById("workout-empty-state").style.display = "block";
        }
    });

    // Exercise search in logger
    document.getElementById("ex-search")?.addEventListener("input", function () {
        const val = this.value.toLowerCase();
        const results = EXERCISE_LIBRARY.filter(e =>
            e.name.toLowerCase().includes(val) || e.quality.toLowerCase().includes(val)
        ).slice(0, 8);
        const dd = document.getElementById("ex-dropdown");
        if (!val) { dd.style.display = "none"; return; }
        dd.innerHTML = results.map(e =>
            `<div class="dd-item" onclick="addExToActive('${e.name.replace(/'/g, "\\'")}')">
        <span>${e.name}</span><span class="dd-quality">${e.quality}</span>
      </div>`
        ).join("") || `<div class="dd-item muted">No exercises found</div>`;
        dd.style.display = "block";
    });

    window.addExToActive = function (name) {
        const ex = EXERCISE_LIBRARY.find(e => e.name === name);
        if (!STATE.activeWorkout) startWorkout();
        if (ex) {
            STATE.activeWorkout.exercises.push({ name: ex.name, quality: ex.quality, sets: [{ weight: 0, reps: 5, rpe: 8 }] });
        } else {
            STATE.activeWorkout.exercises.push({ name, quality: "", sets: [{ weight: 0, reps: 5, rpe: 8 }] });
        }
        renderActiveWorkout();
        document.getElementById("ex-search").value = "";
        document.getElementById("ex-dropdown").style.display = "none";
        document.getElementById("workout-empty-state").style.display = "none";
        document.getElementById("workout-logger").style.display = "block";
    };

    // Chat
    document.getElementById("btn-send-chat")?.addEventListener("click", sendChatMessage);
    document.getElementById("chat-input")?.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
    });
    document.getElementById("chat-input")?.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 160) + "px";
    });
    document.getElementById("btn-clear-chat")?.addEventListener("click", clearChat);
    document.getElementById("btn-gen-plan")?.addEventListener("click", generatePlan);

    // Biomarker
    renderBiomarkerUI();
    document.getElementById("btn-log-bm")?.addEventListener("click", logBiomarker);
    document.getElementById("btn-analyze-bio")?.addEventListener("click", runBiomarkerAnalysis);
    document.getElementById("bm-name")?.addEventListener("change", updateBMUnit);
    document.getElementById("bm-date").value = today();

    // Library search
    document.getElementById("lib-search")?.addEventListener("input", function () {
        filterLibrary(this.value, "");
    });

    // Profile save
    document.getElementById("btn-save-profile")?.addEventListener("click", saveProfile);

    // Settings
    document.getElementById("btn-save-api")?.addEventListener("click", saveApiKey);
    document.getElementById("btn-save-sb")?.addEventListener("click", saveSupabaseConfig);
    document.getElementById("api-key-real")?.addEventListener("input", function () {
        document.getElementById("api-key-input").value = this.value ? "••••••••••••" + this.value.slice(-4) : "";
    });
    document.getElementById("btn-export")?.addEventListener("click", exportData);
    document.getElementById("btn-import")?.addEventListener("click", () => document.getElementById("import-file").click());
    document.getElementById("import-file")?.addEventListener("change", importData);
    renderSettings();

    // Restore chat history
    if (STATE.chatHistory.length) {
        STATE.chatHistory.forEach(msg => appendChatBubble(msg.role, msg.content));
    }

    // Navigate first
    navigate("dashboard");
    renderDashboard();

    document.getElementById("btn-skip-timer")?.addEventListener("click", () => {
        if (STATE.restTimer.interval) clearInterval(STATE.restTimer.interval);
        STATE.restTimer.active = false;
        document.getElementById("rest-timer-overlay").style.display = "none";
    });
}

document.addEventListener("DOMContentLoaded", init);
