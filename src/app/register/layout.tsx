import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'פתח חנות | מנוי חדש',
  description: 'צור חנות אונליין בחינם תוך דקות',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
