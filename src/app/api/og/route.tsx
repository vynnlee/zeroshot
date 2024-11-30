import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get('title') || 'ZeroShot';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #e5e7eb 2px, transparent 0)',
            backgroundSize: '50px 50px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              padding: '40px 80px',
              borderRadius: '20px',
              border: '2px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 60,
                fontStyle: 'normal',
                color: 'black',
                marginBottom: 20,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                textAlign: 'center',
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 30,
                fontStyle: 'normal',
                color: '#4B5563',
                marginTop: 10,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                textAlign: 'center',
              }}
            >
              올클을 위한 간편한 서버시간 알리미
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(`Error generating OG image: ${error.message}`);
    } else {
      console.log('An unknown error occurred while generating OG image');
    }

    return new Response(`Failed to generate the image`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
