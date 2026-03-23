export async function POST(req: Request) {
  const body = await req.json();
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return new Response(upstream.body, {
    headers: { "Content-Type": "text/event-stream" },
  });
}