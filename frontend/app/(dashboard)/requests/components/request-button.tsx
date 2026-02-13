// "use client"

// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { IconPlus } from "@tabler/icons-react"
// import { useQuery } from "@tanstack/react-query"
// import { getUser } from "@/app/api/user/api"

// export function RequestButton() {
//   const { data: session, isLoading } = useQuery({
//     queryKey: ["user"],
//     queryFn: getUser,
//   })

//   return (
//     <Button
//       asChild
//       onClick={(e) => {
//         if (isLoading) {
//           e.preventDefault()
//           return
//         }

//         if (!session?.gitlabUrl) {
//           e.preventDefault()
//           alert("Please add your GitLab URL first.")
//         }
//       }}
//     >
//       <Link href="/requests/create">
//         <IconPlus /> Request
//       </Link>
//     </Button>
//   )
// }

"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@tabler/icons-react"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@/app/api/user/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function RequestButton() {
  const { data: session, isLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  })

  const [open, setOpen] = useState(false)

  const handleOpen = (e: React.MouseEvent) => {
    if (isLoading) {
      e.preventDefault()
      return
    }

    if (!session?.gitlabUrl) {
      e.preventDefault()
      alert("Please add your GitLab URL first.")
      return
    }

    // Open the modal
    e.preventDefault()
    setOpen(true)
  }

  return (
    <>
      <Button asChild onClick={handleOpen}>
        <Link href="#">
          <IconPlus /> Request
        </Link>
      </Button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Request Type</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-2">
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/requests/create">Create Project</Link>
            </Button>

            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/requests/create-cluster">Create Cluster</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
