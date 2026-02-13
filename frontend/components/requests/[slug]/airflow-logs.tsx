"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Logs } from "lucide-react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Spinner } from "@/components/ui/spinner"

interface AirflowLogsProps {
  dagId: string
  dagRunId: string
}

type AirflowTask = {
  task_id: string
  task_display_name: string
  state: string
  start_date: string | null
  end_date: string | null
  duration: number
}

function sortTasksByStartDate(tasks: AirflowTask[]): AirflowTask[] {
  return tasks.sort((a, b) => {
    if (!a.start_date && !b.start_date) return 0
    if (!a.start_date) return 1 // put nulls last
    if (!b.start_date) return -1
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  })
}

export default function AirflowLogs({ dagId, dagRunId }: AirflowLogsProps) {
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    error: errorLogs,
  } = useQuery({
    queryKey: ["airflow-logs", dagId, dagRunId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/airflow/${dagId}/${dagRunId}/logs`
      )
      if (!res.ok) throw new Error("Failed to fetch logs")
      return res.json()
    },
    // refetchInterval: 5000,
    // refetchIntervalInBackground: true,
  })

  // React Query for task instances
  const {
    data: instancesData,
    isLoading: isLoadingInstances,
    error: errorInstances,
  } = useQuery<AirflowTask[]>({
    queryKey: ["airflow-task-instances", dagId, dagRunId],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/airflow/${dagId}/${dagRunId}/task-instances`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      if (!res.ok) throw new Error("Failed to fetch task instances")
      return res.json()
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  const sortedTaskInstances = sortTasksByStartDate([...(instancesData ?? [])])
  const [selectedTaskId, setSelectedTaskId] = useState(sortedTaskInstances[0])

  if (isLoadingLogs || isLoadingInstances) {
    return <Spinner>Loading</Spinner>
  }

  if (errorLogs || errorInstances) {
    return <div>Error loading data</div>
  }

  return (
    <Card className="h-[650px] bg-gray-100 opacity-60 pointer-events-none cursor-not-allowed relative">
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-gray-600 font-semibold text-2xl bg-white/80 px-4 py-2 rounded-xl shadow">
          Not available
        </span>
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-bold tracking-tight">
          <p className="flex items-center gap-1">
            <Logs />
            Logs
          </p>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex gap-6 overflow-auto">
        <div className="col-span-3">
          <Table>
            {sortedTaskInstances.map((task) => (
              <TableBody key={task.task_id}>
                <TableRow
                  data-state={
                    selectedTaskId?.task_id === task.task_id
                      ? "selected"
                      : undefined
                  }
                  className="hover:rounded hover:cursor-pointer"
                  onClick={() => setSelectedTaskId(task)}
                >
                  <TableCell className="font-medium">{task.task_id}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => setSelectedTaskId(task)}
                          className={cn(
                            "h-6 bg-white hover:bg-inherit border border-gray-300",
                            {
                              "bg-green-500 hover:bg-green-500":
                                task.state === "success",
                              "bg-red-500 hover:bg-red-500":
                                task.state === "failed",
                            }
                          )}
                        ></Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Task Id: {task.task_id}</p>
                        <p>Status: {task.state}</p>
                        <p>Start Date: {task.start_date}</p>
                        <p>End Date: {task.end_date}</p>
                        <p>Duration: {task.duration} seconds</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              </TableBody>
            ))}
          </Table>
        </div>

        <div className="flex flex-col w-full">
          {selectedTaskId && (
            <p className="text-xl font-bold tracking-tight mb-2">
              Current Task: {selectedTaskId.task_id}
            </p>
          )}
          <div className="mt-4 space-y-1 font-mono bg-gray-100 p-4 rounded overflow-auto h-[500px]">
            <div className="text-xs whitespace-pre-wrap">{logsData?.logs}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
