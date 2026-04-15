// tests/cluster.test.js
import { suite, test, assertEqual, assertTrue, assertThrows } from '../js/test-harness.js';
import { createCluster } from '../js/cluster.js';

suite('cluster');

test('has 180 compute nodes + 4 login nodes', () => {
    const c = createCluster();
    assertEqual(c.nodes.length, 180);
    assertEqual(c.loginNodes.length, 4);
});

test('has 12 partitions', () => {
    const c = createCluster();
    assertEqual(c.partitions.length, 12);
});

test('node counts per hwType', () => {
    const c = createCluster();
    assertEqual(c.nodes.filter(n => n.hwType === 'cpu_amd').length, 60);
    assertEqual(c.nodes.filter(n => n.hwType === 'h100').length, 62);
    assertEqual(c.nodes.filter(n => n.hwType === 'gh200').length, 36);
    assertEqual(c.nodes.filter(n => n.hwType === 'mi300a').length, 18);
    assertEqual(c.nodes.filter(n => n.hwType === 'grace').length, 4);
});

test('all nodes start idle', () => {
    const c = createCluster();
    assertTrue(c.nodes.every(n => n.state === 'idle'));
});

test('getNodesByPartition lncc-h100 returns 62 nodes with 4 gpus', () => {
    const c = createCluster();
    const h100 = c.getNodesByPartition('lncc-h100');
    assertEqual(h100.length, 62);
    assertEqual(h100[0].gpusTotal, 4);
});

test('submitJob creates PD job', () => {
    const c = createCluster();
    const id = c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: 't', script: '/t.srm' });
    assertTrue(id.length > 0);
    assertEqual(c.jobs[0].state, 'PD');
});

test('scheduleQueue promotes PD to R when resources available', () => {
    const c = createCluster();
    c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    assertEqual(c.jobs[0].state, 'R');
    assertEqual(c.getNode('sd2nd-h100-001').state, 'alloc');
});

test('second job on same node stays PD with Resources reason', () => {
    const c = createCluster();
    // Fill first H100 node
    c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: 'first', script: '/a.srm' });
    c.scheduleQueue();
    // Submit 62 more to fill all H100 nodes, last one should PD
    for (let i = 0; i < 61; i++) {
        c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: `fill${i}`, script: '/x.srm' });
    }
    c.scheduleQueue();
    c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: 'overflow', script: '/b.srm' });
    c.scheduleQueue();
    const overflow = c.jobs.find(j => j.name === 'overflow');
    assertEqual(overflow.state, 'PD');
    assertEqual(overflow.reason, 'Resources');
});

test('submitJob without --time on non-dev throws', () => {
    const c = createCluster();
    assertThrows(
        () => c.submitJob({ user: 'u', partition: 'lncc-cpu_amd', nodes: 1, gpus: 0, cpus: 8, memGB: 64, walltimeSec: null, name: 't' }),
        'time limit'
    );
});

test('submitJob with too many gpus throws', () => {
    const c = createCluster();
    assertThrows(
        () => c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 8, cpus: 96, memGB: 512, walltimeSec: 3600, name: 't' }),
        'node configuration'
    );
});

test('tick advances elapsed and completes jobs', () => {
    const c = createCluster();
    c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 10, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    c.tick(10);
    assertTrue(c.jobs[0].state === 'CG' || c.jobs[0].state === 'CD');
    c.tick(2);
    assertEqual(c.jobs[0].state, 'CD');
});

test('cancelJob sets CA and releases resources', () => {
    const c = createCluster();
    const id = c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    c.cancelJob(id, 'u');
    assertEqual(c.jobs[0].state, 'CA');
    assertEqual(c.getNode('sd2nd-h100-001').gpusAllocated, 0);
});

test('cancelJob refuses wrong user', () => {
    const c = createCluster();
    const id = c.submitJob({ user: 'u', partition: 'lncc-h100', nodes: 1, gpus: 4, cpus: 96, memGB: 512, walltimeSec: 3600, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    assertThrows(() => c.cancelJob(id, 'hacker'), 'not authorized');
});
