"use client";

import React, { useState } from "react";
import Link from "next/link";
import Timer from "@/components/Timer";
import MetricScore from "@/components/MetricScore";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const validateUrlWithRegex = (inputUrl: string) => {
  const urlPattern = new RegExp(
    "^((https?:\\/\\/)?" +
      "(([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*" +
      "(\\?[;&a-zA-Z\\d%_.~+=-]*)?" +
      "(\\#[-a-zA-Z\\d_]*)?$"
  );
  return !!urlPattern.test(inputUrl);
};

export default function Page() {
  const [url, setUrl] = useState<string>("");
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [stop, setStop] = useState<boolean>(false);

  const handleSubmit = async () => {
    const inputElement = document.getElementById(
      "targetUrl"
    ) as HTMLInputElement;
    if (inputElement) {
      let inputUrl = inputElement.value.trim();

      if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
        inputUrl = `https://${inputUrl}`;
      }

      if (validateUrlWithRegex(inputUrl)) {
        setIsInvalid(false);
        setErrorMessage("");
        setLoading(true);
        setStop(false);
        setTimeout(() => {
          setUrl(inputUrl);
          setLoading(false);
        }, 1500);
      } else {
        setIsInvalid(true);
        setErrorMessage("Please enter a valid URL.");
      }
    }
  };

  return (
    <div className="flex flex-col w-full mt-16 md:mt-32 mb-16 md:mb-32 px-4 items-center">
      <Timer serverTimeUrl={url} stop={stop} />

      <div className="flex flex-col w-full max-w-md mt-4">
        <div
          className={cn(
            "flex flex-row bg-white border rounded-full p-1 transition-transform",
            {
              "border-red-500 animate-shake": isInvalid,
            }
          )}
        >
          <label className="sr-only" htmlFor="targetUrl">
            주소{`(URL)`} 입력
          </label>
          <input
            type="url"
            id="targetUrl"
            placeholder="여기에 주소를 입력해주세요"
            className={cn(
              "w-full ml-4 text-sm resize-none border-0 bg-transparent leading-relaxed shadow-none outline-none ring-0",
              {
                "text-red-500": isInvalid,
              }
            )}
          ></input>
          <Button
            type="submit"
            id="submitUrl"
            variant="secondary"
            className="group h-10 rounded-full flex flex-row gap-1 items-center"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                Fetch
                <Loader2 className="h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                Fetch
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-100 ease-out" />
              </>
            )}
          </Button>
        </div>
        {isInvalid && (
          <label className="text-red-500 text-sm mt-2" htmlFor="targetUrl">
            {errorMessage}
          </label>
        )}
      </div>

      <div className="chart-wrapper w-full flex flex-col flex-wrap items-center justify-center gap-6 p-0 md:p-6 sm:flex-row sm:p-8 mt-4">
        <div className="grid w-8xl gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="w-full">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                First Contentful Paint {`(FCP)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                최초 콘텐츠 표시 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MetricScore url={url} type="FCP" />
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                <Link
                  className="flex flex-row gap-1 items-center hover:text-neutral-400 ease-out duration-200"
                  href="https://web.dev/articles/fcp"
                  target="_blank"
                  prefetch={false}
                >
                  First Contentful Paint {`(FCP)`}가 뭔가요?
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardDescription>
            </CardFooter>
          </Card>
          <Card className="w-full">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                Largest Contentful Paint {`(LCP)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                콘텐츠 표시 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MetricScore url={url} type="LCP" />
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                <Link
                  className="flex flex-row gap-1 items-center hover:text-neutral-400 ease-out duration-200"
                  href="https://web.dev/articles/lcp"
                  target="_blank"
                  prefetch={false}
                >
                  Largest Contentful Paint {`(LCP)`}가 뭔가요?
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardDescription>
            </CardFooter>
          </Card>
        </div>
        <div className="grid w-8xl gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="w-full">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                Speed Index
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                페이지 로딩 속도
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MetricScore url={url} type="SpeedIndex" />
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                <Link
                  className="flex flex-row gap-1 items-center hover:text-neutral-400 ease-out duration-200"
                  href="https://developer.chrome.com/docs/lighthouse/performance/speed-index/"
                  target="_blank"
                  prefetch={false}
                >
                  Speed Index가 뭔가요?
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardDescription>
            </CardFooter>
          </Card>
          <Card className="w-full">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                Time to First Byte {`(TTFB)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                서버 응답 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MetricScore url={url} type="TTFB" />
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                <Link
                  className="flex flex-row gap-1 items-center hover:text-neutral-400 ease-out duration-200"
                  href="https://web.dev/articles/ttfb"
                  target="_blank"
                  prefetch={false}
                >
                  Time to First Byte {`(TTFB)`}가 뭔가요?
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardDescription>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
