"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Server, HardDrive, Calendar, CheckCircle2, Clock } from "lucide-react"
import { format } from "date-fns"
import { ClusterDetail } from "@/app/api/requests/api"

interface ClusterResourceCardProps {
  resource: ClusterDetail
}

export default function ClusterResourceCard({
  resource,
}: ClusterResourceCardProps) {
  const isConfigured = resource.kubeConfig !== null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {resource.clusterName}
          </CardTitle>
          <Badge variant={isConfigured ? "default" : "secondary"}>
            {isConfigured ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Configured
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Node Count
              </p>
              <p className="text-lg font-semibold">{resource.nodeCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Node Size
              </p>
              <p className="text-sm font-mono break-all">{resource.nodeSize}</p>
            </div>
          </div>

          {resource.clusterFqdn && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                Cluster FQDN
              </p>
              <p className="text-sm font-mono break-all">
                {resource.clusterFqdn}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created At
              </p>
              <p className="text-sm">
                {format(new Date(resource.createdAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Updated At
              </p>
              <p className="text-sm">
                {format(new Date(resource.updatedAt), "MMM dd, yyyy HH:mm")}
              </p>
            </div>
          </div>

          {resource.kubeConfig && (
            <div className="space-y-1 pt-2 border-t">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                Configuration
              </p>
              <Badge variant="outline" className="text-xs">
                KubeConfig Available
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
