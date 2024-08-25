"use client";

import React, { useState } from "react";
import Link from "next/link";
import TtfbScore from "@/components/TtfbScore";
import LcpScore from "@/components/LcpScore";
import FidScore from "@/components/FidScore";
import FcpScore from "@/components/FcpScore";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ExternalLink, Loader2 } from "lucide-react"; // loader-circle 가져오기
import { cn } from "@/lib/utils"; // cn 함수 가져오기

// 수정된 정규 표현식을 통한 URL 유효성 검사 함수
const validateUrlWithRegex = (inputUrl: string) => {
  const urlPattern = new RegExp(
    '^((https?:\\/\\/)?' + // 프로토콜 (선택사항)
    '(([a-zA-Z\\d]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}|' + // 도메인 이름
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // IP (v4) 주소 (선택사항)
    '(\\:\\d+)?(\\/[-a-zA-Z\\d%_.~+]*)*' + // 포트 및 경로 (선택사항)
    '(\\?[;&a-zA-Z\\d%_.~+=-]*)?' + // 쿼리 문자열 (선택사항)
    '(\\#[-a-zA-Z\\d_]*)?$' // 프래그먼트 로케이터 (선택사항)
  );
  return !!urlPattern.test(inputUrl);
};

export default function Timer() {
  const [url, setUrl] = useState<string>("");
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // 로딩 상태 관리
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async () => {
    const inputElement = document.getElementById("targetUrl") as HTMLInputElement;
    if (inputElement) {
      let inputUrl = inputElement.value.trim();

      // 프로토콜이 없다면 자동으로 https:// 추가
      if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
        inputUrl = `https://${inputUrl}`;
      }

      // 클라이언트 측에서 정규 표현식을 통한 유효성 검사만 수행
      if (validateUrlWithRegex(inputUrl)) {
        setIsInvalid(false);
        setErrorMessage("");
        setLoading(true); // 로딩 상태 활성화
        // 데이터 가져오기 시뮬레이션 (예: 2초 동안 로딩 상태 유지)
        setTimeout(() => {
          setUrl(inputUrl);
          setLoading(false); // 로딩 상태 비활성화
        }, 1500);
      } else {
        setIsInvalid(true);
        setErrorMessage("Please enter a valid URL.");
      }
    }
  };

  return (
    <div className="flex flex-col w-full mt-8">
      <div className="flex flex-col items-center gap-2">
        <Badge variant="outline" className="gap-1 tabular-nums slashed-zero">
          2024년 8월 24일
        </Badge>
        <h1 className="font-medium text-7xl text-center tabular-nums slashed-zero">
          17:58:47.990
        </h1>
        <div className="flex flex-row gap-2 items-center">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <h3 className="flex flex-row gap-1 font-medium text-sm text-neutral-800">
            <Link
              className="underline underline-offset-2 hover:text-neutral-500 hover:decoration-neutral-500 ease-out duration-200"
              href="https://www.naver.com/"
              target="_blank"
              prefetch={false}
            >
              www.naver.com
            </Link>
            에 연결 되었습니다.
          </h3>
        </div>
        <div className="flex flex-col w-full max-w-md">
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
              disabled={loading} // 로딩 중일 때 버튼 비활성화
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
      </div>
      <div className="chart-wrapper mx-auto flex flex-col flex-wrap items-start justify-center gap-6 p-6 sm:flex-row sm:p-8">
        <div className="grid w-8xl gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="" x-chunk="charts-01-chunk-0">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                First Contentful Paint {`(FCP)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                최초 콘텐츠 표시 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FcpScore url={url} />
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
          <Card className="" x-chunk="charts-01-chunk-0">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                Largest Contentful Paint {`(LCP)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                콘텐츠 표시 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LcpScore url={url} />
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
          
          <Card className="" x-chunk="charts-01-chunk-0">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                First Input Delay {`(FID)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                최초 반응 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FidScore url={url} />
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                <Link
                  className="flex flex-row gap-1 items-center hover:text-neutral-400 ease-out duration-200"
                  href="https://web.dev/articles/fid"
                  target="_blank"
                  prefetch={false}
                >
                  First Input Delay {`(FID)`}가 뭔가요?
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </CardDescription>
            </CardFooter>
          </Card>
          <Card className="" x-chunk="charts-01-chunk-0">
            <CardHeader className="space-y-0 pb-2 gap-1">
              <CardDescription className="text-sm font-semibold text-neutral-900">
                Time to First Byte {`(TTFB)`}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                서버 응답 시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TtfbScore url={url} />
            </CardContent>
            <CardFooter className="flex-col items-start gap-1">
              <CardDescription>
                <Link
                  className="flex flex-row gap-1 items-center hover:text-neutral-400 ease-out duration-200"
                  href="https://web.dev/articles/ttfb"
                  target="_blank"
                  prefetch={false}
                >
                  Time to First Byte{`(TTFB)`}가 뭔가요?
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
