import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Home } from "lucide-react"
import Link from "next/link"

export default function RepositoriesNotCreatedPage() {
  return (
    <div className="flex items-center justify-center h-full py-20">
      <Card className="max-w-md w-full text-center p-8">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 justify-center items-center">
              <AlertCircle className="text-yellow-500 mb-2" size={40} />
              <h2 className="text-lg font-semibold mb-2">
                No repositories found
              </h2>
            </div>
            <div>
              <p className="text-muted-foreground">
                No repositories have been created yet.
                <br />
                Your request must be accepted by an Admin first.
              </p>
            </div>
            <div className="pt-4 w-full">
              <Button asChild className="w-full">
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
