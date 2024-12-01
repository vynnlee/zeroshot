import { NextResponse } from "next/server";
import axios from "axios";

// Maximum time to wait for response (ms)
const TIMEOUT = 2000;

// Headers that might contain server time
const TIME_HEADERS = ["date", "last-modified", "x-timestamp"];

interface TimeResponse {
  serverTime: string;
  source: string;
  reliability: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let url = searchParams.get("url");

  console.log("[API] Received request for server time", { url });

  if (!url) {
    console.warn("[API] No URL provided");
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    // Decode the URL if it's encoded
    url = decodeURIComponent(url);
    console.log("[API] Decoded URL:", url);

    // Ensure URL has protocol
    if (!url.startsWith("http")) {
      url = `https://${url}`;
      console.log("[API] Added protocol to URL:", url);
    }

    // Make HEAD request first (lighter)
    console.log("[API] Attempting HEAD request to:", url);
    const headResult = await makeTimeRequest(url, "HEAD");
    console.log("[API] HEAD request result:", headResult);

    if (headResult.reliability >= 0.8) {
      console.log("[API] Using HEAD request result (high reliability)");
      return NextResponse.json(headResult);
    }

    // If HEAD doesn't provide reliable time, try GET
    console.log("[API] HEAD request not reliable enough, trying GET request");
    const getResult = await makeTimeRequest(url, "GET");
    console.log("[API] GET request result:", getResult);
    return NextResponse.json(getResult);
  } catch (error: any) {
    console.error("[API] Error fetching server time:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url,
    });

    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}

async function makeTimeRequest(
  url: string,
  method: "HEAD" | "GET"
): Promise<TimeResponse> {
  try {
    console.log(`[API] Making ${method} request to:`, url);
    const response = await axios({
      method,
      url,
      timeout: TIMEOUT,
      validateStatus: (status) => status < 500,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    console.log(`[API] ${method} request successful, status:`, response.status);
    console.log(`[API] Response headers:`, response.headers);

    const timeData = extractTimeFromResponse(response);
    console.log(`[API] Extracted time data:`, timeData);
    return timeData;
  } catch (error) {
    console.error(`[API] ${method} request failed:`, error);
    throw enhanceError(error);
  }
}

function extractTimeFromResponse(response: any): TimeResponse {
  let bestTime: string | null = null;
  let source = "";
  let reliability = 0;

  // Check each potential time header
  for (const header of TIME_HEADERS) {
    const timeStr = response.headers[header];
    if (timeStr) {
      console.log(`[API] Found time header ${header}:`, timeStr);
      const time = new Date(timeStr);
      if (isValidDate(time)) {
        bestTime = timeStr;
        source = header;
        reliability = calculateReliability(header, response);
        console.log(
          `[API] Using time from ${header} with reliability:`,
          reliability
        );
        break;
      }
    }
  }

  // If no valid time found in headers, try server date
  if (!bestTime && response.headers.date) {
    const time = new Date(response.headers.date);
    if (isValidDate(time)) {
      bestTime = response.headers.date;
      source = "server-date";
      reliability = 0.95;
      console.log("[API] Using server date header with high reliability");
    }
  }

  // If still no valid time found
  if (!bestTime) {
    console.warn("[API] No valid time found in headers, using fallback");
    bestTime = new Date().toUTCString();
    source = "fallback";
    reliability = 0.1;
  }

  return {
    serverTime: bestTime,
    source,
    reliability,
  };
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

function calculateReliability(source: string, response: any): number {
  let reliability = 0;

  switch (source) {
    case "date":
      reliability = 0.9; // Standard HTTP date header
      break;
    case "last-modified":
      reliability = 0.7; // Less accurate but still useful
      break;
    case "x-timestamp":
      reliability = 0.8; // Custom timestamp header
      break;
    default:
      reliability = 0.5;
  }

  // Adjust based on response characteristics
  if (response.status === 200) reliability += 0.1;
  if (response.headers["cache-control"]?.includes("no-cache"))
    reliability += 0.1;

  return Math.min(reliability, 1); // Cap at 1.0
}

function getErrorMessage(error: any): string {
  if (error.code === "ECONNABORTED") {
    return "Request timed out";
  }
  if (error.code === "ENOTFOUND") {
    return "Could not resolve host";
  }
  if (error.response?.status === 403) {
    return "Access denied by server";
  }
  if (error.response?.status === 404) {
    return "Server not found";
  }
  return "Failed to fetch server time";
}

function enhanceError(error: any): any {
  if (error.code === "ECONNABORTED") {
    error.message = "Connection timed out while fetching server time";
  }
  if (!error.response) {
    error.response = { status: 500 };
  }
  return error;
}
