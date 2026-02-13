import Image from "next/image"

export default function OrchestronicLogo({ size = 40 }: { size?: number }) {
  return (
    <Image
      priority
      src="/logo/orchestronic-logo.svg"
      height={size}
      width={size}
      alt="Orchestronic logo"
    />
  )
}
