export default async function getLogs(
  dag_id: string,
  run_id: string,
  task_id: string
) {
  const data = await fetch(
    `${process.env.AIRFLOW_API_URL}/dags/${dag_id}/dagRuns/${run_id}/taskInstances/${task_id}/logs`
  )
  return data
}
