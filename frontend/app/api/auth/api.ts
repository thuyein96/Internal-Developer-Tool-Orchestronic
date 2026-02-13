"use client"

export async function logout() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })

    if (!res.ok) {
      throw new Error("Logout request failed")
    }

    const data = await res.json()

    // Redirect to Azure logout URL to clear Azure AD session
    if (data.logoutUrl) {
      // This will clear Azure AD session and redirect back to /login
      window.location.href = data.logoutUrl
      return
    }

    // Fallback if no logout URL
    window.location.href = "/login"
  } catch (err) {
    console.error("Logout failed", err)
    // Even if logout fails, redirect to login
    window.location.href = "/login"
  }
}
