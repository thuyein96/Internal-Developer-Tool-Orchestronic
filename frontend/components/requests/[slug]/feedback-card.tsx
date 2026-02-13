import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquareText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Status } from "@/types/api"
import { AwsRequestDetail, AzureRequestDetail } from "@/types/request"

export default function FeedbackCard({
  data,
}: {
  data?: AwsRequestDetail | AzureRequestDetail
}) {
  return (
    <Card
      className={cn(data?.status === Status.Rejected ? "border-red-500" : null)}
    >
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">
          <p className="flex items-center gap-1">
            <MessageSquareText />
            Feedback
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent>{data?.feedback ?? "No feedback provided."}</CardContent>
    </Card>
  )
}
