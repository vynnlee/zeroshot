import axios, { AxiosError } from "axios";

interface TimeResult {
  T1: number;  // 클라이언트 요청 시작 시간
  T2: number;  // 서버에서 요청 수신 시간
  T3: number;  // 서버에서 응답 전송 시간
  T4: number;  // 클라이언트 응답 수신 시간
  serverTime: number;
  offset: number;
  delay: number;
  reliability: number;
}

interface SyncResult {
  serverTime: number;
  offset: number;
  delay: number;
  reliability: number;
  driftRate: number;  // 시간 드리프트 비율 (ms/ms)
}

interface DriftStats {
  driftRate: number;
  lastOffset: number;
  sampleCount: number;
  confidence: number;
}

let lastFetchTime = 0;
let cachedResult: SyncResult | null = null;
const CACHE_DURATION = 30000; // 30초로 단축
const SAMPLE_COUNT = 5; // 시간 샘플 수
let driftStats: DriftStats = {
  driftRate: 0,
  lastOffset: 0,
  sampleCount: 0,
  confidence: 0,
};

// 이상치 제거를 위한 표준편차 기반 필터링
function filterOutliers(samples: TimeResult[]): TimeResult[] {
  if (samples.length < 3) return samples;
  
  const delays = samples.map(s => s.delay);
  const mean = delays.reduce((a, b) => a + b, 0) / delays.length;
  const stdDev = Math.sqrt(
    delays.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / delays.length
  );
  
  return samples.filter(s => Math.abs(s.delay - mean) <= 2 * stdDev);
}

// 시간 드리프트 계산 및 업데이트
function updateDriftStats(newOffset: number): void {
  const now = Date.now();
  if (driftStats.sampleCount > 0) {
    const timeDiff = now - lastFetchTime;
    const offsetDiff = newOffset - driftStats.lastOffset;
    driftStats.driftRate = offsetDiff / timeDiff;
  }
  
  driftStats.lastOffset = newOffset;
  driftStats.sampleCount++;
  driftStats.confidence = Math.min(driftStats.sampleCount / 10, 1);
}

export const fetchServerTime = async (
  url: string
): Promise<SyncResult | null> => {
  const now = Date.now();
  
  // 캐시된 결과 사용 시 드리프트 보정 적용
  if (cachedResult && now - lastFetchTime < CACHE_DURATION) {
    const elapsed = now - lastFetchTime;
    const driftCorrection = driftStats.driftRate * elapsed;
    
    return {
      serverTime: cachedResult.serverTime + elapsed + driftCorrection,
      offset: cachedResult.offset + driftCorrection,
      delay: cachedResult.delay,
      reliability: cachedResult.reliability * 0.95, // 시간 경과에 따른 신뢰도 감소
      driftRate: cachedResult.driftRate,
    };
  }

  try {
    const formattedUrl = url.startsWith("http") ? url : `https://${url}`;
    console.log("[fetchServerTime] Starting time synchronization with:", formattedUrl);

    // 여러 번의 시간 샘플 수집
    const samples: TimeResult[] = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const T1 = Date.now();
      const response = await axios.get(`/api/fetch-server-time?url=${encodeURIComponent(formattedUrl)}`);
      const T4 = Date.now();

      if (response.data.error) {
        console.warn("[fetchServerTime] Sample fetch error:", response.data.error);
        continue;
      }

      const { serverTime: serverTimeStr, T2, T3, reliability } = response.data;
      if (!serverTimeStr || !T2 || !T3) continue;

      const serverTime = new Date(serverTimeStr).getTime();
      const delay = ((T4 - T1) - (T3 - T2)) / 2;
      const offset = ((T2 - T1) + (T3 - T4)) / 2;

      samples.push({
        T1, T2, T3, T4,
        serverTime,
        offset,
        delay,
        reliability: reliability || 0.5,
      });

      // 샘플 간 지연 추가
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (samples.length === 0) {
      console.warn("[fetchServerTime] No valid samples collected");
      return null;
    }

    // 이상치 제거 및 최적의 샘플 선택
    const filteredSamples = filterOutliers(samples);
    const bestSample = filteredSamples.reduce((best, current) => 
      current.delay < best.delay ? current : best
    );

    // 드리프트 통계 업데이트
    updateDriftStats(bestSample.offset);

    // 결과 캐싱
    cachedResult = {
      serverTime: bestSample.serverTime,
      offset: bestSample.offset,
      delay: bestSample.delay,
      reliability: bestSample.reliability * driftStats.confidence,
      driftRate: driftStats.driftRate,
    };
    lastFetchTime = now;

    console.log("[fetchServerTime] Sync completed", {
      samples: samples.length,
      filteredSamples: filteredSamples.length,
      bestDelay: bestSample.delay,
      offset: bestSample.offset,
      reliability: cachedResult.reliability,
      driftRate: cachedResult.driftRate,
    });

    return cachedResult;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("[fetchServerTime] Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
    } else {
      console.error("[fetchServerTime] Unknown error:", error);
    }
    return null;
  }
};

export const clearTimeCache = () => {
  console.log("[fetchServerTime] Clearing time cache and drift stats");
  cachedResult = null;
  lastFetchTime = 0;
  driftStats = {
    driftRate: 0,
    lastOffset: 0,
    sampleCount: 0,
    confidence: 0,
  };
};
