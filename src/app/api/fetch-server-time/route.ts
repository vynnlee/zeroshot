import { NextResponse } from "next/server";
import axios from "axios";

// Maximum time to wait for response (ms)
const TIMEOUT = 2000;

// Headers that might contain server time
const TIME_HEADERS = ["date", "last-modified", "x-timestamp"];

interface TimeResponse {
  serverTime: string;
  T2: number;  // 서버 수신 시간
  T3: number;  // 서버 응답 시간
  source: string;
  reliability: number;
}

export async function GET(request: Request) {
  const T2 = Date.now(); // 서버 수신 시간
  const { searchParams } = new URL(request.url);
  let url = searchParams.get("url");

  console.log("[API] Received request for server time", { url, T2 });

  if (!url) {
    console.warn("[API] No URL provided");
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  try {
    url = decodeURIComponent(url);
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    // 여러 요청 방식 시도 (HEAD, GET)
    const headResult = await makeTimeRequest(url, "HEAD");
    const T3_head = Date.now();
    
    if (headResult.reliability >= 0.8) {
      return NextResponse.json({
        ...headResult,
        T2,
        T3: T3_head,
      });
    }

    const getResult = await makeTimeRequest(url, "GET");
    const T3_get = Date.now();
    
    return NextResponse.json({
      ...getResult,
      T2,
      T3: T3_get,
    });
  } catch (error: any) {
    console.error("[API] Error fetching server time:", {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url,
    });

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: error.response?.status || 500 }
    );
  }
}

async function makeTimeRequest(
  url: string,
  method: "HEAD" | "GET"
): Promise<TimeResponse> {
  try {
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

    const timeData = extractTimeFromResponse(response, method);
    return timeData;
  } catch (error) {
    throw enhanceError(error);
  }
}

function extractTimeFromResponse(response: any, method: string): TimeResponse {
  let bestTime: string | null = null;
  let source = "";
  let reliability = 0;
  let headerReliabilities: { [key: string]: number } = {
    "date": 0.9,
    "last-modified": 0.7,
    "x-timestamp": 0.95,
  };

  // 응답 헤더에서 가장 신뢰할 수 있는 시간 찾기
  for (const header of TIME_HEADERS) {
    const timeStr = response.headers[header];
    if (timeStr) {
      const time = new Date(timeStr);
      if (isValidDate(time)) {
        const currentReliability = calculateHeaderReliability(
          header,
          response,
          method,
          time
        );
        
        if (!bestTime || currentReliability > reliability) {
          bestTime = timeStr;
          source = header;
          reliability = currentReliability;
        }
      }
    }
  }

  // 시간을 찾지 못한 경우 서버 날짜 사용
  if (!bestTime && response.headers.date) {
    const time = new Date(response.headers.date);
    if (isValidDate(time)) {
      bestTime = response.headers.date;
      source = "server-date";
      reliability = 0.85;
    }
  }

  // 마지막 대안으로 현재 시간 사용
  if (!bestTime) {
    bestTime = new Date().toUTCString();
    source = "fallback";
    reliability = 0.1;
  }

  return {
    serverTime: bestTime,
    T2: Date.now(), // placeholder
    T3: Date.now(), // placeholder
    source,
    reliability,
  };
}

function calculateHeaderReliability(
  header: string,
  response: any,
  method: string,
  time: Date
): number {
  let reliability = 0;

  // 기본 신뢰도 설정
  switch (header) {
    case "date":
      reliability = 0.9;
      break;
    case "last-modified":
      reliability = 0.7;
      break;
    case "x-timestamp":
      reliability = 0.95;
      break;
    default:
      reliability = 0.5;
  }

  // 응답 특성에 따른 신뢰도 조정
  if (response.status === 200) reliability += 0.05;
  if (method === "HEAD") reliability += 0.05;
  if (response.headers["cache-control"]?.includes("no-cache")) reliability += 0.05;
  
  // 시간 값의 합리성 검사
  const now = Date.now();
  const timeDiff = Math.abs(time.getTime() - now);
  if (timeDiff > 24 * 60 * 60 * 1000) reliability *= 0.5; // 24시간 이상 차이나면 신뢰도 감소
  if (timeDiff < 1000) reliability += 0.1; // 1초 미만 차이는 신뢰도 증가

  return Math.min(reliability, 1);
}

function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

function getErrorMessage(error: any): string {
  if (error.code === "ECONNABORTED") return "Request timed out";
  if (error.code === "ENOTFOUND") return "Could not resolve host";
  if (error.response?.status === 403) return "Access denied by server";
  if (error.response?.status === 404) return "Server not found";
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
