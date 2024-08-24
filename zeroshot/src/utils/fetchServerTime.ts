import axios from "axios";

export const fetchServerTime = async (
  url: string
): Promise<{ serverTime: number; mgval: number } | null> => {
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
      const mgval = latency; // 보정값을 그대로 사용

      return { serverTime, mgval };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching server time:", error);
    return null;
  }
};
