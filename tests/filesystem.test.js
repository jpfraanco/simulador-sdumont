// tests/filesystem.test.js
import { suite, test, assertEqual, assertTrue, assertThrows, assertContains } from '../js/test-harness.js';
import { createFilesystem } from '../js/filesystem.js';

suite('filesystem');

function fs(host = 'sdumont2nd4') {
    const f = createFilesystem();
    f.setHost(host);
    f.setUser('unseen');
    f.setCwd('/scratch/palmvein/unseen');
    return f;
}

test('pwd returns initial cwd after setCwd', () => {
    assertEqual(fs().pwd(), '/scratch/palmvein/unseen');
});

test('cd to absolute path', () => {
    const f = fs();
    f.cd('/scratch/palmvein/unseen/datasets');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen/datasets');
});

test('cd to relative path', () => {
    const f = fs();
    f.cd('code');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen/code');
});

test('cd .. goes up', () => {
    const f = fs();
    f.cd('code');
    f.cd('..');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen');
});

test('cd ~ goes to home', () => {
    const f = fs();
    f.cd('/scratch/palmvein/unseen/datasets');
    f.cd('~');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen');
});

test('cd to nonexistent throws', () => {
    assertThrows(() => fs().cd('/nonexistent'), 'No such file');
});

test('ls returns entries', () => {
    const entries = fs().ls();
    assertTrue(entries.some(e => e.name === 'code'));
    assertTrue(entries.some(e => e.name === 'train_palmvein.srm'));
});

test('cat returns file content', () => {
    const content = fs().cat('code/requirements.txt');
    assertContains(content, 'torch');
});

test('cat on directory throws', () => {
    assertThrows(() => fs().cat('code'), 'Is a directory');
});

test('mkdir creates dir', () => {
    const f = fs();
    f.mkdir('results');
    assertTrue(f.ls().some(e => e.name === 'results'));
});

test('write creates file and cat reads it back', () => {
    const f = fs();
    f.write('hello.txt', 'Olá mundo');
    assertEqual(f.cat('hello.txt'), 'Olá mundo');
});

test('/scratch visible on compute node', () => {
    const f = fs('sd2nd-h100-001');
    f.cd('/scratch/palmvein/unseen');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen');
});

test('/scratch visible on login node', () => {
    const f = fs('sdumont2nd4');
    f.cd('/scratch/palmvein/unseen');
    assertEqual(f.pwd(), '/scratch/palmvein/unseen');
});
