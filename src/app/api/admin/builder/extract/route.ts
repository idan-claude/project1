import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '@/lib/auth/adminAuth'
import { extractProductFromUrl } from '@/lib/ai/extractor'

export const dynamic = 'force-dynamic'

export const POST = withAdminAuth(async (req: NextRequest) => {
  try {
    const { url } = await req.json()
    if (!url?.trim()) return NextResponse.json({ error: 'URL נדרש' }, { status: 400 })

    const product = await extractProductFromUrl(url.trim())
    return NextResponse.json({ product })
  } catch (err) {
    console.error('[builder/extract]', err)
    return NextResponse.json({ error: 'שגיאה בחילוץ מידע מה-URL' }, { status: 500 })
  }
})
