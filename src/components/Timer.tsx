"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { fetchServerTime, clearTimeCache } from "../utils/fetchServerTime";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { 
  Loader2, X, Activity, ChevronUp, ChevronDown, 
  Clock, Gauge, ArrowRight, ArrowLeft, 
  RefreshCw, Signal, Shield, AlertTriangle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  serverTimeUrl: string;
  stop: boolean;
  onDisconnect?: () => void;
  reactionError?: number;
}

interface SyncStatus {
  state: 'initial' | 'syncing' | 'synchronized' | 'error';
  message: string;
  details?: string;
}

const SYNC_INTERVAL = 60000; // 1 minute
const SEOUL_TIMEZONE = 'Asia/Seoul';

const Timer: React.FC<TimerProps> = ({
  serverTimeUrl,
  stop,
  onDisconnect,
  reactionError = 0
}) => {
  const [serverTime, setServerTime] = useState<number | null>(null);
  const [localTimeOffset, setLocalTimeOffset] = useState<number>(0);
  const [currentError, setCurrentError] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'initial',
    message: "표준시에 연결되었습니다.",
  });
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [showFixedBar, setShowFixedBar] = useState(false);
  const [showMonitor, setShowMonitor] = useState(true);
  const [driftRate, setDriftRate] = useState<number>(0);
  const [networkDelay, setNetworkDelay] = useState<number>(0);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const syncIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastSyncRef = useRef<number>(0);
  const timerRef = useRef<HTMLDivElement>(null);

  // Initialize timezone time
  const initializeTimezone = useCallback(() => {
    const now = new Date();
    const seoulTime = new Date(now.toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE }));
    const offset = seoulTime.getTime() - now.getTime();
    setLocalTimeOffset(offset);
    setServerTime(Date.now() + offset);
    setCurrentUrl("표준시");
    setSyncStatus({
      state: 'synchronized',
      message: "표준시에 연결되었습니다.",
    });
  }, []);

  // Initialize with timezone if no URL
  useEffect(() => {
    if (!serverTimeUrl && !currentUrl) {
      initializeTimezone();
    }
  }, [serverTimeUrl, currentUrl, initializeTimezone]);

  // Handle scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!timerRef.current) return;

      const rect = timerRef.current.getBoundingClientRect();
      const shouldShow = rect.top < 0;

      setShowFixedBar(shouldShow);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Synchronize time with server
  const synchronizeTime = useCallback(async () => {
    if (!serverTimeUrl || stop) return;

    setSyncStatus({
      state: 'syncing',
      message: "서버 시간 동기화 중...",
    });

    try {
      const result = await fetchServerTime(serverTimeUrl);

      if (result) {
        const { serverTime: newServerTime, offset, delay, driftRate: newDriftRate } = result;
        const newOffset = offset;

        setServerTime(newServerTime);
        setLocalTimeOffset(newOffset);
        setCurrentUrl(serverTimeUrl);
        lastSyncRef.current = Date.now();
        
        // 동기화 시점의 메트릭 설정
        setDriftRate(newDriftRate);
        setNetworkDelay(delay);
        setCurrentError(0); // 동기화 시점에서 오차 리셋

        setSyncStatus({
          state: 'synchronized',
          message: `${serverTimeUrl} 에 연결되었습니다.`,
          details: `Offset: ${newOffset}ms, Delay: ${delay}ms`,
        });

        localStorage.setItem('lastUrl', serverTimeUrl);
        localStorage.setItem('lastSync', String(Date.now()));
        localStorage.setItem('lastOffset', String(newOffset));
      } else {
        setSyncStatus({
          state: 'error',
          message: "시간 동기화 실패",
        });
      }
    } catch (error) {
      setSyncStatus({
        state: 'error',
        message: "서버 연결 오류",
      });
    }
  }, [serverTimeUrl, stop]);

  // Handle initial sync and periodic updates
  useEffect(() => {
    if (stop) {
      clearInterval(intervalRef.current);
      clearInterval(syncIntervalRef.current);
      return;
    }

    const cachedUrl = localStorage.getItem('lastUrl');
    const lastSyncTime = Number(localStorage.getItem('lastSync'));
    const cachedOffset = Number(localStorage.getItem('lastOffset'));

    if (serverTimeUrl) {
      synchronizeTime();
      syncIntervalRef.current = setInterval(synchronizeTime, SYNC_INTERVAL);
    } else if (cachedUrl && Date.now() - lastSyncTime < SYNC_INTERVAL) {
      setServerTime(Date.now() + cachedOffset);
      setLocalTimeOffset(cachedOffset);
      setCurrentUrl(cachedUrl);
    } else if (!serverTimeUrl && !cachedUrl) {
      initializeTimezone();
    }

    return () => {
      clearInterval(syncIntervalRef.current);
    };
  }, [serverTimeUrl, stop, synchronizeTime, initializeTimezone]);

  // Regular time updates
  useEffect(() => {
    if (!serverTime) return;

    const updateTimer = () => {
      const now = Date.now();
      const currentTime = now + localTimeOffset;
      const correctedTime = currentTime - reactionError;
      const roundedTime = Math.round(correctedTime / 10) * 10;

      setServerTime(roundedTime);

      // 실시간 모니터링 값 업데이트 (오차만 실시간 계산)
      const expectedTime = now + localTimeOffset;
      const newError = Math.abs(currentTime - expectedTime);
      setCurrentError(newError);

      // 오차가 크면 재동기화 트리거
      if (newError > 1000) { // 1초 이상 차이나면
        synchronizeTime();
      }
    };

    // requestAnimationFrame을 사용하여 더 부드러운 업데이트
    let animationFrameId: number;
    let lastUpdate = Date.now();

    const animate = () => {
      const now = Date.now();
      if (now - lastUpdate >= 10) { // 10ms 간격으로 업데이트
        updateTimer();
        lastUpdate = now;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [serverTime, localTimeOffset, reactionError, synchronizeTime]);

  // 모니터링 데이터 초기화 함수
  const resetMonitoringData = useCallback(() => {
    setDriftRate(0);
    setNetworkDelay(0);
    setCurrentError(0);
  }, []);

  // 연결 해제 시 모니터링 데이터도 초기화
  const handleDisconnect = () => {
    clearTimeCache();
    localStorage.removeItem('lastUrl');
    localStorage.removeItem('lastSync');
    localStorage.removeItem('lastOffset');
    clearInterval(syncIntervalRef.current);
    setCurrentUrl("");
    resetMonitoringData();
    initializeTimezone();
    onDisconnect?.();
  };

  if (!serverTime) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm text-neutral-600">{syncStatus.message}</p>
        {syncStatus.details && (
          <p className="text-xs text-neutral-500">{syncStatus.details}</p>
        )}
      </div>
    );
  }

  const seoulTime = new Date(serverTime + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(11, 23);

  const originalSeoulTime = reactionError ?
    new Date(serverTime + reactionError + 9 * 60 * 60 * 1000)
      .toISOString()
      .slice(11, 23)
    : null;

  // 시각화를 위한 타임라인 컴포넌트
  const SyncTimeline: React.FC<{
    delay: number;
    offset: number;
    lastSync: number;
  }> = ({ delay, offset, lastSync }) => {
    return (
      <div className="relative w-full bg-neutral-100 rounded-lg mt-2 p-4">
        <div className="space-y-3">
          {/* 동기화 단계 */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="flex-1 text-sm">
              <span className="font-medium">클라이언트</span>
              <span className="text-neutral-500"> 요청 전송</span>
            </div>
            <span className="text-xs text-neutral-500">T1</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="flex-1 text-sm">
              <span className="font-medium">서버</span>
              <span className="text-neutral-500"> 요청 수신 (</span>
              <span className="text-neutral-700 font-medium">{Math.round(delay / 2)}ms</span>
              <span className="text-neutral-500">)</span>
            </div>
            <span className="text-xs text-neutral-500">T2</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <div className="flex-1 text-sm">
              <span className="font-medium">서버</span>
              <span className="text-neutral-500"> 응답 전송</span>
            </div>
            <span className="text-xs text-neutral-500">T3</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div className="flex-1 text-sm">
              <span className="font-medium">클라이언트</span>
              <span className="text-neutral-500"> 응답 수신 (</span>
              <span className="text-neutral-700 font-medium">{Math.round(delay / 2)}ms</span>
              <span className="text-neutral-500">)</span>
            </div>
            <span className="text-xs text-neutral-500">T4</span>
          </div>

          {/* 요약 정보 */}
          <div className="mt-4 pt-3 border-t border-neutral-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">총 지연 시간</span>
                <span className="text-sm font-medium">{Math.round(delay)}ms</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-neutral-500">시간 오프셋</span>
                <span className="text-sm font-medium">{Math.round(offset)}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 정확도 게이지 컴포넌트
  const AccuracyGauge: React.FC<{
    currentError: number;
    networkDelay: number;
  }> = ({ currentError, networkDelay }) => {
    const errorScore = Math.max(0, 100 - (currentError / 10));
    const delayScore = Math.max(0, 100 - (networkDelay / 2));
    const totalScore = (errorScore * 0.6 + delayScore * 0.4);

    const getScoreColor = (score: number) => {
      if (score > 80) return 'bg-green-500';
      if (score > 60) return 'bg-yellow-500';
      if (score > 40) return 'bg-orange-500';
      return 'bg-red-500';
    };

    return (
      <div className="relative w-full bg-neutral-100 rounded-lg mt-2 p-4">
        {/* 메인 스코어 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold",
              getScoreColor(totalScore)
            )}>
              {Math.round(totalScore)}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">정확도 점수</span>
              <span className="text-xs text-neutral-500">
                {totalScore > 80 ? '매우 좋음' :
                 totalScore > 60 ? '양호' :
                 totalScore > 40 ? '주의' : '나쁨'}
              </span>
            </div>
          </div>
        </div>

        {/* 세부 스코어 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <AlertTriangle className="w-3 h-3" />
              <span>오차</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-300", getScoreColor(errorScore))}
                style={{ width: `${errorScore}%` }}
              />
            </div>
            <span className="text-xs font-medium">{errorScore.toFixed(1)}%</span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Signal className="w-3 h-3" />
              <span>지연</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-300", getScoreColor(delayScore))}
                style={{ width: `${delayScore}%` }}
              />
            </div>
            <span className="text-xs font-medium">{delayScore.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Fixed timer bar */}
      <div
        className={cn(
          "fixed top-0 left-0 w-full bg-black transition-transform duration-300",
          showFixedBar ? "translate-y-0" : "-translate-y-full"
        )}
        style={{
          zIndex: 9999,
        }}
      >
        <div className="container mx-auto px-4 py-1">
          <div className="flex flex-row gap-2 items-center justify-center text-lg font-medium text-center text-white tabular-nums slashed-zero">
            <span className="relative flex h-2 w-2">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${syncStatus.state === 'synchronized' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
              />
              <span
                className={`relative inline-flex h-2 w-2 rounded-full ${syncStatus.state === 'synchronized' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
              />
            </span>
            <p>{seoulTime}</p>

          </div>
        </div>
      </div>

      {/* Monitoring Panel */}
      <div
        className={cn(
          "z-[999] fixed bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg transition-transform duration-300 max-w-xs",
          !showMonitor && "translate-y-[calc(100%-2.5rem)]"
        )}
      >
        <button
          onClick={() => setShowMonitor(!showMonitor)}
          className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-neutral-700 hover:bg-neutral-50 rounded-t-lg"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>시간 동기화 모니터</span>
          </div>
          {showMonitor ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
        
        <div className="px-4 pb-4">
          <div className="space-y-4">
            {/* 상태 표시 섹션 */}
            <div className="bg-neutral-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      syncStatus.state === 'synchronized' ? "bg-green-500" :
                      syncStatus.state === 'syncing' ? "bg-yellow-500" :
                      "bg-red-500"
                    )}
                  />
                  <span className="text-sm font-medium">
                    {syncStatus.state === 'synchronized' ? "동기화됨" :
                     syncStatus.state === 'syncing' ? "동기화 중" :
                     "오류"}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {lastSyncRef.current > 0
                    ? `${Math.floor((Date.now() - lastSyncRef.current) / 1000)}초 전`
                    : "-"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500">오프셋</span>
                  <span className="font-medium">{Math.round(localTimeOffset)}ms</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500">지연</span>
                  <span className="font-medium">{Math.round(networkDelay)}ms</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500">드리프트</span>
                  <span className="font-medium">{Math.round(driftRate * 1000)}ms/s</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-neutral-500">현재 오차</span>
                  <span className={cn(
                    "font-medium",
                    currentError > 100 && "text-yellow-600",
                    currentError > 1000 && "text-red-600"
                  )}>
                    {Math.round(currentError)}ms
                  </span>
                </div>
              </div>
            </div>

            {/* 동기화 과정 시각화 */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">동기화 과정</span>
                </div>
                <RefreshCw 
                  className={cn(
                    "w-4 h-4 text-neutral-400 cursor-pointer hover:text-neutral-600 transition-colors",
                    syncStatus.state === 'syncing' && "animate-spin"
                  )}
                  onClick={synchronizeTime}
                />
              </div>
              <SyncTimeline
                delay={networkDelay}
                offset={localTimeOffset}
                lastSync={lastSyncRef.current}
              />
            </div>

            {/* 정확도 분석 */}
            <div className="border-t border-neutral-200 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4" />
                <span className="font-medium">정확도 분석</span>
              </div>
              <AccuracyGauge
                currentError={currentError}
                networkDelay={networkDelay}
              />
            </div>

            {/* 반응 시간 보정 */}
            {reactionError !== 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">반응 시간 보정</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {reactionError}ms
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main timer */}
      <div ref={timerRef} className="flex flex-col items-center gap-2">
        <Badge
          variant="outline"
          className="gap-1 tabular-nums slashed-zero"
        >
          {new Date(serverTime).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Badge>

        <div className="flex flex-col items-center">
          <h1 className={cn(
            "font-medium text-5xl md:text-7xl text-center tabular-nums slashed-zero transition-colors duration-300",
            reactionError !== 0 && "text-blue-500"
          )}>
            {seoulTime}
          </h1>
          {originalSeoulTime && (
            <div className="text-xl text-neutral-500 tabular-nums slashed-zero mt-1">
              {originalSeoulTime}
            </div>
          )}
        </div>

        <div className="flex flex-row gap-2 items-center">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${syncStatus.state === 'synchronized' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${syncStatus.state === 'synchronized' ? 'bg-green-500' : 'bg-yellow-500'
                }`}
            />
          </span>

          <h3 className="flex flex-row gap-1 font-medium text-sm text-neutral-800">
            {currentUrl !== "표준시" ? (
              <>
                <Link
                  className="underline underline-offset-2 hover:text-neutral-500 hover:decoration-neutral-500 ease-out duration-200"
                  href={`${currentUrl}`}
                  target="_blank"
                  prefetch={false}
                >
                  {currentUrl}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={handleDisconnect}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              currentUrl
            )}
            에 연결되었습니다.
          </h3>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-neutral-500">
            현재 오차: {Math.round(currentError)} ms
          </p>
          {lastSyncRef.current > 0 && currentUrl !== "표준시" && (
            <p className="text-xs text-neutral-500">
              마지막 동기화: {Math.floor((Date.now() - lastSyncRef.current) / 1000)}초 전
            </p>
          )}
          {reactionError !== 0 && (
            <p className="text-xs text-blue-500">
              반응 속도 보정: {reactionError}ms
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Timer;
