"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { fetchServerTime } from "@/utils/fetchServerTime";
import { Badge } from "@/components/ui/badge";

const Timer: React.FC<{ serverTimeUrl: string; stop: boolean }> = ({
  serverTimeUrl,
  stop,
}) => {
  const [serverTime, setServerTime] = useState<number | null>(null);
  const [localTimeOffset, setLocalTimeOffset] = useState<number>(0);
  const [currentError, setCurrentError] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>(
    "세계 표준시에 연결되었습니다."
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const errorIntervalRef = useRef<ReturnType<typeof setInterval>>();
  const [currentUrl, setCurrentUrl] = useState<string>("");

  useEffect(() => {
    if (stop) return;

    if (serverTimeUrl) {
      const fetchAndSetTime = async () => {
        setStatusMessage("Fetching server time...");
        const result = await fetchServerTime(serverTimeUrl);
        if (result) {
          const { serverTime, mgval } = result;
          const adjustedServerTime = serverTime + mgval;
          setServerTime(adjustedServerTime);

          const offset = adjustedServerTime - Date.now();
          setLocalTimeOffset(offset);
          setStatusMessage(`${serverTimeUrl} 에 연결되었습니다.`);
          setCurrentUrl(serverTimeUrl);
        } else {
          setStatusMessage("Failed to fetch server time");
        }
      };

      fetchAndSetTime(); 
    } else {
      const currentUtcTime = Date.now();
      setServerTime(currentUtcTime);
      setCurrentUrl("세계 표준시");
    }
  }, [serverTimeUrl, stop]);

  useEffect(() => {
    if (!serverTime || stop) return;

    intervalRef.current = setInterval(() => {
      const currentTime = Date.now() + localTimeOffset;
      const roundedTime = Math.round(currentTime / 10) * 10;

      setServerTime(roundedTime);
    }, 10);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [serverTime, localTimeOffset, stop]);

  useEffect(() => {
    if (!serverTime || stop) return;

    errorIntervalRef.current = setInterval(() => {
      const currentTime = Date.now() + localTimeOffset;
      const timeError = currentTime - serverTime!;
      setCurrentError(timeError);
    }, 1000);

    return () => {
      if (errorIntervalRef.current) {
        clearInterval(errorIntervalRef.current);
      }
    };
  }, [serverTime, localTimeOffset, stop]);

  if (!serverTime) {
    return (
      <div>
        <p>Loading server time...</p>
        <p>{statusMessage}</p>
      </div>
    );
  }

  const seoulTime = new Date(serverTime + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(11, 23);

  return (
    <div className="flex flex-col items-center gap-2">
      <Badge variant="outline" className="gap-1 tabular-nums slashed-zero">
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
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <h3 className="flex flex-row gap-1 font-medium text-sm text-neutral-800">
          <Link
            className="underline underline-offset-2 hover:text-neutral-500 hover:decoration-neutral-500 ease-out duration-200"
            href={currentUrl !== "세계 표준시" ? `https://${currentUrl}` : "#"}
            target={currentUrl !== "세계 표준시" ? "_blank" : "_self"}
            prefetch={false}
          >
            {currentUrl}
          </Link>
          에 연결되었습니다.
        </h3>
      </div>
      <p className="text-xs text-neutral-500">현재 오차: {currentError} ms</p>
    </div>
  );
};

export default Timer;
