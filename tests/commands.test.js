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
    assertEqual(tokenize('ls -la /prj'), ['ls', '-la', '/prj']);
});

test('tokenize double quotes', () => {
    assertEqual(tokenize('echo "hello world"'), ['echo', 'hello world']);
});

test('tokenize empty', () => {
    assertEqual(tokenize(''), []);
});

// --- Commands ---

suite('commands');

function ctx(hostname = 'sdumont15') {
    const cluster = createCluster();
    const filesystem = createFilesystem();
    filesystem.setHost(hostname);
    filesystem.setUser('unseen');
    filesystem.setCwd('/prj/palmvein/unseen');
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
    assertContains(r.stdout, '/prj/palmvein/unseen');
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

test('module avail lists modules', () => {
    const r = dispatch(['module', 'avail'], ctx());
    assertContains(r.stdout, 'cuda/11.2_sequana');
});

test('module load + list works', () => {
    const c = ctx();
    dispatch(['module', 'load', 'cuda/11.2_sequana'], c);
    const r = dispatch(['module', 'list'], c);
    assertContains(r.stdout, 'cuda/11.2_sequana');
});

test('module purge returns v1 error', () => {
    const r = dispatch(['module', 'purge'], ctx());
    assertContains(r.stderr, 'not supported');
});

test('sinfo shows partitions', () => {
    const r = dispatch(['sinfo'], ctx());
    assertContains(r.stdout, 'sequana_cpu');
    assertContains(r.stdout, 'gdl');
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
    const r = dispatch(['nodeset', '-e', 'sdumont[6000-6003]'], ctx());
    assertContains(r.stdout, 'sdumont6000 sdumont6001 sdumont6002 sdumont6003');
});

test('nvidia-smi on gdl node shows V100', () => {
    const r = dispatch(['nvidia-smi'], ctx('sdumont8000'));
    assertContains(r.stdout, 'V100');
});

test('nvidia-smi on login node fails', () => {
    const r = dispatch(['nvidia-smi'], ctx('sdumont15'));
    assertContains(r.stderr, 'No devices');
});

test('help lists commands', () => {
    const r = dispatch(['help'], ctx());
    assertContains(r.stdout, 'sbatch');
    assertContains(r.stdout, 'squeue');
});
