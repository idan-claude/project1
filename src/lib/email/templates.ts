import { baseEmailHtml } from './baseTemplate'
import { TrackingEvent } from '../tracking/types'
import { formatPrice } from '@/lib/utils/formatPrice'

export type Ctx = {
  customerName: string
  orderNumber: string
  trackingNumber?: string
  latestEvent?: TrackingEvent
  items?: Array<{ nameHe: string; quantity: number; unitPrice: number }>
  totalAmount?: number
  deliveryAddress?: string
}

const STORE_URL = process.env.STORE_URL || 'https://project1-flame-phi.vercel.app'

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:inline-block;background:#1e40af;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;font-family:Arial,Helvetica,sans-serif;letter-spacing:0.3px;">${label}</a>
      </td>
    </tr>
  </table>`
}

function trackingLink(orderNumber: string): string {
  return `${STORE_URL}/track?order=${encodeURIComponent(orderNumber)}`
}

function itemsTable(items: Array<{ nameHe: string; quantity: number; unitPrice: number }>): string {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;">${item.nameHe}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;text-align:left;">${formatPrice(item.unitPrice * item.quantity)}</td>
      </tr>`
    )
    .join('')

  return `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;text-align:right;font-weight:600;">מוצר</th>
        <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;text-align:center;font-weight:600;">כמות</th>
        <th style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b7280;text-align:left;font-weight:600;">מחיר</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function infoBox(text: string, bgColor = '#eff6ff', borderColor = '#bfdbfe'): string {
  return `<div style="background:${bgColor};border-right:4px solid ${borderColor};padding:16px 20px;border-radius:0 8px 8px 0;margin:20px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1e40af;line-height:1.6;">${text}</div>`
}

// ─── ORDER CONFIRMED ────────────────────────────────────────────────────────

export function orderConfirmedEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `✅ אישור הזמנה ${ctx.orderNumber} | FindCard`
  const preheader = `תודה ${ctx.customerName}! קיבלנו את הזמנתך ומתחילים לעבד אותה.`

  const itemsSection = ctx.items && ctx.items.length > 0 ? itemsTable(ctx.items) : ''
  const totalSection =
    ctx.totalAmount !== undefined
      ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#1e3a8a;margin:16px 0;">סה"כ לתשלום: ${formatPrice(ctx.totalAmount)}</p>`
      : ''

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">✅ ההזמנה שלך אושרה!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      תודה רבה על הזמנתך מ-FindCard! קיבלנו את הזמנה מספר <strong style="color:#1e40af;">${ctx.orderNumber}</strong> ואנחנו מתחילים לעבד אותה מיידית.
    </p>

    ${itemsSection}
    ${totalSection}

    ${infoBox(`
      📦 <strong>זמן אספקה משוער:</strong> 7–14 ימי עסקים<br/>
      🛡️ <strong>אחריות:</strong> 100 יום החזרה מלאה<br/>
      📧 <strong>עדכונים:</strong> תקבל/י עדכון בכל שלב
    `)}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      ניתן לעקוב אחר ההזמנה בכל עת דרך הכפתור למטה. יש שאלות? אנחנו כאן בשבילך 💙
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '📦 עקוב אחר ההזמנה')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      לכל שאלה ניתן לפנות אלינו ל-<a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── SHIPPED ────────────────────────────────────────────────────────────────

export function shippedEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `📦 ההזמנה שלך בדרך! ${ctx.orderNumber}`
  const preheader = `ההזמנה ${ctx.orderNumber} נשלחה! מספר מעקב: ${ctx.trackingNumber || ''}`

  const trackingSection = ctx.trackingNumber
    ? `${infoBox(`📮 <strong>מספר מעקב:</strong> <span style="font-size:18px;font-weight:bold;letter-spacing:1px;">${ctx.trackingNumber}</span>`, '#f0fdf4', '#86efac')}`
    : ''

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">📦 ההזמנה שלך בדרך!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      חדשות טובות! הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> עזבה את המחסן ובדרכה אליך. 🎉
    </p>

    ${trackingSection}

    ${infoBox(`
      ⏱️ <strong>זמן אספקה משוער:</strong> 7–14 ימי עסקים<br/>
      🔔 <strong>תקבל/י עדכון</strong> כשהחבילה תגיע לישראל
    `)}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      לחץ/י על הכפתור למטה כדי לעקוב בזמן אמת אחרי מיקום החבילה שלך.
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '🔍 עקוב אחר החבילה')}
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── ARRIVED DESTINATION ────────────────────────────────────────────────────

