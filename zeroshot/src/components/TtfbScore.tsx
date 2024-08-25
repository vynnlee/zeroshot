"use client";

import React, { useState, useEffect } from "react";
import { fetchPageSpeedData } from "@/utils/fetchPageSpeedData";
import { Loader2, Rabbit, Turtle, Snail } from "lucide-react";

const TtfbScore: React.FC<{ url: string }> = ({ url }) => {
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
    if (!data) return { ttfbValue: null };

    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;

    const ttfbValue = audits["server-response-time"]?.numericValue;

    return { ttfbValue };
  };

  const { ttfbValue } = processDataForChart();

  const getTextColorAndIcon = () => {
    if (ttfbValue === null)
      return { color: "text-neutral-500", Icon: null, description: "" };
    if (ttfbValue <= 800)
      return {
        color: "text-green-500",
        Icon: Rabbit,
        description: "서버 응답 속도가 매우 빠릅니다.",
      };
    if (ttfbValue <= 1800)
      return {
        color: "text-yellow-500",
        Icon: Turtle,
        description: "서버 응답 속도가 보통입니다.",
      };
    return {
      color: "text-red-500",
      Icon: Snail,
      description: "서버 응답 속도가 느립니다.",
    };
  };

  const { color, Icon, description } = getTextColorAndIcon();

  const TTFBBarChart = () => {
    const totalWidth = 100;
    const maxTTFB = 2000;

    const goodWidth = (800 / maxTTFB) * totalWidth;
    const needsImprovementWidth = (1000 / maxTTFB) * totalWidth;
    const poorWidth = (200 / maxTTFB) * totalWidth;

    // TTFB 값에 따른 색상 결정
    const barColor = ttfbValue
      ? ttfbValue <= 800
        ? "bg-green-500"
        : ttfbValue <= 1800
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
                {ttfbValue !== null ? `${ttfbValue.toFixed(2)} ms` : "-"}
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
          <span>800ms</span>
          <span>1800ms</span>
          <span>2000ms</span>
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
      <TTFBBarChart />
    </div>
  );
};

export default TtfbScore;
