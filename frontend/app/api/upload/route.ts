export async function POST(req: Request) {
  const formData = await req.formData();
  const upstream = await fetch("http://localhost:8000/upload", {
    method: "POST",
    body: formData,
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return Response.json(data, { status: upstream.status });
  }

  return Response.json(data);
}
