import axios, { AxiosError } from "axios";

interface TimeResult {
  serverTime: number;
  roundTripTime: number;
  offset: number;
}

interface SyncResult {
  serverTime: number;
  mgval: number;
}

let lastFetchTime = 0;
let cachedResult: SyncResult | null = null;
const CACHE_DURATION = 60000; // 1 minute cache

export const fetchServerTime = async (
  url: string
): Promise<SyncResult | null> => {
  const now = Date.now();

  // Return cached result if within cache duration
  if (cachedResult && now - lastFetchTime < CACHE_DURATION) {
    console.log("[fetchServerTime] Using cached result", {
      cachedTime: new Date(cachedResult.serverTime).toISOString(),
      elapsed: now - lastFetchTime,
    });

    // Adjust server time based on elapsed time
    const elapsed = now - lastFetchTime;
    return {
      serverTime: cachedResult.serverTime + elapsed,
      mgval: cachedResult.mgval,
    };
  }

  try {
    // Ensure URL has protocol
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    console.log("[fetchServerTime] Sending request to API", {
      url: formattedUrl,
    });

    const clientStart = Date.now();
    const apiUrl = `/api/fetch-server-time?url=${encodeURIComponent(
      formattedUrl
    )}`;
    console.log("[fetchServerTime] API URL:", apiUrl);

    const response = await axios.get(apiUrl);
    console.log("[fetchServerTime] Received API response", response.data);

    if (response.data.error) {
      console.warn(
        "[fetchServerTime] Server time fetch error:",
        response.data.error
      );
      return null;
    }

    const serverTimeStr = response.data.serverTime;

    if (serverTimeStr) {
      const serverTime = new Date(serverTimeStr).getTime();
      const clientEnd = Date.now();

      const latency = clientEnd - clientStart;
      const mgval = Math.floor(latency / 2); // Estimated one-way latency

      console.log("[fetchServerTime] Successfully fetched time", {
        serverTime: new Date(serverTime).toISOString(),
        latency,
        mgval,
      });

      // Cache the result
      cachedResult = { serverTime, mgval };
      lastFetchTime = now;

      return cachedResult;
    } else {
      console.warn("[fetchServerTime] No server time received in response");
      return null;
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("[fetchServerTime] Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
        },
      });
    } else {
      console.error("[fetchServerTime] Unknown error:", error);
    }
    return null;
  }
};

// Function to clear cache (useful when disconnecting)
export const clearTimeCache = () => {
  console.log("[fetchServerTime] Clearing time cache");
  cachedResult = null;
  lastFetchTime = 0;
};
