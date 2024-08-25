"use client";

import React, { useState, useEffect } from "react";
import { fetchPageSpeedData } from "@/utils/fetchPageSpeedData";
import { Loader2, Rabbit, Turtle, Snail } from "lucide-react";

const SpeedIndexScore: React.FC<{ url: string }> = ({ url }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!url) return;
      setLoading(true);
      setError("");
      try {
        const result = await fetchPageSpeedData(url);
        setData(result);
      } catch (err) {
        setError("Failed to fetch data. Please check the URL and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const processDataForChart = () => {
    if (!data) return { speedIndexValue: null };

    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;

    // Speed Index 값을 밀리초 단위로 가져옴
    const speedIndexValue = audits["speed-index"]?.numericValue;

    return { speedIndexValue };
  };

  const { speedIndexValue } = processDataForChart();

  const getTextColorAndIcon = () => {
    if (speedIndexValue === null || speedIndexValue === undefined)
      return { color: "text-neutral-500", Icon: null, description: "" };
    if (speedIndexValue <= 3400)
      return {
        color: "text-green-500",
        Icon: Rabbit,
        description: "페이지 로딩 속도가 매우 빠릅니다.",
      };
    if (speedIndexValue <= 5800)
      return {
        color: "text-yellow-500",
        Icon: Turtle,
        description: "페이지 로딩 속도가 보통입니다.",
      };
    return {
      color: "text-red-500",
      Icon: Snail,
      description: "페이지 로딩 속도가 느립니다.",
    };
  };

  const { color, Icon, description } = getTextColorAndIcon();

  const SpeedIndexBarChart = () => {
    const totalWidth = 100;
    const maxSpeedIndex = 7000; // 기준을 7000ms로 설정

    const goodWidth = (3400 / maxSpeedIndex) * totalWidth; // 3400ms까지는 Good
    const needsImprovementWidth = (2400 / maxSpeedIndex) * totalWidth; // 5800ms까지는 Needs Improvement
    const poorWidth = (1200 / maxSpeedIndex) * totalWidth; // 7000ms 이상은 Poor

    // Speed Index 값에 따른 색상 결정
    const barColor = speedIndexValue
      ? speedIndexValue <= 3400
        ? "bg-green-500"
        : speedIndexValue <= 5800
        ? "bg-yellow-500"
        : "bg-red-500"
      : "bg-neutral-200";

    return (
      <div>
        <div className="mb-2 flex items-center">
          {loading ? (
            <Loader2 className="animate-spin text-neutral-500" size={32} />
          ) : (
            <>
              <span className={`text-3xl font-semibold tabular-nums slashed-zero ${color}`}>
                {speedIndexValue !== null && speedIndexValue !== undefined ? `${speedIndexValue.toFixed(2)} ms` : "-"}
              </span>
            </>
          )}
        </div>
        <div className="relative w-full h-1 rounded-full overflow-hidden bg-neutral-200 flex">
          {/* Good Bar */}
          <div
            className={`h-full rounded-full ${barColor} ${
              loading ? "opacity-50" : ""
            } rounded-l-full`}
            style={{
              width: `${goodWidth}%`,
              marginRight: "3px",
            }}
          ></div>
          {/* Needs Improvement Bar */}
          <div
            className={`h-full rounded-full ${barColor} ${loading ? "opacity-50" : ""}`}
            style={{
              width: `${needsImprovementWidth}%`,
              marginRight: "3px",
            }}
          ></div>
          {/* Poor Bar */}
          <div
            className={`h-full rounded-full ${barColor} ${
              loading ? "opacity-50" : ""
            } rounded-r-full`}
            style={{
              width: `${poorWidth}%`,
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-800 tabular-nums slashed-zero">
          <span>0ms</span>
          <span>3400ms</span>
          <span>5800ms</span>
          <span>7000ms</span>
        </div>
        <div className="w-full mt-4 p-3 rounded bg-neutral-100 callout flex flex-row gap-1">
          {Icon && <Icon className={`${color}`} size={20} />}
          <p className="text-sm font-semibold text-neutral-600">{description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <SpeedIndexBarChart />
    </div>
  );
};

export default SpeedIndexScore;
