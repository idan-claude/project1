/**
 * Returns a complete Hebrew RTL HTML email shell.
 * @param content   The inner HTML body placed inside the white card.
 * @param preheader Short preview text shown by mail clients before opening.
 */
export function baseEmailHtml(content: string, preheader: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>FindCard</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; background-color: #f4f6f9; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .email-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;direction:rtl;">

  <!-- Preheader (hidden preview text) -->
  <span style="display:none;font-size:1px;color:#f4f6f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f6f9;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Email card -->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a8a;padding:28px 32px;text-align:center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:2px;">FindCard</h1>
                    <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#93c5fd;letter-spacing:0.5px;">כרטיס המעקב החכם שלך</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Decorative accent line -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#1e40af,#3b82f6,#60a5fa);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Body content -->
          <tr>
            <td class="email-padding" style="padding:36px 40px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f2937;line-height:1.7;direction:rtl;text-align:right;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #e5e7eb;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;line-height:1.6;direction:rtl;">
              <p style="margin:0 0 4px 0;">
                <strong style="color:#6b7280;">FindCard</strong> &middot; כרטיס המעקב החכם &middot;
                <a href="mailto:findcardsupport@gmail.com" style="color:#6b7280;text-decoration:none;">findcardsupport@gmail.com</a>
              </p>
              <p style="margin:0;">
                <a href="UNSUBSCRIBE_URL" style="color:#9ca3af;text-decoration:underline;font-size:11px;">לביטול הרשמה לחץ כאן</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email card -->

      </td>
    </tr>
  </table>

</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
