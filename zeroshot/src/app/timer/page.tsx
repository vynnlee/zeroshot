"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import PageSpeedData from "@/components/PageSpeedData"

export default function Timer() {
  return (
    <div className="flex flex-col w-full max-w-7xl mt-8">
      
      <div className="flex flex-col items-center gap-2">
        <Badge variant="outline" className="gap-1 tabular-nums slashed-zero">
          2024년 8월 24일
        </Badge>
        <h1 className="font-medium text-7xl text-center tabular-nums slashed-zero">
          17:58:47.990
        </h1>
        <h3 className="font-medium">현재 www.naver.com의 실시간 서버 시간</h3>
      </div> 
      <div className="chart-wrapper mx-auto flex max-w-6xl flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
        <div className="grid w-full gap-6 sm:grid-cols-2 lg:max-w-[22rem] lg:grid-cols-1 xl:max-w-[25rem]">
          <Card className="lg:max-w-md" x-chunk="charts-01-chunk-0">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-4xl tabular-nums">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PageSpeedData/>
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                Testing Component
              </CardDescription>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div>footer</div>
    </div>
  );
}
