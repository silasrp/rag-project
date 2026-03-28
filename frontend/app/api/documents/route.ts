export async function GET() {
  const upstream = await fetch("http://localhost:8000/documents");
  const data = await upstream.json();
  return Response.json(data);
}
