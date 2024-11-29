"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { AlertCircle, Play, RefreshCcw, Clock, Check, X } from "lucide-react";
import { Badge } from "./ui/badge";

interface ReactionResult {
  time: number;
  error: number;
  timestamp: number;
}

interface VirtualTimerProps {
  time: Date;
  targetTime: Date;
}

interface ReactionTestProps {
  onErrorApply: (error: number) => void;
  onErrorReset: () => void;
  isErrorApplied: boolean;
}

const TARGET_TIME = new Date(2024, 0, 1, 10, 0, 0);
const START_TIME = new Date(2024, 0, 1, 9, 59, 50);
const UPDATE_INTERVAL = 1000 / 60; // 60 FPS for smooth updates

const VirtualTimer: React.FC<VirtualTimerProps> = ({ time, targetTime }) => {
  const timeString = time.toTimeString().slice(0, 8);
  const targetTimeString = targetTime.toTimeString().slice(0, 8);

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge
        variant="outline"
        className="text-xs"
      >
        목표 시각: {targetTimeString}
      </Badge>
      <div className="font-medium text-2xl tabular-nums slashed-zero">
        {timeString}
      </div>
    </div>
  );
};

const ReactionTest: React.FC<ReactionTestProps> = ({
  onErrorApply,
  onErrorReset,
  isErrorApplied
}) => {
  const [gameState, setGameState] = useState<'waiting' | 'running' | 'result'>('waiting');
  const [results, setResults] = useState<ReactionResult[]>([]);
  const [currentTime, setCurrentTime] = useState<Date>(new Date(START_TIME));
  const [averageError, setAverageError] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const startTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);

  const formatTimeForDisplay = (time: number) => {
    return Math.abs(time).toFixed(0);
  };

  const startGame = useCallback(() => {
    const now = Date.now();
    setCurrentTime(new Date(START_TIME));
    gameStartTimeRef.current = now;
    startTimeRef.current = START_TIME.getTime();
    setGameState('running');

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - gameStartTimeRef.current;
      const newTime = new Date(START_TIME.getTime() + elapsed);
      setCurrentTime(newTime);
    }, UPDATE_INTERVAL);
  }, []);

  const handleGameAction = () => {
    if (gameState === 'waiting') {
      startGame();
      return;
    }

    if (gameState === 'running') {
      const clickTime = currentTime.getTime();
      const targetTime = TARGET_TIME.getTime();
      const error = clickTime - targetTime;

      const newResult: ReactionResult = {
        time: clickTime,
        error,
        timestamp: Date.now(),
      };

      const newResults = [...results, newResult].slice(-5); // Keep last 5 results
      setResults(newResults);

      const newAverageError = Math.round(
        newResults.reduce((sum, r) => sum + r.error, 0) / newResults.length
      );
      setAverageError(newAverageError);

      clearInterval(intervalRef.current);
      setGameState('result');
    }

    if (gameState === 'result') {
      setGameState('waiting');
    }
  };

  const resetTest = () => {
    setResults([]);
    setAverageError(null);
    setGameState('waiting');
    clearInterval(intervalRef.current);
    if (isErrorApplied) {
      onErrorReset();
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
          정확한 타이밍을 위한 반응 속도를 측정합니다
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="w-full h-40 rounded-lg flex flex-col items-center justify-center bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          {gameState !== 'waiting' && (
            <VirtualTimer
              time={currentTime}
              targetTime={TARGET_TIME}
            />
          )}
          <Button
            variant="outline"
            size="lg"
            className="mt-4"
            onClick={handleGameAction}
          >
            {gameState === 'waiting' ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                게임 시작
              </>
            ) : gameState === 'running' ? (
              '클릭하세요!'
            ) : (
              '다시 시도'
            )}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">최근 기록</span>
              <div className="flex gap-2">
                {averageError !== null && !isErrorApplied && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyError}
                    className="h-8 px-2 flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    보정값 적용
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetTest}
                  className="h-8 px-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              {results.map((result, index) => (
                <div key={result.timestamp} className="flex items-center gap-2">
                  <Progress
                    value={Math.min(100, (Math.abs(result.error) / 1000) * 100)}
                    className={`h-2 ${result.error > 0 ? 'bg-red-100' : 'bg-green-100'}`}
                  />
                  <span className={`text-sm tabular-nums w-16 ${result.error > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                    {result.error > 0 ? '+' : ''}{formatTimeForDisplay(result.error)}ms
                  </span>
                </div>
              ))}
            </div>

            {averageError !== null && (
              <div className="flex items-center justify-between text-sm">
                <span>평균 오차:</span>
                <span className={`font-medium ${averageError > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                  {averageError > 0 ? '+' : ''}{formatTimeForDisplay(averageError)}ms
                </span>
              </div>
            )}
          </div>
        )}

        {isErrorApplied && (
          <div className="flex items-start gap-2 p-3 bg-green-50 rounded-lg">
            <Check className="h-5 w-5 text-green-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-neutral-800">
                보정값이 적용되었습니다
              </p>
              <p className="text-sm text-neutral-600">
                메인 타이머에 {formatTimeForDisplay(averageError || 0)}ms의 보정값이 적용되었습니다.
                <Button
                  variant="link"
                  size="sm"
                  onClick={resetTest}
                  className="px-1 h-auto text-blue-500 hover:text-blue-600"
                >
                  취소하기
                </Button>
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReactionTest;
