import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// GET /api/customers/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// DELETE /api/customers/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// PATCH /api/customers/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { error } = await supabase.from('customers').update(body).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
