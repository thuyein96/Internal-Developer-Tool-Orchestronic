// ✅ Keeps track of refresh state
let refreshPromise: Promise<void> | null = null

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include", // send refresh_token cookie
    })
      .then((res) => {
        if (!res.ok) throw new Error("Refresh failed")
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetcher<T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  let res = await fetch(input, {
    ...init,
    credentials: "include", // send cookies automatically
  })

  if (res.status === 401) {
    // token expired → try refresh
    await refreshAccessToken()

    // retry original request
    res = await fetch(input, {
      ...init,
      credentials: "include",
    })
  }

  // if (res.status === 304) {
  //   // tell React Query: "don’t update, keep old cache"
  //   throw new Error("Not modified")
  // }

  if (!res.ok) {
    let msg = "Unknown error"
    try {
      const err = await res.json()
      msg = err.message || msg
    } catch {
      msg = await res.text()
    }
    throw new Error(msg)
  }

  return res.json() as Promise<T>
}
