import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.sessionToken.create({
    data: { id: token, servedIds: [], expiresAt },
  });

  return NextResponse.json({ token, expiresAt });
}