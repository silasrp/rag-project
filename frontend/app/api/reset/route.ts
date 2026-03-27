export async function POST() {
  const upstream = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reset`, {
    method: "POST",
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return Response.json(data, { status: upstream.status });
  }

  return Response.json(data);
}
