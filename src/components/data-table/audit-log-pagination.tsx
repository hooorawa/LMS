"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/components/ui/pagination";

export function AuditLogPagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/audit-log?${params.toString()}`);
  }

  return <Pagination page={page} pageSize={pageSize} total={total} onPageChange={handlePageChange} />;
}
