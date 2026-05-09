import { getUpload } from "@/lib/uploads-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const upload = getUpload(id);
  if (!upload) {
    return new Response("Not found", { status: 404 });
  }
  // Cache aggressively — these IDs are immutable.
  return new Response(new Uint8Array(upload.bytes), {
    headers: {
      "Content-Type": upload.mimeType,
      "Content-Length": String(upload.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
