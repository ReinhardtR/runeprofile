import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const username = searchParams.get("username");

  return new ImageResponse(
    (
      <div tw="flex justify-center items-center bg-black text-white h-full w-full">
        Hello {username}!
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
