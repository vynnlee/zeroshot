import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    const response = await axios.head(url, {
      validateStatus: (status) => status < 500, // 500 미만의 상태코드만 처리
    });
    const dateHeader = response.headers["date"];

    if (dateHeader) {
      return NextResponse.json({ serverTime: dateHeader });
    } else {
      return NextResponse.json(
        { error: "No Date header found" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching server time:", error);
    return NextResponse.json(
      { error: "Failed to fetch server time" },
      { status: 500 }
    );
  }
}