export function arrivedDestinationEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `🇮🇱 החבילה הגיעה לישראל! ${ctx.orderNumber}`
  const preheader = `כמעט! החבילה שלך נחתה בישראל ובדרכה אליך.`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">🇮🇱 החבילה נחתה בישראל!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      חדשות מצוינות! הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> הגיעה לישראל. הצעד האחרון לפניך — המשלוח יגיע בקרוב ישירות אליך. 🎉
    </p>

    ${infoBox(`
      📍 <strong>מיקום נוכחי:</strong> ${ctx.latestEvent?.location || 'ישראל'}<br/>
      ⏳ <strong>זמן אספקה צפוי:</strong> 2–5 ימי עסקים נוספים<br/>
      📬 <strong>תקבל/י עדכון</strong> כשהחבילה תצא לחלוקה
    `, '#f0fdf4', '#86efac')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      כמעט שם! ניתן לעקוב אחרי מצב החבילה בזמן אמת.
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '📍 עקוב אחר החבילה')}
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── CUSTOMS ────────────────────────────────────────────────────────────────

export function customsEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `🏛️ החבילה בטיפול המכס ${ctx.orderNumber}`
  const preheader = `החבילה שלך נמצאת בבדיקת מכס — תהליך רגיל שאורך 1–5 ימים.`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">🏛️ החבילה בטיפול המכס</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> נמצאת כרגע בבדיקת מכס. זהו תהליך סטנדרטי ורגיל — אין צורך לנקוט כל פעולה מצדך.
    </p>

    ${infoBox(`
      ✅ <strong>מה זה אומר?</strong> החבילה עוברת בדיקה שגרתית בנמל הכניסה לישראל.<br/>
      ⏱️ <strong>משך טיפול:</strong> בדרך כלל 1–5 ימי עסקים<br/>
      📋 <strong>לא נדרשת כל פעולה</strong> מצדך — אנחנו עוקבים בשבילך
    `, '#fffbeb', '#fcd34d')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      ברגע שהחבילה תשוחרר מהמכס, נשלח לך עדכון מיידי. ניתן לעקוב בזמן אמת בלחיצה על הכפתור.
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '📦 עקוב אחר החבילה')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      יש שאלות? אנחנו כאן — <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── PICKUP AVAILABLE ───────────────────────────────────────────────────────

export function pickupAvailableEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `📬 החבילה מחכה לך! ${ctx.orderNumber}`
  const preheader = `ההזמנה ${ctx.orderNumber} זמינה לאיסוף. בוא/י מהר לפני שתפוג המועד!`

  const locationInfo = ctx.latestEvent?.location
    ? `<br/>📍 <strong>מיקום:</strong> ${ctx.latestEvent.location}`
    : ''

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">📬 החבילה מחכה לאיסוף!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      🎉 הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> הגיעה ומחכה לך לאיסוף!
    </p>

    ${infoBox(`
      ⚠️ <strong>שים/י לב:</strong> יש לאסוף את החבילה בהקדם האפשרי כדי למנוע החזרה.${locationInfo}<br/>
      🪪 <strong>הכן/י:</strong> תעודת זהות לצורך האיסוף
    `, '#fff7ed', '#fed7aa')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      לחץ/י למטה לפרטים נוספים ולמיקום המדויק לאיסוף.
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '🗺️ פרטי האיסוף')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      יש בעיה באיסוף? צור/י קשר: <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── OUT FOR DELIVERY ───────────────────────────────────────────────────────

export function outForDeliveryEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `🚴 השליח בדרך אליך! ${ctx.orderNumber}`
  const preheader = `ההזמנה שלך יוצאת היום לחלוקה — השאר/י זמין/ה!`

  const addressInfo = ctx.deliveryAddress
    ? `<br/>📍 <strong>כתובת מסירה:</strong> ${ctx.deliveryAddress}`
    : ''

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">🚴 השליח בדרך אליך!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> יצאה לחלוקה היום! השליח בדרך אליך ואמור להגיע בשעות הקרובות. 🎁
    </p>

    ${infoBox(`
      📲 <strong>היה/י זמין/ה:</strong> השאר/י את הטלפון פתוח — השליח עשוי להתקשר.${addressInfo}<br/>
      🚪 <strong>אם לא תהיה/י בבית:</strong> ניתן להשאיר הוראות לשליח מראש
    `, '#f0fdf4', '#86efac')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      מרגש! עקוב/י אחרי ההזמנה בזמן אמת:
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '📍 עקוב בזמן אמת')}
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── DELIVERED ──────────────────────────────────────────────────────────────

