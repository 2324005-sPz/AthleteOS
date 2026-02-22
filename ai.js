// ============================================================
//  AI.JS — Gemini API Integration & Prompt Engineering
// ============================================================

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function getApiKey() {
    return localStorage.getItem("ag_api_key") || "";
}

function buildSystemContext(profile, recentWorkouts, recentBiomarkers) {
    const workoutSummary = recentWorkouts.slice(-3).map(w =>
        `${w.date}: ${w.exercises.map(e => `${e.name} (${e.sets.length} sets)`).join(", ")}${w.notes ? ` — Notes: ${w.notes}` : ""}`
    ).join("\n");

    const bioSummary = recentBiomarkers.slice(-10).map(b =>
        `${b.date} | ${b.name}: ${b.value} ${b.unit}`
    ).join("\n");

    return `You are AthleteGPT, an elite AI strength & conditioning coach with expertise in sports science, periodization, biomechanics, physiology, and nutrition. You have worked with Olympic athletes and elite professionals across all disciplines.

ATHLETE PROFILE:
- Name: ${profile.name || "Athlete"}
- Sport: ${profile.sport || "General Fitness"}
- Primary Goal: ${profile.goal || "Athletic Performance"}
- Experience Level: ${profile.experience || "Intermediate"}
- Age: ${profile.age || "N/A"}, Weight: ${profile.weight || "N/A"}kg, Height: ${profile.height || "N/A"}cm

RECENT TRAINING (last 3 sessions):
${workoutSummary || "No recent workouts logged yet."}

RECENT BIOMARKERS:
${bioSummary || "No biomarkers logged yet."}

INSTRUCTIONS:
- Always give evidence-based, specific, actionable advice
- Reference the athlete's sport, goal, and experience in your responses
- Use proper sports science terminology but explain it clearly
- For workout plans, include sets, reps, rest periods, and RPE targets
- Be motivating, direct, and coach-like
- Format responses with clear sections and bullet points when appropriate
- If someone asks about training, nutrition, recovery, or performance — answer in detail`;
}

export async function chatWithAI(userMessage, profile, recentWorkouts, recentBiomarkers, conversationHistory = []) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("NO_API_KEY");

    const systemContext = buildSystemContext(profile, recentWorkouts, recentBiomarkers);

    const contents = [
        ...conversationHistory.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
        })),
        {
            role: "user",
            parts: [{ text: userMessage }]
        }
    ];

    const body = {
        system_instruction: { parts: [{ text: systemContext }] },
        contents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.9
        }
    };

    const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || "API error");
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
}

export async function generateWorkoutPlan(profile) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("NO_API_KEY");

    const prompt = `Create a detailed 4-week training program for:
- Sport: ${profile.sport}
- Goal: ${profile.goal}
- Experience: ${profile.experience}
- Age: ${profile.age || "unknown"}, Weight: ${profile.weight || "unknown"}kg

Format as:
WEEK 1-4 OVERVIEW (periodization rationale)

WEEKLY STRUCTURE:
Day 1 - [Focus]: [exercises with sets × reps @ RPE]
...

KEY PERFORMANCE INDICATORS TO TRACK:
- [specific biomarkers and benchmarks]

RECOVERY PROTOCOLS:
- [specific recommendations]

Make it sport-specific, evidence-based, and immediately actionable.`;

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
    };

    const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate plan.";
}

export async function getNextSetSuggestion(exerciseName, previousSets, profile) {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const setsDesc = previousSets.map((s, i) =>
        `Set ${i + 1}: ${s.weight}kg × ${s.reps} reps @ RPE ${s.rpe}`
    ).join(", ");

    const prompt = `As an AI coach, given these previous sets for ${exerciseName}: ${setsDesc}
Athlete: ${profile.experience} level, goal: ${profile.goal}, sport: ${profile.sport}
Suggest the next set in exactly this JSON format (no markdown, just JSON):
{"weight": number, "reps": number, "rpe": number, "note": "brief coaching tip"}`;

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
    };

    try {
        const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) return null;
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch (e) { /* silent */ }
    return null;
}

export async function analyzeBiomarkers(biomarkerEntries, profile) {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("NO_API_KEY");

    const summary = biomarkerEntries.slice(-20).map(b =>
        `${b.date}: ${b.name} = ${b.value} ${b.unit}`
    ).join("\n");

    const prompt = `Analyze these biomarker trends for a ${profile.experience} ${profile.sport} athlete aiming to ${profile.goal}:

${summary}

Provide:
1. KEY FINDINGS (2-3 observations)
2. PERFORMANCE IMPLICATIONS (what these mean for training)
3. ACTIONABLE RECOMMENDATIONS (3-5 specific actions)
4. WARNING SIGNS (anything to monitor closely)

Be specific and evidence-based.`;

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1500 }
    };

    const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Could not analyze biomarkers.";
}

export async function getDailyTip(profile) {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const day = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const prompt = `Give a single, specific, actionable daily performance tip for a ${profile.experience || "intermediate"} ${profile.sport || "athlete"} focused on ${profile.goal || "athletic performance"}. Today is ${day}. Keep it under 60 words. Start directly with the tip — no intro.`;

    const body = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 120 }
    };

    try {
        const res = await fetch(`${GEMINI_BASE}?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch { return null; }
}
