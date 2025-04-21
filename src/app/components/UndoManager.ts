// Simple undo manager for destructive actions
let undoStack: { action: string; data: any; table: string; user_code: string }[] = [];

export function pushUndo(action: string, data: any, table: string, user_code: string) {
  undoStack.push({ action, data, table, user_code });
}

export async function undoLast(supabase: any) {
  const last = undoStack.pop();
  if (!last) return;
  if (last.action === 'delete') {
    // Re-insert
    await supabase.from(last.table).upsert([last.data]);
    // Also update localStorage
    const key = `${last.table}_${last.user_code}`;
    let arr: any[] = [];
    try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch {}
    arr.push(last.data);
    localStorage.setItem(key, JSON.stringify(arr));
  }
  // Add more actions as needed
}
