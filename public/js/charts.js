/**
 * Chart.js Integrations for Food Flux Dashboards
 * Initializes interactive charts with dark mode styling matching the glassmorphism theme
 */

document.addEventListener('DOMContentLoaded', () => {
    // ─── Global Chart.js Defaults ──────────────────────────────────────────
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = '#a0aec0';
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        Chart.defaults.plugins.tooltip.titleColor = '#fff';
        Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.displayColors = true;
        Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';
        Chart.defaults.scale.grid.borderColor = 'rgba(255, 255, 255, 0.1)';
    }

    // Colors matching CSS theme
    const BRAND_COLORS = {
        primary: 'rgba(108, 92, 231, 1)',   // #6c5ce7
        secondary: 'rgba(236, 72, 153, 1)', // #ec4899
        tertiary: 'rgba(52, 211, 153, 1)',  // #34d399
        warning: 'rgba(251, 191, 36, 1)',
        info: 'rgba(56, 189, 248, 1)',
        primaryBg: 'rgba(108, 92, 231, 0.2)',
        secondaryBg: 'rgba(236, 72, 153, 0.2)',
    };

    // ─── 1. Homepage Impact Chart ───────────────────────────────────────
    const homeChartEl = document.getElementById('homeImpactChart');
    if (homeChartEl) {
        new Chart(homeChartEl, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
                datasets: [{
                    label: 'Meals Saved',
                    data: [120, 190, 250, 310, 400, 520],
                    borderColor: BRAND_COLORS.secondary,
                    backgroundColor: BRAND_COLORS.secondaryBg,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: BRAND_COLORS.secondary,
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, recommendedMax: 600 }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        });
    }

    // ─── 2. Full Dashboard - Monthly Trend (Simplified Sparkline) ────────
    const monthlyCtx = document.getElementById('monthlyTrendChart');
    if (monthlyCtx) {
        new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
                datasets: [{
                    label: 'Meals Distributed',
                    data: [40, 55, 80, 110, 145, 185],
                    borderColor: BRAND_COLORS.tertiary,
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 2,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0 }
                },
                layout: { padding: 5 },
                interaction: { mode: 'index', intersect: false }
            }
        });
    }

    // ─── 3. Full Dashboard - Food Types ──────────────────────────────────
    const typesCtx = document.getElementById('foodTypesChart');
    if (typesCtx) {
        new Chart(typesCtx, {
            type: 'doughnut',
            data: {
                labels: ['Prepared Meals', 'Baked Goods', 'Fresh Produce', 'Packaged Goods'],
                datasets: [{
                    data: [45, 25, 20, 10],
                    backgroundColor: [
                        BRAND_COLORS.secondary,
                        BRAND_COLORS.warning,
                        BRAND_COLORS.tertiary,
                        BRAND_COLORS.info
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // ─── 4. Full Dashboard - Impact Areas ────────────────────────────────
    const areasCtx = document.getElementById('impactAreasChart');
    if (areasCtx) {
        new Chart(areasCtx, {
            type: 'radar',
            data: {
                labels: ['Community Shelters', 'Orphanages', 'Street Drives', 'Elderly Care', 'Schools'],
                datasets: [{
                    label: 'Food Distributed (%)',
                    data: [35, 25, 20, 10, 10],
                    backgroundColor: BRAND_COLORS.primaryBg,
                    borderColor: BRAND_COLORS.primary,
                    pointBackgroundColor: BRAND_COLORS.primary,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#cbd5e1', font: { size: 12 } },
                        ticks: { display: false }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
});
