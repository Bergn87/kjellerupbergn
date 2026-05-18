'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Noget gik galt</h1>
        <p className="text-sm text-gray-600">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-gray-400">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          Prøv igen
        </button>
      </div>
    </div>
  )
}
