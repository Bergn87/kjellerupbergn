import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#1B3C2E] to-[#152F24] px-4">
      <Link href="/" className="mb-6">
        <span className="text-2xl font-bold text-white">Bergn</span>
        <span className="text-2xl font-bold text-[#D4A843]">.dk</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
