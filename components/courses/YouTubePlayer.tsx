'use client';

import { useEffect, useRef, useCallback } from 'react';
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
    _ytApiLoaded?: boolean;
    _ytApiCallbacks?: (() => void)[];
  }
}

export default function YouTubePlayer({
  videoUrl,
  title = 'YouTube Video',
  startTime = 0,
  onProgress,
  onEnded,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const videoId = extractYouTubeId(videoUrl);

  // ref로 최신 콜백 유지 (클로저 문제 방지)
  useEffect(() => { onProgressRef.current = onProgress; }, [onProgress]);
  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    stopTracking();
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (p && typeof p.getCurrentTime === 'function') {
        const current = Math.floor(p.getCurrentTime());
        const duration = Math.floor(p.getDuration());
        if (onProgressRef.current && duration > 0) {
          onProgressRef.current(current, duration);
        }
      }
    }, 3000);
  }, [stopTracking]);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const initPlayer = () => {
      if (!containerRef.current) return;

      // 기존 플레이어 제거
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          start: Math.floor(startTime),
        },
        events: {
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === 1) {
              // 재생 중
              startTracking();
            } else if (state === 2) {
              // 일시정지
              stopTracking();
              const p = playerRef.current;
              if (p && onProgressRef.current) {
                onProgressRef.current(
                  Math.floor(p.getCurrentTime()),
                  Math.floor(p.getDuration())
                );
              }
            } else if (state === 0) {
              // 영상 종료
              stopTracking();
              const p = playerRef.current;
              if (p && onProgressRef.current) {
                const dur = Math.floor(p.getDuration());
                onProgressRef.current(dur, dur);
              }
              if (onEndedRef.current) onEndedRef.current();
            }
          },
        },
      });
    };

    // YouTube API 로드
    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!window._ytApiCallbacks) {
        window._ytApiCallbacks = [];
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
        window.onYouTubeIframeAPIReady = () => {
          window._ytApiLoaded = true;
          window._ytApiCallbacks?.forEach(cb => cb());
          window._ytApiCallbacks = [];
        };
      }
      if (window._ytApiLoaded) {
        initPlayer();
      } else {
        window._ytApiCallbacks?.push(initPlayer);
      }
    }

    return () => {
      stopTracking();
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [videoId, startTime]);

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
