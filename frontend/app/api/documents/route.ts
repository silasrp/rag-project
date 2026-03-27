export async function GET() {
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`);
  const data = await upstream.json();
  return Response.json(data);
}
