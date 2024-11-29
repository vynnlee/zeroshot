"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { fetchServerTime, clearTimeCache } from "../utils/fetchServerTime";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Loader2, X } from "lucide-react";

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
    message: "타임존에 연결되었습니다.",
  });
  const [currentUrl, setCurrentUrl] = useState<string>("");

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const syncIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastSyncRef = useRef<number>(0);

  // Initialize timezone time
  const initializeTimezone = useCallback(() => {
    const now = new Date();
    const seoulTime = new Date(now.toLocaleString('en-US', { timeZone: SEOUL_TIMEZONE }));
    const offset = seoulTime.getTime() - now.getTime();
    setLocalTimeOffset(offset);
    setServerTime(Date.now() + offset);
    setCurrentUrl("타임존");
    setSyncStatus({
      state: 'synchronized',
      message: "타임존에 연결되었습니다.",
    });
  }, []);

  // Initialize with timezone if no URL
  useEffect(() => {
    if (!serverTimeUrl && !currentUrl) {
      initializeTimezone();
    }
  }, [serverTimeUrl, currentUrl, initializeTimezone]);

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
        const { serverTime: newServerTime, mgval } = result;
        const newOffset = newServerTime - Date.now() + mgval;

        setServerTime(newServerTime);
        setLocalTimeOffset(newOffset);
        setCurrentUrl(serverTimeUrl);
        lastSyncRef.current = Date.now();

        setSyncStatus({
          state: 'synchronized',
          message: `${serverTimeUrl} 에 연결되었습니다.`,
          details: `Offset: ${newOffset}ms`,
        });

        // Save to localStorage
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

    // Check localStorage for cached URL
    const cachedUrl = localStorage.getItem('lastUrl');
    const lastSyncTime = Number(localStorage.getItem('lastSync'));
    const cachedOffset = Number(localStorage.getItem('lastOffset'));

    if (serverTimeUrl) {
      // New URL provided - sync immediately
      synchronizeTime();

      // Set up periodic sync
      syncIntervalRef.current = setInterval(synchronizeTime, SYNC_INTERVAL);
    } else if (cachedUrl && Date.now() - lastSyncTime < SYNC_INTERVAL) {
      // Use cached values if recent
      setServerTime(Date.now() + cachedOffset);
      setLocalTimeOffset(cachedOffset);
      setCurrentUrl(cachedUrl);
    } else if (!serverTimeUrl && !cachedUrl) {
      // Initialize timezone if no URL or cache
      initializeTimezone();
    }

    return () => {
      clearInterval(syncIntervalRef.current);
    };
  }, [serverTimeUrl, stop, synchronizeTime, initializeTimezone]);

  // Regular time updates
  useEffect(() => {
    if (!serverTime) return;

    intervalRef.current = setInterval(() => {
      const currentTime = Date.now() + localTimeOffset - reactionError;
      const roundedTime = Math.round(currentTime / 10) * 10;

      setServerTime(roundedTime);

      const newError = Math.abs(currentTime - (Date.now() + localTimeOffset));
      setCurrentError(newError);
    }, 10);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [serverTime, localTimeOffset, reactionError]);

  const handleDisconnect = () => {
    clearTimeCache(); // Clear the time cache
    localStorage.removeItem('lastUrl');
    localStorage.removeItem('lastSync');
    localStorage.removeItem('lastOffset');
    clearInterval(syncIntervalRef.current);
    setCurrentUrl("");
    initializeTimezone(); // Initialize timezone immediately
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

  return (
    <div className="flex flex-col items-center gap-2">
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

      <h1 className="font-medium text-6xl md:text-7xl text-center tabular-nums slashed-zero">
        {seoulTime}
      </h1>

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
          {currentUrl !== "타임존" ? (
            <>
              <Link
                className="underline underline-offset-2 hover:text-neutral-500 hover:decoration-neutral-500 ease-out duration-200"
                href={`https://${currentUrl}`}
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
          현재 오차: {currentError} ms
        </p>
        {lastSyncRef.current > 0 && currentUrl !== "타임존" && (
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
  );
};

export default Timer;
