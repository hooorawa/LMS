import { TableSkeleton } from "@/components/dashboard-shell/loading-blocks";

export default function Loading() {
  return <TableSkeleton columns={5} />;
}
