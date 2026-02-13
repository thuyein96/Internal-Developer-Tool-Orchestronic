import { useState } from "react"
import { CircleCheck, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CopyButton } from "./shadcn-io/copy-button"

interface TextPasswordProps {
  text: string
  className?: string
  copyButton?: boolean
}

export default function TextPassword({
  text,
  className,
  copyButton = false,
}: TextPasswordProps) {
  const [show, setShow] = useState(false)

  return (
    <div className={cn("flex items-center font-mono", className)}>
      <span className="truncate">
        {show ? text : "•".repeat(Math.min(8, text.length))}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="ml-2"
        onClick={() => setShow(!show)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      {copyButton && (
        <CopyButton
          variant="ghost"
          className="px-3 py-2 hover:bg-transparent"
          content={text}
          onCopy={() =>
            toast.success("Copied to clipboard", {
              icon: <CircleCheck color="white" fill="black" />,
            })
          }
        />
      )}
    </div>
  )
}
