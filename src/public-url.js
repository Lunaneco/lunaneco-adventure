// Public assets share the deployment path. Node-based game tests use the root.
const base = import.meta.env?.BASE_URL ?? '/';
export const publicUrl = path => base + path.replace(/^\/+/, '');
