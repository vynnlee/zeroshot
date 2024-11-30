"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { AlertCircle, Play, RefreshCcw, Clock, Check, RotateCcw, Settings2, Info } from "lucide-react";
import { Badge } from "./ui/badge";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { cn } from "@/lib/utils";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "./ui/tooltip";
import Timer from "./Timer";

interface ReactionResult {
  time: number;
  error: number;
  timestamp: number;
  type: 'early' | 'late';
}

interface VirtualTimerProps {
  time: Date;
  targetTime: Date;
  isErrorApplied?: boolean;
  originalTime?: Date;
}

interface ReactionTestProps {
  onErrorApply: (error: number) => void;
  onErrorReset: () => void;
  isErrorApplied: boolean;
  initialTargetTime?: Date;
}

const DEFAULT_TARGET_TIME = new Date(2024, 0, 1, 10, 0, 0);
const DEFAULT_START_TIME = new Date(2024, 0, 1, 9, 59, 50);
const MEASUREMENT_WINDOW_START = 3000;
const UPDATE_INTERVAL = 1000 / 60;
const MAX_RESULTS = 100;

const VirtualTimer: React.FC<VirtualTimerProps> = ({ time, targetTime, isErrorApplied, originalTime }) => {
  const timeString = time.toTimeString().slice(0, 8);
  const targetTimeString = targetTime.toTimeString().slice(0, 8);
  const milliseconds = time.getMilliseconds().toString().padStart(3, '0');

  const originalTimeString = originalTime?.toTimeString().slice(0, 8);
  const originalMilliseconds = originalTime?.getMilliseconds().toString().padStart(3, '0');

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge variant="outline" className="text-xs">
        목표 시각: {targetTimeString}
      </Badge>
      <div className={cn(
        "font-medium text-4xl tabular-nums slashed-zero tracking-tight transition-colors duration-300"
      )}>
        {timeString}
        <span className="text-4xl">.{milliseconds}</span>
      </div>
      {isErrorApplied && originalTime && (
        <div className="text-sm text-neutral-500 tabular-nums slashed-zero tracking-tight mt-1">
          원본: {originalTimeString}.{originalMilliseconds}
        </div>
      )}
    </div>
  );
};

const getRating = (error: number) => {
  const absError = Math.abs(error);
  if (absError <= 10) return { text: 'PERFECT', image: '/stickers/perfect.png', color: 'text-purple-500' };
  if (absError <= 100) return { text: 'EXCELLENT', image: '/stickers/excellent.png', color: 'text-blue-500' };
  if (absError <= 200) return { text: 'NICE', image: '/stickers/nice.png', color: 'text-green-500' };
  if (absError <= 400) return { text: 'GOOD', image: '/stickers/good.png', color: 'text-yellow-500' };
  return { text: 'BAD', image: '/stickers/bad.png', color: 'text-red-500' };
};

