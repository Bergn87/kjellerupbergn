import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary to-primary/90 px-4">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-primary focus:shadow-lg">
        Spring til indhold
      </a>
      <Link href="/" className="mb-6">
        <span className="text-2xl font-bold text-white">Bergn</span>
        <span className="text-2xl font-bold text-bergn-accent">.dk</span>
      </Link>
      <div id="main" className="w-full max-w-md">{children}</div>
    </div>
  )
}
