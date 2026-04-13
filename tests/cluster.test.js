// tests/cluster.test.js
import { suite, test, assertEqual, assertTrue, assertThrows } from '../js/test-harness.js';
import { createCluster } from '../js/cluster.js';

suite('cluster');

test('has 377 compute nodes + 4 login nodes', () => {
    const c = createCluster();
    assertEqual(c.nodes.length, 377);
    assertEqual(c.loginNodes.length, 4);
});

test('has 9 partitions', () => {
    const c = createCluster();
    assertEqual(c.partitions.length, 9);
});

test('node counts per hwType', () => {
    const c = createCluster();
    assertEqual(c.nodes.filter(n => n.hwType === 'cpu').length, 246);
    assertEqual(c.nodes.filter(n => n.hwType === 'bigmem').length, 36);
    assertEqual(c.nodes.filter(n => n.hwType === 'gpu').length, 94);
    assertEqual(c.nodes.filter(n => n.hwType === 'gdl').length, 1);
});

test('all nodes start idle', () => {
    const c = createCluster();
    assertTrue(c.nodes.every(n => n.state === 'idle'));
});

test('getNodesByPartition gdl returns 1 node with 8 gpus', () => {
    const c = createCluster();
    const gdl = c.getNodesByPartition('gdl');
    assertEqual(gdl.length, 1);
    assertEqual(gdl[0].gpusTotal, 8);
});

test('submitJob creates PD job', () => {
    const c = createCluster();
    const id = c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 3600, name: 't', script: '/t.srm' });
    assertTrue(id.length > 0);
    assertEqual(c.jobs[0].state, 'PD');
});

test('scheduleQueue promotes PD to R when resources available', () => {
    const c = createCluster();
    c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 3600, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    assertEqual(c.jobs[0].state, 'R');
    assertEqual(c.getNode('sdumont4000').state, 'alloc');
});

test('second gdl job stays PD with Resources reason', () => {
    const c = createCluster();
    c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 3600, name: 'first', script: '/a.srm' });
    c.scheduleQueue();
    c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 3600, name: 'second', script: '/b.srm' });
    c.scheduleQueue();
    const second = c.jobs.find(j => j.name === 'second');
    assertEqual(second.state, 'PD');
    assertEqual(second.reason, 'Resources');
});

test('submitJob without --time on non-dev throws', () => {
    const c = createCluster();
    assertThrows(
        () => c.submitJob({ user: 'u', partition: 'sequana_cpu', nodes: 1, gpus: 0, cpus: 8, memGB: 64, walltimeSec: null, name: 't' }),
        'time limit'
    );
});

test('submitJob with too many gpus throws', () => {
    const c = createCluster();
    assertThrows(
        () => c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 16, cpus: 40, memGB: 384, walltimeSec: 3600, name: 't' }),
        'node configuration'
    );
});

test('tick advances elapsed and completes jobs', () => {
    const c = createCluster();
    c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 10, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    c.tick(10);
    assertTrue(c.jobs[0].state === 'CG' || c.jobs[0].state === 'CD');
    c.tick(2);
    assertEqual(c.jobs[0].state, 'CD');
});

test('cancelJob sets CA and releases resources', () => {
    const c = createCluster();
    const id = c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 3600, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    c.cancelJob(id, 'u');
    assertEqual(c.jobs[0].state, 'CA');
    assertEqual(c.getNode('sdumont4000').gpusAllocated, 0);
});

test('cancelJob refuses wrong user', () => {
    const c = createCluster();
    const id = c.submitJob({ user: 'u', partition: 'gdl', nodes: 1, gpus: 8, cpus: 40, memGB: 384, walltimeSec: 3600, name: 't', script: '/t.srm' });
    c.scheduleQueue();
    assertThrows(() => c.cancelJob(id, 'hacker'), 'not authorized');
});
