// js/ui/dashboard.js
// Orchestrates the dashboard: combines nodegrid + queueview with a tick loop.
import { renderNodeGrid } from './nodegrid.js';
import { renderQueueView } from './queueview.js';
import { cycleFictionalJobs } from '../users.js';

const TICK_MS = 2000;

export function mountDashboard({ cluster, state, container, getCurrentUser }) {
    function render() {
        container.innerHTML = `
            <div class="dashboard-inner">
                ${renderNodeGrid(cluster)}
                ${renderQueueView(cluster, getCurrentUser())}
            </div>
        `;
    }
    render();

    const interval = setInterval(() => {
        const speed = (state.preferencias && state.preferencias.velocidadeTick) || 1;
        cluster.tick(2 * speed);
        cycleFictionalJobs(cluster);
        render();
    }, TICK_MS);

    return {
        render,
        stop() { clearInterval(interval); }
    };
}
