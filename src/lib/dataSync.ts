import { supabase } from './supabaseClient';

// Helper to always add user_code and never set id unless required
function normalizeEntity(entityType: string, item: any): any {
  const user_code = localStorage.getItem('user_code');
  const e = { ...item, user_code };
  // Remove id for UUID tables
  if (e.id && typeof e.id === 'string' && e.id.startsWith('test_')) delete e.id;
  // Field normalization for Supabase schema
  if (entityType === 'offers') {
    if ('validTill' in e) {
      e.valid_till = e.validTill;
      delete e.validTill;
    }
  }
  if (entityType === 'receipts') {
    if ('qrCode' in e) {
      e.qr_code = e.qrCode;
      delete e.qrCode;
    }
    if ('receiptUniqueId' in e) {
      e.qr_code = e.receiptUniqueId;
      delete e.receiptUniqueId;
    }
  }
  return e;
}

export async function addEntity(entityType: string, newItem: any, setState: (arr: any[]) => void) {
  const user_code = localStorage.getItem('user_code');
  const localKey = `${entityType}_${user_code}`;
  const arr = JSON.parse(localStorage.getItem(localKey) || '[]');
  arr.push(newItem);
  const upsertItem = normalizeEntity(entityType, newItem);
  console.log('[addEntity] Upserting to Supabase:', entityType, upsertItem);
  try {
    const { data, error } = await supabase.from(entityType).upsert([upsertItem]);
    console.log('[addEntity] Supabase response:', { data, error });
    if (error) {
      throw error;
    }
    // Only update localStorage and state after successful upsert
    localStorage.setItem(localKey, JSON.stringify(arr));
    setState([...arr]);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Supabase upsert error for table '${entityType}':`, error.message, upsertItem);
      alert(`Supabase upsert error for table '${entityType}': ${error.message}`);
    } else {
      console.error(`Supabase upsert error for table '${entityType}':`, error, upsertItem);
      alert(`Supabase upsert error for table '${entityType}': ${String(error)}`);
    }
  }
}

export async function updateEntity(entityType: string, updatedItem: any, setState: (arr: any[]) => void) {
  const user_code = localStorage.getItem('user_code');
  const localKey = `${entityType}_${user_code}`;
  let arr = JSON.parse(localStorage.getItem(localKey) || '[]');
  arr = arr.map((item: any) => item.id === updatedItem.id ? updatedItem : item);
  const upsertItem = normalizeEntity(entityType, updatedItem);
  try {
    const { data, error } = await supabase.from(entityType).upsert([upsertItem]);
    if (error) {
      throw error;
    }
    localStorage.setItem(localKey, JSON.stringify(arr));
    setState([...arr]);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Supabase update error for table '${entityType}':`, error.message, upsertItem);
      alert(`Supabase update error for table '${entityType}': ${error.message}`);
    } else {
      console.error(`Supabase update error for table '${entityType}':`, error, upsertItem);
      alert(`Supabase update error for table '${entityType}': ${String(error)}`);
    }
  }
}

export async function deleteEntity(entityType: string, id: string, setState: (arr: any[]) => void) {
  const user_code = localStorage.getItem('user_code');
  const localKey = `${entityType}_${user_code}`;
  let arr = JSON.parse(localStorage.getItem(localKey) || '[]');
  arr = arr.filter((item: any) => item.id !== id);
  try {
    const { error } = await supabase.from(entityType).delete().eq('id', id);
    if (error) {
      throw error;
    }
    localStorage.setItem(localKey, JSON.stringify(arr));
    setState([...arr]);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Supabase delete error for table '${entityType}':`, error.message, id);
      alert(`Supabase delete error for table '${entityType}': ${error.message}`);
    } else {
      console.error(`Supabase delete error for table '${entityType}':`, error, id);
      alert(`Supabase delete error for table '${entityType}': ${String(error)}`);
    }
  }
}
