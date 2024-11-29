# Codebase Summary

## Project Structure Overview
```
src/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   └── fetch-server-time/  # Server time fetching endpoint
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page with URL input and metrics
├── components/         # React components
│   ├── ui/            # Shadcn UI components
│   ├── Timer.tsx      # Server time synchronization component
│   └── MetricScore.tsx # Performance metrics visualization
├── lib/               # Utility functions
└── utils/             # Helper functions
    ├── fetchServerTime.ts    # Server time fetching logic
    └── fetchPageSpeedData.ts # Google PageSpeed API integration
```

## Key Components and Their Interactions

### Core Components
1. Timer Component (Timer.tsx)
   - Manages server time synchronization
   - Implements error correction and offset calculation
   - Updates time display at 10ms intervals
   - Tracks and displays synchronization error
   - Supports both server time and UTC fallback

2. Performance Metrics (MetricScore.tsx)
   - Visualizes key performance metrics:
     - TTFB (Time to First Byte)
     - LCP (Largest Contentful Paint)
     - Speed Index
     - FCP (First Contentful Paint)
   - Implements dynamic scoring and visual feedback
   - Uses Google PageSpeed Insights API

### Utility Functions
1. fetchServerTime.ts
   - Makes HEAD requests to target servers
   - Extracts server time from Date header
   - Implements latency compensation
   - Handles error cases and validation

2. fetchPageSpeedData.ts
   - Integrates with Google PageSpeed API
   - Retrieves comprehensive performance metrics
   - Provides detailed site performance analysis

## Data Flow
1. User inputs target URL
2. URL validation and processing
3. Server time fetching sequence:
   - Client sends request to internal API
   - API makes HEAD request to target server
   - Server time extracted from Date header
   - Time synchronization established
4. Continuous updates:
   - Timer updates every 10ms
   - Error tracking every second
   - Performance metrics on demand

## Current Implementation Details

### Time Synchronization
- Uses HEAD requests to minimize server load
- Implements basic latency compensation
- Maintains continuous synchronization
- Tracks synchronization error

### Performance Monitoring
- Comprehensive metrics tracking
- Visual performance indicators
- Real-time performance feedback
- Threshold-based scoring system

### User Interface
- Clean, modern design
- Real-time updates
- Visual feedback for status
- Performance visualization
- Error handling and validation

## Areas for Enhancement
1. Time Synchronization
   - Advanced error correction algorithms
   - Multiple time source support
   - Network latency optimization
   - Precision improvements

2. Performance Features
   - Reaction time calibration system
   - User-specific timing adjustments
   - Advanced synchronization options
   - Historical data tracking

3. User Experience
   - Enhanced error messaging
   - More detailed status information
   - Advanced configuration options
   - Performance optimization tips

## Recent Changes
- Initial project setup
- Basic timer implementation
- Performance metric components
- Server time fetching functionality

## External Dependencies
- Next.js 13+
- React
- Axios for HTTP requests
- Tailwind CSS
- Shadcn UI components
- Google PageSpeed API

## User Feedback Integration
To be implemented based on:
- Synchronization accuracy feedback
- Performance metric usefulness
- User interface improvements
- Feature requests and bug reports
