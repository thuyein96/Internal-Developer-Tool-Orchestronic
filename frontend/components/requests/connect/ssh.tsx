import { Label } from "@/components/ui/label"
import InputWithCopyButton from "./input-with-copy-button"
import { Button } from "@/components/ui/button"

interface SSHProps {
  ip: string
  pem?: string
  vmName?: string
}

export default function SSH({ ip, pem, vmName }: SSHProps) {
  function handleDownloadPem() {
    if (!pem) return
    const blob = new Blob([pem], { type: "application/x-pem-file" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${vmName}.pem`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex justify-between space-y-4">
      {/* IP Address Field */}
      <InputWithCopyButton label="IP Address" value={ip} />

      {/* PEM Field */}
      <div>
        <Label className="mb-1 block">PEM</Label>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadPem} disabled={!pem} size="sm">
            Download PEM
          </Button>
        </div>
        {!pem && (
          <p className="text-xs text-red-500 mt-2">No PEM key available.</p>
        )}
      </div>
    </div>
  )
}
