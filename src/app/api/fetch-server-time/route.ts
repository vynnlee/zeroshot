import { NextResponse } from "next/server";
import axios from "axios";

// Maximum time to wait for response (ms)
const TIMEOUT = 2000;

// Headers that might contain server time
const TIME_HEADERS = ['date', 'last-modified', 'x-timestamp'];

interface TimeResponse {
  serverTime: string;
  source: string;
  reliability: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "No URL provided" },
      { status: 400 }
    );
  }

  try {
    // Make HEAD request first (lighter)
    const headResult = await makeTimeRequest(url, 'HEAD');
    if (headResult.reliability >= 0.8) {
      return NextResponse.json(headResult);
    }

    // If HEAD doesn't provide reliable time, try GET
    const getResult = await makeTimeRequest(url, 'GET');
    return NextResponse.json(getResult);

  } catch (error: any) {
    console.error("Error fetching server time:", error);
    
    const errorMessage = getErrorMessage(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
    );
  }
}

async function makeTimeRequest(
  url: string,
  method: 'HEAD' | 'GET'
): Promise<TimeResponse> {
  try {
    const response = await axios({
      method,
      url,
      timeout: TIMEOUT,
      validateStatus: (status) => status < 500,
      maxRedirects: 5,
    });

    const timeData = extractTimeFromResponse(response);
    return timeData;

  } catch (error) {
    throw enhanceError(error);
  }
}

function extractTimeFromResponse(response: any): TimeResponse {
  let bestTime: string | null = null;
  let source = '';
  let reliability = 0;

  // Check each potential time header
  for (const header of TIME_HEADERS) {
    const timeStr = response.headers[header];
    if (timeStr) {
      const time = new Date(timeStr);
      if (isValidDate(time)) {
        bestTime = timeStr;
        source = header;
        reliability = calculateReliability(header, response);
        break;
      }
    }
  }

  // If no valid time found
  if (!bestTime) {
    // Use current time as fallback with low reliability
    bestTime = new Date().toUTCString();
    source = 'fallback';
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
    case 'date':
      reliability = 0.9; // Standard HTTP date header
      break;
    case 'last-modified':
      reliability = 0.7; // Less accurate but still useful
      break;
    case 'x-timestamp':
      reliability = 0.8; // Custom timestamp header
      break;
    default:
      reliability = 0.5;
  }

  // Adjust based on response characteristics
  if (response.status === 200) reliability += 0.1;
  if (response.headers['cache-control']?.includes('no-cache')) reliability += 0.1;

  return Math.min(reliability, 1); // Cap at 1.0
}

function getErrorMessage(error: any): string {
  if (error.code === 'ECONNABORTED') {
    return "Request timed out";
  }
  if (error.code === 'ENOTFOUND') {
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
  if (error.code === 'ECONNABORTED') {
    error.message = "Connection timed out while fetching server time";
  }
  if (!error.response) {
    error.response = { status: 500 };
  }
  return error;
}
