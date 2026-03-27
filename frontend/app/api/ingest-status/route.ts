export async function GET() {
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ingest-status`);
  const data = await upstream.json();
  return Response.json(data);
}
