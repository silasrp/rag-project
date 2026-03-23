export async function POST() {
  const upstream = await fetch("http://localhost:8000/reset", {
    method: "POST",
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return Response.json(data, { status: upstream.status });
  }

  return Response.json(data);
}
