// js/ui/sandbox.js
// Cheat sheet view when the sandbox is unlocked.

export function renderSandboxCheatsheet() {
    return `
        <div class="sandbox-cheatsheet">
            <h2>Sandbox — exploração livre</h2>
            <p>Parabéns, você completou o tour! A partir daqui o terminal aceita qualquer comando sem restrições. O cluster continua vivo — outros usuários submetendo jobs, nós mudando de estado.</p>

            <h4>Cheat sheet</h4>
            <table class="cheat-table">
                <tr><td><code>module load arch_gpu/current</code></td><td>Carrega arch H100</td></tr>
                <tr><td><code>module load anaconda3/2024.02</code></td><td>Carrega conda</td></tr>
                <tr><td><code>sbatch train_palmvein.srm</code></td><td>Submete job</td></tr>
                <tr><td><code>squeue --me</code></td><td>Seus jobs</td></tr>
                <tr><td><code>sinfo -p lncc-h100</code></td><td>Estado dos H100</td></tr>
                <tr><td><code>scancel &lt;ID&gt;</code></td><td>Cancela seu job</td></tr>
                <tr><td><code>scontrol show jobid &lt;ID&gt;</code></td><td>Detalhes</td></tr>
                <tr><td><code>sacct -lj &lt;ID&gt;</code></td><td>Histórico completo</td></tr>
                <tr><td><code>nvidia-smi</code></td><td>GPUs (só compute)</td></tr>
                <tr><td><code>cat slurm-&lt;ID&gt;.out</code></td><td>Output do job</td></tr>
            </table>

            <h4>Paths</h4>
            <ul>
                <li><code>/scratch/palmvein/unseen/</code> — $HOME == $SCRATCH (todos os nós)</li>
            </ul>

            <button class="btn-voltar-tour">← Voltar ao tour</button>
        </div>
    `;
}
