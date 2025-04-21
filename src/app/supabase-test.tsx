import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseTest() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.from('products').select('*').limit(1);
      if (error) {
        alert('Supabase error: ' + error.message);
      } else {
        alert('Supabase connected! Data: ' + JSON.stringify(data));
      }
    }
    test();
  }, []);
  return <div>Testing Supabase connection to products table...</div>;
}
