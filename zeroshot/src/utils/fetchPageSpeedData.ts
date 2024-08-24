import axios from 'axios';

export const fetchPageSpeedData = async (url: string): Promise<any> => {
  const apiKey = process.env.NEXT_PUBLIC_PAGESPEED_API_KEY;
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}`;

  try {
    const response = await axios.get(apiUrl);
    return response.data;
  } catch (error) {
    console.error('Error fetching PageSpeed data:', error);
    throw new Error('Failed to fetch PageSpeed data');
  }
};
