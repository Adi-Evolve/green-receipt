import { NextRequest, NextResponse } from 'next/server';

// Placeholder: Adjust to your notification storage logic
// This example just returns a 404 for all requests
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 404 });
}
