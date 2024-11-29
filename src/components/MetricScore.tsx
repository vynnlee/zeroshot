"use client";

import React, { useState, useEffect } from "react";
import { fetchPageSpeedData } from "@/utils/fetchPageSpeedData";
import { Loader2, Rabbit, Turtle, Snail } from "lucide-react";

type MetricType = "TTFB" | "LCP" | "SpeedIndex" | "FCP";

const MetricScore: React.FC<{ url: string; type: MetricType }> = ({ url, type }) => {
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
        setError("정보 제공 불가");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  const processDataForChart = () => {
    if (!data) return { value: null };

    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult.audits;

    switch (type) {
      case "TTFB":
        return { value: audits["server-response-time"]?.numericValue };
      case "LCP":
        return { value: audits["largest-contentful-paint"]?.numericValue / 1000 }; // seconds
      case "SpeedIndex":
        return { value: audits["speed-index"]?.numericValue };
      case "FCP":
        return { value: audits["first-contentful-paint"]?.numericValue };
      default:
        return { value: null };
    }
  };

  const { value } = processDataForChart();

  const getTextColorAndIcon = () => {
    if (value === null)
      return { color: "text-neutral-500", Icon: null, description: "" };

    switch (type) {
      case "TTFB":
        if (value <= 800)
          return { color: "text-green-500", Icon: Rabbit, description: "서버 응답 속도가 매우 빠릅니다." };
        if (value <= 1800)
          return { color: "text-yellow-500", Icon: Turtle, description: "서버 응답 속도가 보통입니다." };
        return { color: "text-red-500", Icon: Snail, description: "서버 응답 속도가 느립니다." };
      case "LCP":
        if (value <= 2.5)
          return { color: "text-green-500", Icon: Rabbit, description: "콘텐츠 표시 시간이 매우 빠릅니다." };
        if (value <= 4)
          return { color: "text-yellow-500", Icon: Turtle, description: "콘텐츠 표시 시간이 보통입니다." };
        return { color: "text-red-500", Icon: Snail, description: "콘텐츠 표시 시간이 느립니다." };
      case "SpeedIndex":
        if (value <= 3400)
          return { color: "text-green-500", Icon: Rabbit, description: "페이지 로딩 속도가 매우 빠릅니다." };
        if (value <= 5800)
          return { color: "text-yellow-500", Icon: Turtle, description: "페이지 로딩 속도가 보통입니다." };
        return { color: "text-red-500", Icon: Snail, description: "페이지 로딩 속도가 느립니다." };
      case "FCP":
        if (value <= 1000)
          return { color: "text-green-500", Icon: Rabbit, description: "최초 콘텐츠 표시 시간이 매우 빠릅니다." };
        if (value <= 2500)
          return { color: "text-yellow-500", Icon: Turtle, description: "최초 콘텐츠 표시 시간이 보통입니다." };
        return { color: "text-red-500", Icon: Snail, description: "최초 콘텐츠 표시 시간이 느립니다." };
      default:
        return { color: "text-neutral-500", Icon: null, description: "" };
    }
  };

  const { color, Icon, description } = getTextColorAndIcon();

  const getBarColor = () => {
    if (value === null) return "bg-neutral-200";
    switch (type) {
      case "TTFB":
        if (value <= 800) return "bg-green-500";
        if (value <= 1800) return "bg-yellow-500";
        return "bg-red-500";
      case "LCP":
        if (value <= 2.5) return "bg-green-500";
        if (value <= 4) return "bg-yellow-500";
        return "bg-red-500";
      case "SpeedIndex":
        if (value <= 3400) return "bg-green-500";
        if (value <= 5800) return "bg-yellow-500";
        return "bg-red-500";
      case "FCP":
        if (value <= 1000) return "bg-green-500";
        if (value <= 2500) return "bg-yellow-500";
        return "bg-red-500";
      default:
        return "bg-neutral-200";
    }
  };

  const getBarWidth = () => {
    if (value === null) return "0%";
    switch (type) {
      case "TTFB":
        return `${Math.min((value / 2000) * 100, 100)}%`;
      case "LCP":
        return `${Math.min((value / 4) * 100, 100)}%`;
      case "SpeedIndex":
        return `${Math.min((value / 7000) * 100, 100)}%`;
      case "FCP":
        return `${Math.min((value / 4000) * 100, 100)}%`;
      default:
        return "0%";
    }
  };

  const getMeasureText = () => {
    switch (type) {
      case "TTFB":
        return "ms";
      case "LCP":
        return "s";
      case "SpeedIndex":
        return "ms";
      case "FCP":
        return "ms";
      default:
        return "ms";
    }
  };

  const getRanges = () => {
    switch (type) {
      case "TTFB":
        return ["0ms", "800ms", "1800ms", "2000ms"];
      case "LCP":
        return ["0s", "2.5s", "4s"];
      case "SpeedIndex":
        return ["0ms", "3400ms", "5800ms", "7000ms"];
      case "FCP":
        return ["0ms", "1000ms", "2500ms", "4000ms"];
      default:
        return [];
    }
  };

  const BarChart = () => {
    return (
      <div>
        <div className="mb-2 flex items-center">
          {loading ? (
            <Loader2 className="animate-spin text-neutral-500" size={32} />
          ) : (
            <>
              <span className={`text-3xl font-semibold tabular-nums slashed-zero ${color}`}>
                {value !== null ? `${value.toFixed(2)} ${getMeasureText()}` : "-"}
              </span>
            </>
          )}
        </div>
        <div className="relative w-full h-1 rounded-full overflow-hidden bg-neutral-200">
          <div
            className={`h-full rounded-full ${getBarColor()} ${
              loading ? "opacity-50" : ""
            }`}
            style={{
              width: getBarWidth(),
              transition: "width 1s ease-in-out",
            }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-neutral-800 tabular-nums slashed-zero">
          {getRanges().map((range, index) => (
            <span key={index}>{range}</span>
          ))}
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
      <BarChart />
    </div>
  );
};

export default MetricScore;
