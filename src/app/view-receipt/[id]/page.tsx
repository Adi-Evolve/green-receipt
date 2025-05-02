"use server";
import ClientViewReceiptPage from "./ClientViewReceiptPage";
import { createClient } from "@supabase/supabase-js";

// --- Static Params for Export: fetch all IDs from Supabase if possible ---
export default async function ViewReceiptPage({ params }: { params: { id: string } }) {
  // Always use the id param from the URL, never hardcoded
  return <ClientViewReceiptPage id={params.id} />;
}

export async function generateStaticParams() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.from('receipts').select('id');
      if (data && Array.isArray(data) && data.length > 0) {
        return data.map((row: { id: string }) => ({ id: row.id }));
      }
    }
  } catch (err) {
    // Ignore and fallback
  }
  // Fallback: return empty array (no static pages generated)
  return [];
}