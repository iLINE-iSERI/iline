'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { extractYouTubeId } from '@/lib/utils';

interface YouTubePlayerProps {
  videoUrl: string;
  title?: string;
  startTime?: number;
  onProgress?: (seconds: number, duration: number) => void;
  onEnded?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export default function YouTubePlayer({
  videoUrl,
  title = 'YouTube Video',
  startTime = 0,
  onProgress,
  onEnded,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isReady, setIsReady] = useState(false);
  const videoId = extractYouTubeId(videoUrl);

  // 진도 추적 시작/중지
  const startTracking = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        const current = Math.floor(playerRef.current.getCurrentTime());
        const duration = Math.floor(playerRef.current.getDuration());
        if (onProgress && duration > 0) {
          onProgress(current, duration);
        }
      }
    }, 3000);
  }, [onProgress]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // YouTube IFrame API 로드
  useEffect(() => {
    if (!videoId) return;

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        createPlayer();
        return;
      }
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode?.insertBefore(tag, firstScript);
      window.onYouTubeIframeAPIReady = () => { createPlayer(); };
    };

    const createPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          start: Math.floor(startTime),
        },
        events: {
          onReady: () => { setIsReady(true); },
          onStateChange: (event: any) => {
            // 1 = playing, 2 = paused, 0 = ended
            if (event.data === 1) {
              startTracking();
            } else if (event.data === 2) {
              stopTracking();
              // 일시정지 시 현재 위치 저장
              if (playerRef.current && onProgress) {
                const current = Math.floor(playerRef.current.getCurrentTime());
                const duration = Math.floor(playerRef.current.getDuration());
                onProgress(current, duration);
              }
            } else if (event.data === 0) {
              stopTracking();
              // 영상 종료
              if (playerRef.current && onProgress) {
                const duration = Math.floor(playerRef.current.getDuration());
                onProgress(duration, duration);
              }
              if (onEnded) onEnded();
            }
          },
        },
      });
    };

    loadAPI();

    return () => {
      stopTracking();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  // startTime이 변경되면 해당 위치로 이동
  useEffect(() => {
    if (isReady && playerRef.current && startTime > 0) {
      playerRef.current.seekTo(startTime, true);
    }
  }, [isReady, startTime]);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-white">유효한 YouTube URL이 아닙니다</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
