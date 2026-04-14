// js/ui/dashboard.js
// Orchestrates the dashboard: combines nodegrid + queueview with a tick loop.
import { renderNodeGrid } from './nodegrid.js';
import { renderQueueView } from './queueview.js';
import { cycleFictionalJobs } from '../users.js';

const TICK_MS = 2000;
const SPEEDS = [1, 5, 10, 25, 50];

export function mountDashboard({ cluster, state, container, getCurrentUser }) {
    let speedIdx = 0;

    function getSpeed() { return SPEEDS[speedIdx]; }

    function renderSpeedControl() {
        const speed = getSpeed();
        const label = speed === 1 ? '1×' : `${speed}×`;
        const cls = speed > 1 ? 'speed-btn active' : 'speed-btn';
        return `
            <div class="speed-control">
                <button class="speed-cycle ${cls}" title="Clique pra acelerar a simulação do cluster">
                    ⏩ ${label}
                </button>
                <span class="speed-hint">${speed === 1 ? 'tempo real (2s/tick)' : `acelerado ${speed}× — jobs avançam mais rápido`}</span>
            </div>
        `;
    }

    function render() {
        container.innerHTML = `
            <div class="dashboard-inner">
                ${renderSpeedControl()}
                ${renderNodeGrid(cluster)}
                ${renderQueueView(cluster, getCurrentUser())}
            </div>
        `;
        // Bind speed button
        container.querySelector('.speed-cycle')?.addEventListener('click', () => {
            speedIdx = (speedIdx + 1) % SPEEDS.length;
            render();
        });
    }
    render();

    const interval = setInterval(() => {
        const speed = getSpeed();
        cluster.tick(2 * speed);
        cycleFictionalJobs(cluster);
        render();
    }, TICK_MS);

    return {
        render,
        stop() { clearInterval(interval); },
        getSpeed
    };
}
