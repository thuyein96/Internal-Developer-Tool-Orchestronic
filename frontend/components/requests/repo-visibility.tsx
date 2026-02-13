"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { IconBook2, IconLock } from "@tabler/icons-react"

interface VisibilityOption {
  value: "public" | "private"
  label: string
  description: string
  icon: React.ReactNode
}

const options: VisibilityOption[] = [
  {
    value: "public",
    label: "Public",
    description:
      "Anyone on the internet can see this repository. You choose who can commit.",
    icon: <IconBook2 />,
  },
  {
    value: "private",
    label: "Private",
    description: "You choose who can see and commit to this repository.",
    icon: <IconLock />,
  },
]

export function RepoVisibility() {
  const [visibility, setVisibility] = useState<"public" | "private">("public")

  return (
    <RadioGroup
      defaultValue={visibility}
      onValueChange={(value: "public" | "private") => setVisibility(value)}
    >
      {options.map(({ value, label, description, icon }) => (
        <div className="flex items-center space-x-2" key={value}>
          <RadioGroupItem
            value={value}
            id={value}
            className="size-5 cursor-pointer"
          />
          <Label className="flex cursor-pointer" htmlFor={value}>
            <div>{icon}</div>
            <div>
              {label}
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
