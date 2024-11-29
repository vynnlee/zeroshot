import axios from "axios";

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
  if (cachedResult && (now - lastFetchTime) < CACHE_DURATION) {
    // Adjust server time based on elapsed time
    const elapsed = now - lastFetchTime;
    return {
      serverTime: cachedResult.serverTime + elapsed,
      mgval: cachedResult.mgval,
    };
  }

  try {
    const clientStart = Date.now();
    const response = await axios.get("/api/fetch-server-time", {
      params: { url },
    });

    const serverTimeStr = response.data.serverTime;

    if (serverTimeStr) {
      const serverTime = new Date(serverTimeStr).getTime();
      const clientEnd = Date.now();

      const latency = clientEnd - clientStart;
      const mgval = Math.floor(latency / 2); // Estimated one-way latency

      // Cache the result
      cachedResult = { serverTime, mgval };
      lastFetchTime = now;

      return cachedResult;
    } else {
      console.warn("No server time received");
      return null;
    }
  } catch (error) {
    console.error("Error fetching server time:", error);
    return null;
  }
};

// Function to clear cache (useful when disconnecting)
export const clearTimeCache = () => {
  cachedResult = null;
  lastFetchTime = 0;
};
