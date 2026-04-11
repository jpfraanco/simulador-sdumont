// js/users.js
// Seeding and cycling of fictional users' jobs.
import { FICTIONAL_USERS } from '../data/initial-users.js';

export function seedFictionalJobs(cluster) {
    for (const user of FICTIONAL_USERS) {
        for (const template of user.jobs) {
            try {
                cluster.submitJob({ user: user.login, ...template });
            } catch (e) {
                // ignore seeding failures (e.g. over-sized)
            }
        }
    }
}

export function cycleFictionalJobs(cluster) {
    for (const user of FICTIONAL_USERS) {
        const active = cluster.jobs.find(
            j => j.user === user.login && (j.state === 'PD' || j.state === 'R' || j.state === 'CG')
        );
        if (!active) {
            const template = user.jobs[0];
            try {
                cluster.submitJob({ user: user.login, ...template });
            } catch (e) {}
        }
    }
}

export { FICTIONAL_USERS };
