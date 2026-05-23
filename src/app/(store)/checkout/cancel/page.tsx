import Link from 'next/link'

export default function CancelPage() {
  return (
    <div className="text-center py-20 px-4">
      <div className="text-5xl mb-6">😔</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">התשלום בוטל</h1>
      <p className="text-gray-600 mb-8">לא בוצע חיוב. תוכל לנסות שוב בכל עת.</p>
      <div className="flex gap-4 justify-center">
        <Link href="/checkout" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors">
          נסה שוב
        </Link>
        <Link href="/" className="border border-gray-300 text-gray-700 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors">
          חזרה לחנות
        </Link>
      </div>
    </div>
  )
}
