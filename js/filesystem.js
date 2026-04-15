// js/filesystem.js
// Simulated filesystem with /prj and /scratch visibility rules.
import { INITIAL_FS } from '../data/initial-fs.js';

const HOME_BY_USER = {
    unseen: '/scratch/palmvein/unseen',
    pedro:  '/home/pedro'
};

export function createFilesystem() {
    const root = structuredClone(INITIAL_FS);
    let cwd = '/home/pedro';
    let lastCwd = '/home/pedro';
    let hostname = 'local';
    let user = 'pedro';

    function home() { return HOME_BY_USER[user] || '/home/pedro'; }
    function splitPath(p) { return p.split('/').filter(Boolean); }

    function normalize(absPath) {
        const parts = [];
        for (const seg of splitPath(absPath)) {
            if (seg === '.') continue;
            if (seg === '..') parts.pop();
            else parts.push(seg);
        }
        return '/' + parts.join('/');
    }

    function resolve(p) {
        if (!p) return cwd;
        if (p === '~') return home();
        if (p.startsWith('~/')) p = home() + p.slice(1);
        if (p === '-') return lastCwd;
        const abs = p.startsWith('/') ? p : cwd + '/' + p;
        return normalize(abs) || '/';
    }

    function lookup(absPath) {
        if (absPath === '/') return root['/'];
        const parts = splitPath(absPath);
        let node = root['/'];
        for (const part of parts) {
            if (!node.children || !node.children[part]) return null;
            node = node.children[part];
        }
        return node;
    }

    function parentAndName(absPath) {
        const parts = splitPath(absPath);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        return { parent: lookup(parentPath), name };
    }

    function isVisibleHere(node) {
        if (!node) return false;
        if (node.visibility === 'all') return true;
        if (node.visibility === 'login') {
            return /^sdumont2nd[4-7]$/.test(hostname);
        }
        return false;
    }

    return {
        pwd() { return cwd; },
        cd(p) {
            const target = resolve(p);
            const node = lookup(target);
            if (!node || !isVisibleHere(node)) {
                throw new Error(`cd: ${p}: No such file or directory`);
            }
            if (node.type !== 'dir') {
                throw new Error(`cd: ${p}: Not a directory`);
            }
            lastCwd = cwd;
            cwd = target;
        },
        ls(p) {
            const target = resolve(p || '.');
            const node = lookup(target);
            if (!node || !isVisibleHere(node)) {
                throw new Error(`ls: cannot access '${p || '.'}': No such file or directory`);
            }
            if (node.type === 'file') {
                return [{ name: target.split('/').pop(), type: 'file' }];
            }
            return Object.entries(node.children).map(([name, child]) => ({ name, type: child.type }));
        },
        cat(p) {
            const target = resolve(p);
            const node = lookup(target);
            if (!node || !isVisibleHere(node)) {
                throw new Error(`cat: ${p}: No such file or directory`);
            }
            if (node.type === 'dir') throw new Error(`cat: ${p}: Is a directory`);
            return node.content;
        },
        mkdir(p) {
            const target = resolve(p);
            const { parent, name } = parentAndName(target);
            if (!parent || parent.type !== 'dir') {
                throw new Error(`mkdir: cannot create directory '${p}': No such file or directory`);
            }
            if (parent.children[name]) {
                throw new Error(`mkdir: cannot create directory '${p}': File exists`);
            }
            parent.children[name] = { type: 'dir', visibility: parent.visibility, children: {} };
        },
        write(p, content) {
            const target = resolve(p);
            const { parent, name } = parentAndName(target);
            if (!parent || parent.type !== 'dir') {
                throw new Error(`write: cannot write '${p}': No such directory`);
            }
            if (parent.children[name] && parent.children[name].type === 'dir') {
                throw new Error(`write: ${p}: Is a directory`);
            }
            parent.children[name] = { type: 'file', visibility: parent.visibility, content };
        },
        resolve,
        setHost(host) { hostname = host; },
        getHost() { return hostname; },
        setUser(u) { user = u; },
        getUser() { return user; },
        setCwd(p) { cwd = p; lastCwd = p; },
        getHome() { return home(); }
    };
}
