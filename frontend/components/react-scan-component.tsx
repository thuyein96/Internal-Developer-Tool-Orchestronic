"use client"
import { scan } from "react-scan"
import { JSX, useEffect } from "react"

export function ReactScan(): JSX.Element {
  useEffect(() => {
    // if (process.env.NODE_ENV !== "production") {
    scan({
      enabled: true,
    })
    // }
  }, [])

  return <></>
}
