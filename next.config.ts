import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 이미지 도메인 허용 (YouTube 썸네일 등)
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
}

export default nextConfig
