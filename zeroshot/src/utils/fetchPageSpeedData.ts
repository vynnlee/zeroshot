import axios from "axios";

export const fetchPageSpeedData = async (url: string): Promise<any> => {
  const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
  const encodedUrl = encodeURIComponent(url);
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&key=${apiKey}&category=performance`;

  try {
    const response = await axios.get(apiUrl);
    console.log("API Response:", response.data); // 전체 API 응답 출력
    return response.data;
  } catch (error) {
    console.error("Error fetching PageSpeed data:", error);
    throw new Error("Failed to fetch PageSpeed data");
  }
};
