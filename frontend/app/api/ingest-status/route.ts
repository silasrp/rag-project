export async function GET() {
  const upstream = await fetch("http://localhost:8000/ingest-status");
  const data = await upstream.json();
  return Response.json(data);
}
