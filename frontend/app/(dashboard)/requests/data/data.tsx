import { CheckCircle, CircleOff, Timer } from "lucide-react"

// export const labels = [
//   {
//     value: "bug",
//     label: "Bug",
//   },
//   {
//     value: "feature",
//     label: "Feature",
//   },
//   {
//     value: "documentation",
//     label: "Documentation",
//   },
// ]

export const statuses = [
  {
    value: "Pending",
    label: "Pending",
    icon: Timer,
    color: "text-yellow-500",
  },
  {
    value: "Approved",
    label: "Approved",
    icon: CheckCircle,
    color: "text-green-500",
  },
  {
    value: "Rejected",
    label: "Rejected",
    icon: CircleOff,
    color: "text-red-500",
  },
]

// export const priorities = [
//   {
//     label: "Low",
//     value: "low",
//     icon: ArrowDown,
//   },
//   {
//     label: "Medium",
//     value: "medium",
//     icon: ArrowRight,
//   },
//   {
//     label: "High",
//     value: "high",
//     icon: ArrowUp,
//   },
// ]
