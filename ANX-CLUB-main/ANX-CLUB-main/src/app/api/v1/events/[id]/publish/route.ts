import { NextRequest } from "next/server";
import { handleLifecycleUpdate } from "@/lib/events/lifecycle-server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Synthesize a request payload with action: 'publish'
  const customReq = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ action: "publish" }),
  });
  return handleLifecycleUpdate(customReq, params.id);
}
