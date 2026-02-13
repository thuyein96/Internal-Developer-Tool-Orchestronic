// "use client"

// import { useEffect } from "react"

// export default function Page() {
//   useEffect(() => {
//     const logout = async () => {
//       await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
//         method: "POST",
//         credentials: "include", // important to include cookies
//       })
//       // optionally redirect user
//       window.location.href = "/"
//     }
//     logout()
//   }, [])

//   return null
// }

"use client"

import { useEffect } from "react"

export default function Page() {
  useEffect(() => {
    const logout = async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      )

      const data = await res.json()

      if (data.logoutUrl) {
        // Important: Redirect to Azure logout
        window.location.href = data.logoutUrl
      } else {
        window.location.href = "/login"
      }
    }

    logout()
  }, [])

  return null
}
