import { NextRequest } from "next/server";
import { handleLifecycleUpdate } from "@/lib/events/lifecycle-server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const customReq = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ action: "unpublish" }),
  });
  return handleLifecycleUpdate(customReq, params.id);
}