const ErrorChart = ({ data }: { data: ReactionResult[] }) => {
  const chartData = data.map((result, index) => ({
    attempt: index + 1,
    error: result.error,
  }));

  return (
    <div className="w-full" style={{ height: '100px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 5, bottom: 0, left: 5 }}>
          <defs>
            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--color-error))" stopOpacity={0.8} />
              <stop offset="95%" stopColor="hsl(var(--color-error))" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f0f0f0" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const data = payload[0];
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="font-medium">시도:</span>
                    <span>{data.payload.attempt}</span>
                    <span className="font-medium">오차:</span>
                    <span>{data.value}ms</span>
                  </div>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="error"
            stroke="hsl(var(--color-error))"
            fill="url(#errorGradient)"
            strokeWidth={1.5}
            dot={{ fill: "hsl(var(--color-error))", r: 2 }}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const GameSettings = ({
  onStart,
  onCancel
}: {
  onStart: (targetTime: Date, startOffset: number) => void;
  onCancel: () => void;
}) => {
  const [hours, setHours] = useState("10");
  const [minutes, setMinutes] = useState("00");
  const [seconds, setSeconds] = useState("00");
  const [startOffset, setStartOffset] = useState("10");

  const handleStart = () => {
    const now = new Date();
    const targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
    onStart(targetTime, parseInt(startOffset));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        <div className="space-y-2">
          <Label>목표 시각 설정</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              max="23"
              className="w-20"
            />
            <span className="flex items-center">:</span>
            <Input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              min="0"
              max="59"
              className="w-20"
            />
            <span className="flex items-center">:</span>
            <Input
              type="number"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              min="0"
              max="59"
              className="w-20"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>몇 초 전부터 시작할까요?</Label>
          <Input
            type="number"
            value={startOffset}
            onChange={(e) => setStartOffset(e.target.value)}
            min="5"
            max="30"
            className="w-full"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleStart} variant="outline" className="flex-1">
          <Play className="mr-2 h-4 w-4" />
          시작하기
        </Button>
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          취소
        </Button>
      </div>
    </div>
  );
};

const ReactionTest: React.FC<ReactionTestProps> = ({
  onErrorApply,
  onErrorReset,
  isErrorApplied,
  initialTargetTime = DEFAULT_TARGET_TIME
}) => {
  const [gameState, setGameState] = useState<'config' | 'waiting' | 'running' | 'result'>('config');
  const [results, setResults] = useState<ReactionResult[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(DEFAULT_START_TIME);
  const [originalTime, setOriginalTime] = useState<Date | undefined>();
  const [targetTime, setTargetTime] = useState<Date>(initialTargetTime);
  const [startOffset, setStartOffset] = useState<number>(10);
  const [averageError, setAverageError] = useState<number | null>(null);
  const [earlyAverage, setEarlyAverage] = useState<number | null>(null);
  const [lateAverage, setLateAverage] = useState<number | null>(null);
  const [lastRating, setLastRating] = useState<{ text: string; image: string; color: string } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);

  const formatTimeForDisplay = (time: number) => {
    return Math.abs(time).toFixed(0);
  };

  const handleGameStart = (newTargetTime: Date, newStartOffset: number) => {
    setTargetTime(newTargetTime);
    setStartOffset(newStartOffset);
    setGameState('waiting');
  };

  const handleRetry = () => {
    clearInterval(intervalRef.current);
    const startTime = new Date(targetTime.getTime() - startOffset * 1000);
    const now = Date.now();
    setCurrentTime(startTime);
    setOriginalTime(undefined);
    gameStartTimeRef.current = now;
    startTimeRef.current = startTime.getTime();
    setGameState('running');

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - gameStartTimeRef.current;
      const newTime = new Date(startTime.getTime() + elapsed);
      setCurrentTime(newTime);
    }, UPDATE_INTERVAL);
  };

  const handleReset = () => {
    setResults([]);
    setAverageError(null);
    setEarlyAverage(null);
    setLateAverage(null);
    setLastRating(null);
    setOriginalTime(undefined);
    setGameState('config');
    clearInterval(intervalRef.current);
    if (isErrorApplied) {
      onErrorReset();
    }
  };

  const handleGameAction = () => {
    if (gameState === 'waiting') {
      const startTime = new Date(targetTime.getTime() - startOffset * 1000);
      const now = Date.now();
      setCurrentTime(startTime);
      gameStartTimeRef.current = now;
      startTimeRef.current = startTime.getTime();
      setGameState('running');

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - gameStartTimeRef.current;
        const newTime = new Date(startTime.getTime() + elapsed);
        setCurrentTime(newTime);
      }, UPDATE_INTERVAL);
      return;
    }

    if (gameState === 'running') {
      const clickTime = currentTime.getTime();
      const targetTimeMs = targetTime.getTime();
      const error = clickTime - targetTimeMs;
      const type = error < 0 ? 'early' : 'late';

      const newResult: ReactionResult = {
        time: clickTime,
        error,
        timestamp: Date.now(),
        type
      };

      const rating = getRating(error);
      setLastRating(rating);

      const newResults = [...results, newResult].slice(-MAX_RESULTS);
      setResults(newResults);

      const earlyResults = newResults.filter(r => r.type === 'early');
      const lateResults = newResults.filter(r => r.type === 'late');

      const newEarlyAverage = earlyResults.length > 0
        ? Math.round(earlyResults.reduce((sum, r) => sum + Math.abs(r.error), 0) / earlyResults.length)
        : null;

      const newLateAverage = lateResults.length > 0
        ? Math.round(lateResults.reduce((sum, r) => sum + r.error, 0) / lateResults.length)
        : null;

      setEarlyAverage(newEarlyAverage);
      setLateAverage(newLateAverage);

      const newAverageError = Math.round(
        newResults.reduce((sum, r) => sum + r.error, 0) / newResults.length
      );
      setAverageError(newAverageError);

      clearInterval(intervalRef.current);
      setGameState('result');
    }
  };

  const applyError = () => {
    if (averageError !== null) {
      onErrorApply(averageError);
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5" />
          반응 속도 테스트
        </CardTitle>
        <CardDescription>
          반응 속도를 테스트해보며 타이머를 보정해보세요.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {gameState === 'config' ? (
          <GameSettings
            onStart={handleGameStart}
            onCancel={() => setGameState('waiting')}
          />
        ) : (
          <>
            <div className="w-full p-4 h-[240px] border border-neutral-100 rounded-lg flex flex-col items-center justify-center bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] relative">
              {gameState !== 'waiting' && (
                <>
                  <VirtualTimer
                    time={currentTime}
                    targetTime={targetTime}
                    isErrorApplied={isErrorApplied}
                    originalTime={originalTime}
                  />
                  {lastRating && gameState === 'result' && (
                    <div className="w-full relative flex flex-col items-center">
                      <div className="absolute -top-32 w-48 h-[56px]">
                        <Image
                          src={lastRating.image}
                          alt={lastRating.text}
                          fill
                          className="object-contain rating-animation"
                        />
                      </div>
                      <div className={`text-sm mt-1 text-neutral-800`}>
                        오차: {results[results.length - 1]?.error > 0 ? '+' : ''}{formatTimeForDisplay(results[results.length - 1]?.error || 0)}ms
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-2 mt-4">
                {gameState === 'waiting' ? (
                  <>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleGameAction}
                      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      시작하기
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setGameState('config')}
                      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100"
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      설정
                    </Button>
                  </>
                ) : gameState === 'running' ? (
                  <Button
                    variant="default"
                    size="lg"
                    onClick={handleGameAction}
                    className="animate-pulse"
                  >
                    클릭하세요!
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleRetry}
                      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      다시 시도
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100"
                    >
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      초기화
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">반응 시간 기록</span>
                {averageError !== null && !isErrorApplied && (
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>보정값을 적용하면 메인 타이머에 평균 오차만큼 시간이 조정됩니다.</p>
                          <p>이를 통해 더 정확한 시간 측정이 가능합니다.</p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={applyError}
                      className="h-8 px-2 flex items-center gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      타이머에 보정값 적용
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-neutral-600">평균 빠른 클릭</span>
                  <div className="font-medium">
                    {earlyAverage !== null ? `-${formatTimeForDisplay(earlyAverage)}ms` : "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-neutral-600">평균 늦은 클릭</span>
                  <div className="font-medium">
                    {lateAverage !== null ? `+${formatTimeForDisplay(lateAverage)}ms` : "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-green-500">전체 평균 오차</span>
                  <div className="font-medium">
                    {averageError !== null ? `${averageError > 0 ? '+' : ''}${formatTimeForDisplay(averageError)}ms` : "-"}
                  </div>
                </div>
              </div>
              <ErrorChart data={results} />
            </div>

            {isErrorApplied && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                <Check className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-neutral-800">
                    보정값이 적용되었습니다
                  </p>
                  <p className="text-sm text-neutral-600">
                    메인 타이머에 {formatTimeForDisplay(averageError || 0)}ms의 보정값이 적용되었습니다.
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleReset}
                      className="px-1 h-auto text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      취소하기
                    </Button>
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ReactionTest;
