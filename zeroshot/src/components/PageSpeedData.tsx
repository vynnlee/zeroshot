"use client";

import React, { useState } from "react";
import { fetchPageSpeedData } from "@/utils/fetchPageSpeedData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PageSpeedData() {
  const [url, setUrl] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetchData = async () => {
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

  const processDataForChart = () => {
    if (!data) return [];

    // Lighthouse Performance Score (0-100 scale)
    const lighthouseScore =
      data.lighthouseResult.categories.performance.score * 100;

    // Example of other metrics
    const firstContentfulPaint =
      data.lighthouseResult.audits["first-contentful-paint"].numericValue;
    const speedIndex = data.lighthouseResult.audits["speed-index"].numericValue;

    return [
      { name: "Performance", value: lighthouseScore },
      { name: "First Contentful Paint", value: firstContentfulPaint },
      { name: "Speed Index", value: speedIndex },
    ];
  };

  console.log("API Key:", process.env.NEXT_PUBLIC_PAGESPEED_API_KEY);

  return (
    <div className="w-full gap-2">
      <div className="flex flex-row gap-2">
        <Input
          placeholder="Enter website URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full"
        />
        <Button onClick={handleFetchData} disabled={loading || !url}>
        {loading ? "Loading..." : "Fetch Data"}
        </Button>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {data && (
        <div className="mt-8">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processDataForChart()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
