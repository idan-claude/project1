import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, getAdminPayload } from '@/lib/auth/adminAuth'
import { v2 as cloudinary } from 'cloudinary'
import { getCloudinaryConfig } from '@/lib/settings/credentials'

export const POST = withAdminAuth(async (req: NextRequest) => {
  const storeId = getAdminPayload(req)?.storeId ?? 'default'

  const cfg = await getCloudinaryConfig(storeId)
  if (!cfg?.cloudName || !cfg?.apiKey || !cfg?.apiSecret) {
    return NextResponse.json(
      { error: 'העלאת תמונות לא מוגדרת עדיין — הגדר אחסון תמונות בהגדרות' },
      { status: 503 }
    )
  }

  cloudinary.config({
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    api_secret: cfg.apiSecret,
  })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'לא נבחר קובץ' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'הקובץ גדול מדי (מקסימום 10MB)' }, { status: 400 })
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'findcard/products',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    })
  } catch (err: unknown) {
    console.error('[POST /api/admin/upload]', err)
    return NextResponse.json({ error: 'שגיאה בהעלאת קובץ' }, { status: 500 })
  }
})
