/**
 * API & Socket endpoint helper
 * If VITE_BACKEND_URL is set (e.g. deployed on Vercel pointing to Render),
 * it uses that URL. Otherwise defaults to empty string for relative paths/proxy.
 */

export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

export const apiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${BACKEND_URL}${path}`;
};
