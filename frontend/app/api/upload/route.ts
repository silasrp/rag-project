export async function POST(req: Request) {
  const formData = await req.formData();
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return Response.json(data, { status: upstream.status });
  }

  return Response.json(data);
}
