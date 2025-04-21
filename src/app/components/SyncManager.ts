import { supabase } from '../../lib/supabaseClient';

// Sync localStorage <-> Supabase for a table
export async function syncTable(table: string, user_code: string) {
  const localKey = `${table}_${user_code}`;
  let localData: any[] = [];
  try { localData = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch {}
  // Fetch remote
  const { data: remoteData, error } = await supabase.from(table).select('*').eq('user_code', user_code);
  if (error) throw error;
  // Merge: last write wins (by updated_at or id)
  const merged = mergeData(localData, remoteData || []);
  localStorage.setItem(localKey, JSON.stringify(merged));
  // Upsert all to Supabase
  await supabase.from(table).upsert(merged);
  return merged;
}

function mergeData(local: any[], remote: any[]) {
  const map = new Map();
  [...remote, ...local].forEach(item => {
    map.set(item.id || item.name, { ...map.get(item.id || item.name), ...item });
  });
  return Array.from(map.values());
}
