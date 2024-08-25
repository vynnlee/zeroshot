"use client";

import React, { useState, useEffect } from "react";
import { fetchPageSpeedData } from "@/utils/fetchPageSpeedData";
import { Loader2, Rabbit, Turtle, Snail } from "lucide-react";

const LcpScore: React.FC<{ url: string }> = ({ url }) => {
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
        console.log("Fetched Data:", result); // API 응답을 콘솔에 출력
        setData(result);
      } catch (err) {
        console.error("Error fetching data:", err); // 에러 발생 시 콘솔에 출력
        setError("Failed to fetch data. Please check the URL and try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const processDataForChart = () => {
    if (!data) return { lcpValue: null };

    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;

    // LCP 값을 초 단위로 변환
    const lcpValue = audits["largest-contentful-paint"]?.numericValue / 1000;

    return { lcpValue };
  };

  const { lcpValue } = processDataForChart();

  const getTextColorAndIcon = () => {
    if (lcpValue === null)
      return { color: "text-neutral-500", Icon: null, description: "" };
    if (lcpValue <= 2.5)
      return {
        color: "text-green-500",
        Icon: Rabbit,
        description: "콘텐츠 표시 시간이 매우 빠릅니다.",
      };
    if (lcpValue <= 4)
      return {
        color: "text-yellow-500",
        Icon: Turtle,
        description: "콘텐츠 표시 시간이 보통입니다.",
      };
    return {
      color: "text-red-500",
      Icon: Snail,
      description: "콘텐츠 표시 시간이 느립니다.",
    };
  };

  const { color, Icon, description } = getTextColorAndIcon();

  const LCPBarChart = () => {
    const totalWidth = 100;
    const maxLCP = 4; // 기준을 4초로 설정

    const goodWidth = (2.5 / maxLCP) * totalWidth; // 2.5초까지는 Good
    const needsImprovementWidth = (1.5 / maxLCP) * totalWidth; // 4초까지는 Needs Improvement
    const poorWidth = maxLCP - 4; // 4초 이상은 Poor

    // LCP 값에 따른 색상 결정
    const barColor = lcpValue
      ? lcpValue <= 2.5
        ? "bg-green-500"
        : lcpValue <= 4
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
                {lcpValue !== null ? `${lcpValue.toFixed(2)} s` : "-"}
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
          <span>0s</span>
          <span>2.5s</span>
          <span>4s</span>
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
      <LCPBarChart />
    </div>
  );
};

export default LcpScore;
