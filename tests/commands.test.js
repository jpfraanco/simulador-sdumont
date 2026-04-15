// tests/commands.test.js
import { suite, test, assertEqual, assertContains, assertTrue } from '../js/test-harness.js';
import { tokenize } from '../js/commands/parser.js';
import { dispatch } from '../js/commands/index.js';
import { createCluster } from '../js/cluster.js';
import { createFilesystem } from '../js/filesystem.js';
import { createTerminal } from '../js/terminal.js';

// Load all command modules (self-register)
import '../js/commands/fs.js';
import '../js/commands/ssh.js';
import '../js/commands/modules.js';
import '../js/commands/slurm.js';
import '../js/commands/utils.js';

suite('parser');

test('tokenize simple', () => {
    assertEqual(tokenize('ls -la /scratch'), ['ls', '-la', '/scratch']);
});

test('tokenize double quotes', () => {
    assertEqual(tokenize('echo "hello world"'), ['echo', 'hello world']);
});

test('tokenize empty', () => {
    assertEqual(tokenize(''), []);
});

// --- Commands ---

suite('commands');

function ctx(hostname = 'sdumont2nd4') {
    const cluster = createCluster();
    const filesystem = createFilesystem();
    filesystem.setHost(hostname);
    filesystem.setUser('unseen');
    filesystem.setCwd('/scratch/palmvein/unseen');
    return {
        cluster, filesystem,
        terminal: createTerminal(),
        state: { loadedModules: [] },
        currentUser: 'unseen',
        hostname
    };
}

test('pwd returns cwd', () => {
    const r = dispatch(['pwd'], ctx());
    assertContains(r.stdout, '/scratch/palmvein/unseen');
});

test('ls lists entries', () => {
    const r = dispatch(['ls'], ctx());
    assertContains(r.stdout, 'code');
    assertContains(r.stdout, 'train_palmvein.srm');
});

test('cat reads file', () => {
    const r = dispatch(['cat', 'code/requirements.txt'], ctx());
    assertContains(r.stdout, 'torch');
});

test('whoami returns user', () => {
    assertEqual(dispatch(['whoami'], ctx()).stdout.trim(), 'unseen');
});

test('unknown command returns error', () => {
    const r = dispatch(['naoexiste'], ctx());
    assertContains(r.stderr, 'comando não encontrado');
});

test('module avail without arch shows architectures', () => {
    const r = dispatch(['module', 'avail'], ctx());
    assertContains(r.stdout, 'arch_gpu/current');
});

test('module load arch + avail shows software', () => {
    const c = ctx();
    dispatch(['module', 'load', 'arch_gpu/current'], c);
    const r = dispatch(['module', 'avail'], c);
    assertContains(r.stdout, 'cuda/12.4');
});

test('module load + list works', () => {
    const c = ctx();
    dispatch(['module', 'load', 'arch_gpu/current'], c);
    dispatch(['module', 'load', 'cuda/12.4'], c);
    const r = dispatch(['module', 'list'], c);
    assertContains(r.stdout, 'cuda/12.4');
});

test('module purge clears all', () => {
    const c = ctx();
    dispatch(['module', 'load', 'arch_gpu/current'], c);
    dispatch(['module', 'load', 'cuda/12.4'], c);
    dispatch(['module', 'purge'], c);
    const r = dispatch(['module', 'list'], c);
    assertContains(r.stdout, 'No modules loaded');
});

test('sinfo shows partitions', () => {
    const r = dispatch(['sinfo'], ctx());
    assertContains(r.stdout, 'lncc-cpu_amd');
    assertContains(r.stdout, 'lncc-h100');
});

test('sbatch on valid script submits job', () => {
    const c = ctx();
    const r = dispatch(['sbatch', 'train_palmvein.srm'], c);
    assertContains(r.stdout, 'Submitted batch job');
    assertEqual(c.cluster.jobs.length, 1);
});

test('sbatch on missing file fails', () => {
    const r = dispatch(['sbatch', 'nope.srm'], ctx());
    assertContains(r.stderr, 'Unable to open file');
});

test('squeue shows jobs', () => {
    const c = ctx();
    dispatch(['sbatch', 'train_palmvein.srm'], c);
    const r = dispatch(['squeue'], c);
    assertContains(r.stdout, 'palmvein-train');
});

test('squeue --me filters to current user', () => {
    const c = ctx();
    dispatch(['sbatch', 'train_palmvein.srm'], c);
    const r = dispatch(['squeue', '--me'], c);
    assertContains(r.stdout, 'unseen');
});

test('scancel cancels own job', () => {
    const c = ctx();
    const out = dispatch(['sbatch', 'train_palmvein.srm'], c);
    const id = out.stdout.match(/\d+/)[0];
    c.cluster.scheduleQueue();
    dispatch(['scancel', id], c);
    assertEqual(c.cluster.jobs.find(j => j.id === id).state, 'CA');
});

test('nodeset -e expands range', () => {
    const r = dispatch(['nodeset', '-e', 'sd2nd-h100-[001-004]'], ctx());
    assertContains(r.stdout, 'sd2nd-h100-001 sd2nd-h100-002 sd2nd-h100-003 sd2nd-h100-004');
});

test('nvidia-smi on H100 node shows H100', () => {
    const r = dispatch(['nvidia-smi'], ctx('sd2nd-h100-001'));
    assertContains(r.stdout, 'H100');
});

test('nvidia-smi on login node shows H100', () => {
    const r = dispatch(['nvidia-smi'], ctx('sdumont2nd4'));
    assertContains(r.stdout, 'H100');
});

test('help lists commands', () => {
    const r = dispatch(['help'], ctx());
    assertContains(r.stdout, 'sbatch');
    assertContains(r.stdout, 'squeue');
});
