"use client";

import React, { useState, useEffect } from "react";
import { fetchPageSpeedData } from "@/utils/fetchPageSpeedData";
import { Loader2, Rabbit, Turtle, Snail } from "lucide-react";

const FidScore: React.FC<{ url: string }> = ({ url }) => {
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
    if (!data) return { fidValue: null };

    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;

    // FID 값을 밀리초 단위로 가져옴
    const fidValue = audits["first-input-delay"]?.numericValue;

    return { fidValue };
  };

  const { fidValue } = processDataForChart();

  const getTextColorAndIcon = () => {
    if (fidValue === null || fidValue === undefined)
      return { color: "text-neutral-500", Icon: null, description: "" };
    if (fidValue <= 100)
      return {
        color: "text-green-500",
        Icon: Rabbit,
        description: "FID 값이 매우 빠릅니다.",
      };
    if (fidValue <= 300)
      return {
        color: "text-yellow-500",
        Icon: Turtle,
        description: "FID 값이 보통입니다.",
      };
    return {
      color: "text-red-500",
      Icon: Snail,
      description: "FID 값이 느립니다.",
    };
  };

  const { color, Icon, description } = getTextColorAndIcon();

  const FIDBarChart = () => {
    const totalWidth = 100;
    const maxFID = 500; // 기준을 500ms로 설정

    const goodWidth = (100 / maxFID) * totalWidth; // 100ms까지는 Good
    const needsImprovementWidth = (200 / maxFID) * totalWidth; // 300ms까지는 Needs Improvement
    const poorWidth = (200 / maxFID) * totalWidth; // 300ms 이상은 Poor

    // FID 값에 따른 색상 결정
    const barColor = fidValue
      ? fidValue <= 100
        ? "bg-green-500"
        : fidValue <= 300
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
                {fidValue !== null && fidValue !== undefined ? `${fidValue.toFixed(2)} ms` : "-"}
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
          <span>100ms</span>
          <span>300ms</span>
          <span>500ms</span>
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
      <FIDBarChart />
    </div>
  );
};

export default FidScore;
