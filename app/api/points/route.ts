import { NextResponse } from 'next/server'
import { listAll } from '../../../lib/points'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  return NextResponse.json(await listAll())
}