export function deliveredEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `✨ החבילה נמסרה! ${ctx.orderNumber}`
  const preheader = `ההזמנה שלך הגיעה! נשמח לשמוע שאתה מרוצה.`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">✨ החבילה שלך נמסרה!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      🎉 הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> נמסרה בהצלחה! אנחנו מקווים שתהנה/י מה-FindCard שלך.
    </p>

    ${infoBox(`
      💡 <strong>טיפ לשימוש:</strong> טעינה ראשונה? מומלץ לטעון את הכרטיס 2 שעות לפני השימוש הראשון.<br/>
      🛡️ <strong>אחריות:</strong> 100 יום אחריות מלאה — אנחנו מכסים אותך
    `, '#f0fdf4', '#86efac')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      יש בעיה? צריך עזרה? אנחנו כאן 24/7:
      <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '🛍️ לצפייה בהזמנה')}
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── DELAYED ────────────────────────────────────────────────────────────────

export function delayedEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `⏳ עיכוב קל בחבילה שלך ${ctx.orderNumber}`
  const preheader = `יש עיכוב קל — אנחנו עוקבים ונדאג שהחבילה תגיע אליך.`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">⏳ עיכוב קל בהגעת החבילה</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      אנחנו מצטערים לעדכן שהזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> חווה עיכוב קל. זה קורה לעיתים בשל גורמים חיצוניים מחוץ לשליטתנו — אנחנו עוקבים מקרוב ודואגים שהחבילה תגיע אליך בהקדם.
    </p>

    ${infoBox(`
      🔍 <strong>אנחנו עוקבים:</strong> הצוות שלנו עוקב אחרי מצב החבילה כל יום.<br/>
      📧 <strong>תקבל/י עדכון</strong> מיידי ברגע שיהיה שינוי בסטטוס.<br/>
      🛡️ <strong>מחויבות:</strong> לא נשקוט עד שהחבילה תגיע אליך.
    `, '#fffbeb', '#fcd34d')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      מצטערים על אי הנוחות. ניתן לפנות אלינו לכל שאלה:
      <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '📦 עקוב אחר החבילה')}
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── FAILED DELIVERY ────────────────────────────────────────────────────────

