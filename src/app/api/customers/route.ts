import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/customers?business_id=xxx
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('business_id');
  if (!businessId) return NextResponse.json({ error: 'Missing business_id' }, { status: 400 });
  const { data, error } = await supabase.from('customers').select('*').eq('business_id', businessId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
