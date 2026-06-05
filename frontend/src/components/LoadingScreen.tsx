import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = '正在验证登录状态...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
      {/* Logo动画 */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center font-bold text-3xl text-white shadow-lg shadow-[#10B981]/30 animate-pulse">
          AX
        </div>
        {/* 旋转光环 */}
        <div className="absolute inset-0 -m-2">
          <div className="w-24 h-24 rounded-2xl border-2 border-[#10B981]/30 border-t-[#10B981] animate-spin" />
        </div>
      </div>

      {/* 加载文字 */}
      <p className="text-gray-400 text-sm animate-pulse">{message}</p>

      {/* 进度条 */}
      <div className="mt-6 w-48 h-1 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#10B981] to-[#34D399] animate-[loading_1.5s_ease-in-out_infinite]" 
          style={{
            animation: 'loading 1.5s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