export function failedDeliveryEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `⚠️ לא הצלחנו למסור את החבילה ${ctx.orderNumber}`
  const preheader = `ניסיון המסירה להזמנה ${ctx.orderNumber} לא הצליח — נפתור את זה יחד.`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">⚠️ ניסיון מסירה לא הצליח</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      ניסינו למסור את הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> אך לא הצלחנו להשלים את המסירה. אנחנו כאן כדי לפתור את זה יחד בהקדם.
    </p>

    ${infoBox(`
      📞 <strong>מה לעשות עכשיו?</strong><br/>
      1. צור/י קשר איתנו מיידית ב-<a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a><br/>
      2. נתאם מסירה חוזרת בזמן המתאים לך<br/>
      3. ניתן גם לאסוף מנקודת חלוקה קרובה
    `, '#fef2f2', '#fca5a5')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:16px 0;">
      לחץ/י למטה לפרטים ולתיאום מסירה מחדש:
    </p>

    ${ctaButton(trackingLink(ctx.orderNumber), '📞 לתיאום מסירה מחדש')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      צוות FindCard ישמח לסייע: <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── REVIEW REQUEST ─────────────────────────────────────────────────────────

export function reviewRequestEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `⭐ מה דעתך על FindCard? ${ctx.orderNumber}`
  const preheader = `קיבלת את ה-FindCard שלך? נשמח לשמוע מה דעתך!`
  const reviewUrl = `${STORE_URL}/product#reviews`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">⭐ שמחנו לשרת אותך!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      עברו כמה ימים מאז קיבלת את הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong>. אנחנו מקווים שאתה מרוצה מהמוצר ומחכים לשמוע את דעתך!
    </p>

    <div style="text-align:center;margin:24px 0;">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:28px;margin:0;">⭐⭐⭐⭐⭐</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#6b7280;margin:8px 0 0 0;">כמה כוכבים היית נותן/ת?</p>
    </div>

    ${infoBox(`
      💬 <strong>הביקורת שלך חשובה לנו</strong> ועוזרת לאחרים לקבל החלטות נכונות.<br/>
      🙏 זה לוקח רק 30 שניות — ונשמח מאוד!
    `)}

    ${ctaButton(reviewUrl, '⭐ כתוב/י ביקורת עכשיו')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      יש משהו שלא עמד בציפיות? נשמח לשמוע ולשפר: <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── SATISFACTION ───────────────────────────────────────────────────────────

export function satisfactionEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `💙 איך אנחנו יכולים לשפר? ${ctx.orderNumber}`
  const preheader = `ספר/י לנו על החוויה שלך — נשמח לשמוע גם את הביקורות`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">💙 איך הייתה החוויה שלך?</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      קיבלת לאחרונה את הזמנה <strong style="color:#1e40af;">${ctx.orderNumber}</strong> מ-FindCard. נשמח לשמוע איך הייתה החוויה שלך — מה עשינו טוב ומה ניתן לשפר.
    </p>

    ${infoBox(`
      📝 <strong>כמה שאלות קצרות:</strong><br/>
      • האם המשלוח הגיע בזמן?<br/>
      • האם המוצר תאם לציפיות שלך?<br/>
      • האם שירות הלקוחות שלנו ענה לצרכיך?
    `)}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#374151;margin:16px 0;">
      השב/י ישירות למייל הזה — כל הערה שלך מגיעה ישירות לצוות שלנו ועוזרת לנו להשתפר.
    </p>

    ${ctaButton(`mailto:findcardsupport@gmail.com?subject=משוב על הזמנה ${ctx.orderNumber}`, '💬 שלח/י משוב')}
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── UPSELL ─────────────────────────────────────────────────────────────────

export function upsellEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `🎁 מבצע בלעדי ללקוחות FindCard שלנו`
  const preheader = `מבצע ייחודי רק בשבילך — 15% הנחה על ה-FindCard הבא!`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">🎁 מבצע בלעדי עבורך!</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      שמחנו שנהנה/ית מה-FindCard שלך! 💙 הגיע הזמן לדאוג גם לאנשים הכי קרובים אליך.
    </p>

    <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);border-radius:12px;padding:28px;text-align:center;margin:20px 0;">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#bfdbfe;margin:0 0 8px 0;">קוד הנחה בלעדי ללקוחות חוזרים</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:36px;font-weight:900;color:#ffffff;letter-spacing:4px;margin:0;">FINDMORE15</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#93c5fd;margin:8px 0 0 0;">15% הנחה על הזמנה נוספת</p>
    </div>

    ${infoBox(`
      👨‍👩‍👧 <strong>מתנה מושלמת:</strong> FindCard לבן/בת הזוג, הורים, ילדים<br/>
      ⏰ <strong>ההנחה בתוקף</strong> ל-7 ימים בלבד — אל תפספס/י!<br/>
      🚚 <strong>משלוח חינם</strong> בהזמנה מעל ₪150
    `)}

    ${ctaButton(`${STORE_URL}?coupon=FINDMORE15`, '🛍️ לקנייה עם ההנחה')}

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      קוד: <strong>FINDMORE15</strong> · תקף ל-7 ימים · לא ניתן לשילוב עם מבצעים אחרים
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}

// ─── REPEAT PURCHASE ────────────────────────────────────────────────────────

export function repeatPurchaseEmail(ctx: Ctx): { subject: string; html: string } {
  const subject = `🔋 הגיע הזמן לטעון! + מבצע מיוחד`
  const preheader = `תזכורת ידידותית — הגיע הזמן לטעון את ה-FindCard שלך!`

  const content = `
    <h2 style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:22px;color:#1e3a8a;">🔋 תזכורת טעינה חודשית</h2>
    <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;">שלום <strong>${ctx.customerName}</strong>,</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#374151;margin:0 0 16px 0;">
      עבר חודש מאז קיבלת את ה-FindCard שלך! 🎉 הגיע הזמן לטעון מחדש כדי לוודא שהוא מוכן להגנה מלאה.
    </p>

    ${infoBox(`
      🔌 <strong>איך לטעון:</strong> חבר את ה-FindCard לכבל USB-C למשך שעה.<br/>
      💡 <strong>טיפ:</strong> טעינה חודשית מאריכה את חיי הסוללה משמעותית.<br/>
      🛡️ <strong>חשוב:</strong> FindCard לא טעון = הגנה מופחתת
    `, '#f0fdf4', '#86efac')}

    <div style="border:2px dashed #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#374151;margin:0 0 8px 0;font-weight:bold;">רוצה FindCard נוסף למשפחה?</p>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;margin:0 0 16px 0;">השתמש/י בקוד <strong style="color:#1e40af;">FINDMORE15</strong> לקבלת 15% הנחה</p>
      ${ctaButton(`${STORE_URL}?coupon=FINDMORE15`, '🛍️ הזמן/י עוד אחד')}
    </div>

    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#9ca3af;margin:20px 0 0 0;">
      FindCard — כרטיס המעקב החכם שלך | <a href="mailto:findcardsupport@gmail.com" style="color:#1e40af;">findcardsupport@gmail.com</a>
    </p>
  `

  return { subject, html: baseEmailHtml(content, preheader) }
}
