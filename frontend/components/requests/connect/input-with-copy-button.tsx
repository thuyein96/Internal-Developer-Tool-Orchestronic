import { CircleCheck } from "lucide-react"
import { CopyButton } from "@/components/ui/shadcn-io/copy-button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

export default function InputWithCopyButton({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      <div className="flex items-center gap-1">
        <Input value={value} readOnly className="flex-1" />
        <CopyButton
          variant="ghost"
          className="px-3 py-2 hover:bg-transparent"
          content={value}
          onCopy={() =>
            toast.success("Copied to clipboard", {
              icon: <CircleCheck color="white" fill="black" />,
            })
          }
        />
      </div>
    </div>
  )
}
