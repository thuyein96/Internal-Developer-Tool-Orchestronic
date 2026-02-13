"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import OrchestronicLogo from "@/components/orchestronic-logo"

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loginWithAzure = () => {
    setError(null)
    setLoading(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    if (!apiUrl) {
      setError("API URL is not configured.")
      setLoading(false)
      return
    }
    window.location.href = `${apiUrl}/auth/azure`
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-sm text-center space-y-6 border border-gray-100">
        <div className="flex flex-col items-center space-y-3">
          <OrchestronicLogo size={50} />
          <h1 className="text-2xl font-semibold text-gray-700">
            Welcome to Orchestronic
          </h1>
          <p className="text-sm text-gray-500">
            Sign in using your Microsoft account
          </p>
        </div>

        <Button onClick={loginWithAzure} disabled={loading} className="w-full">
          {loading ? "Redirecting..." : "Login with Microsoft"}
        </Button>

        {error && <div className="text-red-500 text-xs">{error}</div>}

        <p className="text-xs text-gray-400 pt-4">
          © {new Date().getFullYear()} Orchestronic. All rights reserved.
        </p>

      </div>
    </div>
  )
}




// "use client"
// import { useState } from "react"
// import { Button } from "@/components/ui/button"

// export default function Page() {
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)

//   const loginWithAzure = () => {
//     setError(null)
//     setLoading(true)
//     const apiUrl = process.env.NEXT_PUBLIC_API_URL
//     if (!apiUrl) {
//       setError("API URL is not configured.")
//       setLoading(false)
//       return
//     }
//     window.location.href = `${apiUrl}/auth/azure`
//   }

//   return (
//     <div className="flex flex-col items-center justify-center h-screen gap-4">
//       <Button onClick={loginWithAzure} disabled={loading}>
//         {loading ? "Redirecting..." : "Login with Microsoft"}
//       </Button>
//       {error && <div className="text-red-500 text-sm">{error}</div>}
//     </div>
//   )
// }