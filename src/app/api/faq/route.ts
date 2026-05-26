import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db/mongoose'
import Settings from '@/lib/db/models/Settings'

export const dynamic = 'force-dynamic'

const INITIAL_FAQS = [
  { q: 'איך FindCard עובד?', a: 'FindCard משתמש ב-Bluetooth 5.1 ומתחבר לרשת ה-Find My של Apple. כל iPhone בסביבה מדווח על מיקום הכרטיס לשרתי Apple, ואתה מקבל את המיקום המדויק דרך האפליקציה.' },
  { q: 'האם זה עובד עם אנדרואיד?', a: 'כרגע רק עם Apple — iPhone ו-iPad עם iOS 14.5 ומעלה. גרסת אנדרואיד בפיתוח.' },
  { q: 'כמה עבה הכרטיס?', a: 'בדיוק 1.8 מ"מ — אותו עובי של כרטיס אשראי. נכנס לכל תא כרטיסים, בכל ארנק.' },
  { q: 'כמה זמן הסוללה מחזיקה?', a: 'עד 8 חודשים בשימוש יומיומי. טעינה אלחוטית Qi — מניחים על משטח ותוך שעתיים מלא.' },
  { q: 'האם הכרטיס עמיד במים?', a: 'כן! IP67 — עמיד בשקיעה עד 1 מטר למשך 30 דקות. עמיד גם בגשם, שלג ולחות.' },
  { q: 'מה כוללת האחריות?', a: 'אחריות לכל החיים על פגמי ייצור + 100 יום החזר כסף מלא אם לא מרוצה מכל סיבה. בלי שאלות.' },
  { q: 'מה הטווח המקסימלי?', a: 'טווח Bluetooth ישיר של עד 90 מטר. מחוץ לטווח — רשת Find My ממשיכה לעדכן דרך כל iPhone בסביבה, כך שניתן לאתר בכל מקום בעולם.' },
  { q: 'כמה זמן ההגדרה הראשונית?', a: 'בערך 30 שניות. פותחים Find My באייפון, לוחצים "הוסף מכשיר" ומוכנים. בלי להוריד שום דבר נוסף.' },
]

export async function GET() {
  await connectDB()
  let settings = await Settings.findOne({ storeId: 'default', key: 'global_faqs' }).lean() as {
    value?: { faqs?: { q: string; a: string }[] }
  } | null

  if (!settings || !(settings.value as { faqs?: unknown })?.faqs) {
    // Seed initial FAQs on first access
    await Settings.findOneAndUpdate(
      { storeId: 'default', key: 'global_faqs' },
      { $setOnInsert: { storeId: 'default', key: 'global_faqs', value: { faqs: INITIAL_FAQS } } },
      { upsert: true }
    )
    return NextResponse.json({ faqs: INITIAL_FAQS })
  }

  return NextResponse.json({ faqs: (settings.value as { faqs: { q: string; a: string }[] }).faqs })
}
