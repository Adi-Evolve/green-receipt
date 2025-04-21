// Simple audit log utility
const AUDIT_KEY = 'audit_log';

export function logAudit(action: string, entity: string, data: any, user_code: string) {
  const entry = {
    time: new Date().toISOString(),
    action,
    entity,
    data,
    user_code
  };
  let arr: any[] = [];
  try { arr = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); } catch {}
  arr.push(entry);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(arr));
}

export function getAuditLog() {
  try { return JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]'); } catch { return []; }
}
