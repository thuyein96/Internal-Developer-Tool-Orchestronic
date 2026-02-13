import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AwsRequestDetail, AzureRequestDetail } from "@/types/request"
import { IconInfoCircle } from "@tabler/icons-react"

export default function DescriptionCard({
  data,
}: {
  data?: AwsRequestDetail | AzureRequestDetail
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">
          <p className="flex items-center gap-1">
            <IconInfoCircle />
            Description
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent className="truncate whitespace-pre-wrap">
        {data?.description ?? "No description provided."}
      </CardContent>
    </Card>
  )
}
