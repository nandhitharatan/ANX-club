import { NextRequest } from "next/server";
import { handleLifecycleUpdate } from "@/lib/events/lifecycle-server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleLifecycleUpdate(request, params.id);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleLifecycleUpdate(request, params.id);
}
