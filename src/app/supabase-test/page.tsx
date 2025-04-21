"use client";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseTest() {
  useEffect(() => {
    async function test() {
      // 1. Insert a business user with id 'don' (if not exists)
      const businessId = 'don';
      try {
        // Check if business user exists
        const { data: existing, error: checkErr } = await supabase
          .from('business_users')
          .select('id')
          .eq('id', businessId)
          .single();
        if (checkErr && checkErr.code !== 'PGRST116') {
          alert('Supabase error checking business_users: ' + checkErr.message);
          return;
        }
        if (!existing) {
          const { error: insertBizError } = await supabase.from('business_users').insert([
            {
              id: businessId,
              name: 'adi',
              gst: 'GST123',
              address: '123 Demo Lane',
              email: 'adi@example.com',
              phone: '1234567890',
              logo_url: '',
              created_at: new Date().toISOString(),
            }
          ]);
          if (insertBizError) {
            alert('Supabase error inserting business_users: ' + insertBizError.message);
            return;
          }
        }
      } catch (err: any) {
        alert('Unexpected error: ' + err.message);
        return;
      }

      // 2. Insert a product with business_id 'don'
      const testProduct = {
        name: 'Test Product',
        price: 123.45,
        gst: 18,
        business_id: businessId,
      };
      const { error: prodError } = await supabase.from('products').insert([testProduct]);
      if (prodError) {
        alert('Supabase INSERT error: ' + prodError.message);
      } else {
        alert('Supabase INSERT success! Check your products table for a new row with business_id = "don".');
      }
    }
    test();
  }, []);
  return <div>Testing Supabase INSERT to products table with business_id 'don'...</div>;
}
