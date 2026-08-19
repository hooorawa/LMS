import { TableSkeleton } from "@/components/dashboard-shell/loading-blocks";

export default function Loading() {
  return <TableSkeleton columns={1} rows={8} withHeaderAction={false} />;
}
