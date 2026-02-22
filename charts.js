// ============================================================
//  CHARTS.JS — Chart.js wrappers for analytics views
// ============================================================

const chartInstances = {};

function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}

export function renderVolumeChart(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
        type: "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Total Volume (kg)",
                data: data.values,
                backgroundColor: "rgba(99, 102, 241, 0.7)",
                borderColor: "rgba(99, 102, 241, 1)",
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: "#e2e8f0", font: { family: "Inter" } } },
                tooltip: {
                    callbacks: {
                        label: ctx => ` ${ctx.parsed.y.toLocaleString()} kg`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
                    grid: { color: "rgba(255,255,255,0.07)" },
                    beginAtZero: true
                }
            }
        }
    });
}

export function renderBiomarkerChart(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;

    chartInstances[canvasId] = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.labels,
            datasets: [{
                label: data.markerName,
                data: data.values,
                borderColor: "rgba(16, 185, 129, 1)",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "rgba(16, 185, 129, 1)",
                pointBorderColor: "#1e293b",
                pointBorderWidth: 2,
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: "#e2e8f0", font: { family: "Inter" } } }
            },
            scales: {
                x: {
                    ticks: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
                    grid: { color: "rgba(255,255,255,0.05)" }
                },
                y: {
                    ticks: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
                    grid: { color: "rgba(255,255,255,0.07)" }
                }
            }
        }
    });
}

export function renderPRChart(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId)?.getContext("2d");
    if (!ctx) return;

    const colors = [
        "rgba(99,102,241,0.8)", "rgba(16,185,129,0.8)", "rgba(245,158,11,0.8)",
        "rgba(239,68,68,0.8)", "rgba(139,92,246,0.8)", "rgba(14,165,233,0.8)",
        "rgba(236,72,153,0.8)", "rgba(251,146,60,0.8)"
    ];

    chartInstances[canvasId] = new Chart(ctx, {
        type: "horizontalBar" in Chart.defaults ? "horizontalBar" : "bar",
        data: {
            labels: data.labels,
            datasets: [{
                label: "Total Volume (kg)",
                data: data.values,
                backgroundColor: colors,
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    ticks: { color: "#94a3b8", font: { family: "Inter", size: 11 } },
                    grid: { color: "rgba(255,255,255,0.07)" },
                    beginAtZero: true
                },
                y: {
                    ticks: { color: "#e2e8f0", font: { family: "Inter", size: 12 } },
                    grid: { display: false }
                }
            }
        }
    });
}
