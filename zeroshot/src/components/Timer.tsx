"use client";

import React, { useEffect, useState, useRef } from "react";
import { fetchServerTime } from "../utils/fetchServerTime";

const Timer: React.FC<{ serverTimeUrl: string; stop: boolean }> = ({
  serverTimeUrl,
  stop,
}) => {
  const [serverTime, setServerTime] = useState<number | null>(null);
  const [localTimeOffset, setLocalTimeOffset] = useState<number>(0);
  const [currentError, setCurrentError] = useState<number>(0); // 1초마다 오차를 표시
  const [statusMessage, setStatusMessage] = useState<string>("Initializing...");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const errorIntervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (stop) return;

    const fetchAndSetTime = async () => {
      setStatusMessage("Fetching server time...");
      const result = await fetchServerTime(serverTimeUrl);
      if (result) {
        const { serverTime, mgval } = result;
        const adjustedServerTime = serverTime + mgval;
        setServerTime(adjustedServerTime);

        const offset = adjustedServerTime - Date.now();
        setLocalTimeOffset(offset);
        setStatusMessage("Server time fetched and timer started");
      } else {
        setStatusMessage("Failed to fetch server time");
      }
    };

    fetchAndSetTime(); // 서버 시간 처음 요청 및 설정
  }, [serverTimeUrl, stop]);

  useEffect(() => {
    if (!serverTime || stop) return;

    intervalRef.current = setInterval(() => {
      const currentTime = Date.now() + localTimeOffset;
      const roundedTime = Math.round(currentTime / 10) * 10; // 10ms 단위로 반올림

      setServerTime(roundedTime); // 타이머 업데이트
    }, 10); // 10ms마다 갱신

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
      setCurrentError(timeError); // 1초마다 오차 계산 및 업데이트
    }, 1000); // 1초마다 오차 계산

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

  // 서울 시간대로 시간 포맷
  const seoulTime = new Date(serverTime + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(11, 23);

  return (
    <div>
      <p className="text-xl">Seoul Time: {seoulTime}</p>
      <p>Status: {statusMessage}</p>
      <p>Current Error: {currentError} ms</p>
    </div>
  );
};

export default Timer;
