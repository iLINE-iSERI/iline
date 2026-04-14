import { extractYouTubeId } from '@/lib/utils';

interface YouTubePlayerProps {
  videoUrl: string;
  title?: string;
  onProgress?: (seconds: number) => void;
}

export default function YouTubePlayer({
  videoUrl,
  title = 'YouTube Video',
  onProgress,
}: YouTubePlayerProps) {
  // YouTube ID 추출
  const videoId = extractYouTubeId(videoUrl);

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <p className="text-white">유효한 YouTube URL이 아닙니다</p>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
