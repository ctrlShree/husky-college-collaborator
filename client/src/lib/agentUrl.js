const rawUrl = import.meta.env.VITE_AGENT_URL || '';
export const AGENT_URL = rawUrl.replace(/\/$/, '');