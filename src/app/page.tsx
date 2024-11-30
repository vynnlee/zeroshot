"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Timer from "@/components/Timer";
import MetricScore from "@/components/MetricScore";
import ReactionTest from "@/components/ReactionTest";
import Head from "next/head";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_FETCH_URLS = {
  seoultech: "for-s.seoultech.ac.kr",
  interpark: "tickets.interpark.com",
  melon: "ticket.melon.com",
  yes24: "ticket.yes24.com"
};

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

// Add structured data for the page
const pageStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ZeroShot",
  "applicationCategory": "Utility",
  "operatingSystem": "Any",
  "description": "실시간 서버시간 확인, 반응속도 테스트, 웹사이트 성능 분석을 한 번에. 티켓팅과 수강신청을 위한 필수 도구, ZeroShot에서 시작하세요.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "featureList": [
    "실시간 서버시간 확인",
    "반응속도 테스트",
    "웹사이트 성능 분석",
    "티켓팅 도우미",
    "수강신청 도우미"
  ]
};

export default function Page() {
  const [url, setUrl] = useState<string>("");
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [stop, setStop] = useState<boolean>(false);
  const [reactionError, setReactionError] = useState<number>(0);

  // Load cached URL on initial render
  useEffect(() => {
    const cachedUrl = localStorage.getItem('lastUrl');
    if (cachedUrl) {
      setUrl(cachedUrl);
    }
  }, []);

  const handleSubmit = async (inputUrl?: string) => {
    let targetUrl = inputUrl;

    if (!targetUrl) {
      const inputElement = document.getElementById("targetUrl") as HTMLInputElement;
      if (inputElement) {
        targetUrl = inputElement.value.trim();
      }
    }

    if (targetUrl) {
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = `https://${targetUrl}`;
      }

      if (validateUrlWithRegex(targetUrl)) {
        setIsInvalid(false);
        setErrorMessage("");
        setLoading(true);
        setStop(false);

        // Update input field if it exists
        const inputElement = document.getElementById("targetUrl") as HTMLInputElement;
        if (inputElement) {
          inputElement.value = targetUrl;
        }

        setTimeout(() => {
          setUrl(targetUrl!);
          setLoading(false);
        }, 1500);
      } else {
        setIsInvalid(true);
        setErrorMessage("올바른 URL을 입력해주세요.");
      }
    }
  };

  const handleQuickFetch = (site: keyof typeof QUICK_FETCH_URLS) => {
    handleSubmit(QUICK_FETCH_URLS[site]);
  };

  const handleDisconnect = () => {
    setUrl("");
    setStop(true);
    const inputElement = document.getElementById(
      "targetUrl"
    ) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = "";
    }
  };

  const handleErrorApply = (error: number) => {
    setReactionError(error);
  };

  const handleErrorReset = () => {
    setReactionError(0);
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(pageStructuredData) }}
        />
      </Head>

      <div className="flex flex-col w-full mt-8 md:mt-16 mb-16 md:mb-32 items-center">
        <Timer
          serverTimeUrl={url}
          stop={stop}
          onDisconnect={handleDisconnect}
          reactionError={reactionError}
        />

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
              defaultValue={url}
            ></input>
            <Button
              type="submit"
              id="submitUrl"
              variant="secondary"
              className="group h-10 rounded-full flex flex-row gap-1 items-center"
              onClick={() => handleSubmit()}
              disabled={loading}
            >
              {loading ? (
                <>
                  연동 중
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  연동
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

        <div className="w-full max-w-screen-sm mt-8">
          {/* Quick Fetch Buttons */}
          <div className="flex flex-wrap flex-1 flex-row mb-4 gap-2">
            <Button
              variant="outline"
              className="!h-[unset] px-4 !py-1.5 flex flex-row gap-2 items-center rounded-full bg-white border border-neutral-200 hover:bg-neutral-50"
              onClick={() => handleQuickFetch('seoultech')}
            >
              <img height="16" width="16" alt="서울과학기술대학교" src='https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://for-s.seoultech.ac.kr/view/login.jsp&size=16' />
              <p className="text-sm font-medium text-neutral-800">서울과학기술대학교</p>
            </Button>
            <Button
              variant="outline"
              className="!h-unset px-4 !py-1.5 flex flex-row gap-2 items-center rounded-full bg-white border border-neutral-200 hover:bg-neutral-50"
              onClick={() => handleQuickFetch('interpark')}
            >
              <img height="16" width="16" alt="인터파크 티켓" src='https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://tickets.interpark.com/&size=16' />
              <p className="text-sm font-medium text-neutral-800">인터파크 티켓</p>
            </Button>
            <Button
              variant="outline"
              className="!h-unset px-4 !py-1.5 flex flex-row gap-2 items-center rounded-full bg-white border border-neutral-200 hover:bg-neutral-50"
              onClick={() => handleQuickFetch('melon')}
            >
              <img height="16" width="16" alt="멜론 티켓" src='https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ticket.melon.com/main/index.htm&size=16' />
              <p className="text-sm font-medium text-neutral-800">멜론 티켓</p>
            </Button>
            <Button
              variant="outline"
              className="!h-unset px-4 !py-1.5 flex flex-row gap-2 items-center rounded-full bg-white border border-neutral-200 hover:bg-neutral-50"
              onClick={() => handleQuickFetch('yes24')}
            >
              <img height="16" width="16" alt="예스24 티켓" src='https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://ticket.yes24.com/&size=16' />
              <p className="text-sm font-medium text-neutral-800">예스24 티켓</p>
            </Button>
          </div>

          {/* Reaction Test Section - Full Width */}
          <div className="w-full mb-6">
            <ReactionTest
              onErrorApply={handleErrorApply}
              onErrorReset={handleErrorReset}
              isErrorApplied={reactionError !== 0}
            />
          </div>

          {/* Metrics Grid */}
          <div className="chart-wrapper grid grid-cols-1 md:grid-cols-2 gap-6">
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

        {/* Info Card */}
        {url && (
          <Card className="w-full max-w-md mt-8">
            <CardContent className="pt-6">

            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
