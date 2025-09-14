import { NextResponse } from 'next/server';
import {
  listSubscriptions,
  addSubscription,
  removeSubscription,
  clearSubscriptions,
} from '../../../lib/db';

export async function GET() {
  try {
    const items = await listSubscriptions();
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, url } = body;
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });
    await addSubscription({ id, title, url });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await removeSubscription(id);
      return NextResponse.json({ ok: true });
    } else {
      // no id -> clear all
      await clearSubscriptions();
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
