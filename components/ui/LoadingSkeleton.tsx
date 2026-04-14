export default function LoadingSkeleton() {
  // 로딩 스켈레톤 컴포넌트
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-6xl w-full mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          {/* 헤더 스켈레톤 */}
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          </div>

          {/* 카드 그리드 스켈레톤 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-80"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
