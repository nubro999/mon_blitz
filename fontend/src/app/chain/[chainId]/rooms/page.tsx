'use client';

import { useRouter, useParams } from 'next/navigation';
import { Users, Plus, Clock } from 'lucide-react';

const chains = {
  ethereum: { name: 'Ethereum', symbol: 'ETH', color: 'bg-blue-500' },
  solana: { name: 'Solana', symbol: 'SOL', color: 'bg-purple-500' },
  polygon: { name: 'Polygon', symbol: 'MATIC', color: 'bg-indigo-500' },
  arbitrum: { name: 'Arbitrum', symbol: 'ARB', color: 'bg-cyan-500' },
  base: { name: 'Base', symbol: 'BASE', color: 'bg-orange-500' },
  optimism: { name: 'Optimism', symbol: 'OP', color: 'bg-red-500' },
};

// Mock data - 실제로는 API나 상태관리에서 가져와야 함
const rooms = [
  { id: '1', name: '빠른 매치 #1', players: 3, maxPlayers: 10, status: 'waiting' },
  { id: '2', name: '전문가 방', players: 7, maxPlayers: 10, status: 'waiting' },
  { id: '3', name: '초보 환영', players: 5, maxPlayers: 10, status: 'waiting' },
  { id: '4', name: '하이 리스크', players: 2, maxPlayers: 10, status: 'waiting' },
  { id: '5', name: '게임 진행중', players: 10, maxPlayers: 10, status: 'playing' },
  { id: '6', name: '새로운 방', players: 1, maxPlayers: 10, status: 'waiting' },
];

export default function RoomList() {
  const router = useRouter();
  const params = useParams();
  const chainId = params.chainId as string;
  const chain = chains[chainId as keyof typeof chains];

  const handleJoinRoom = (roomId: string) => {
    router.push(`/chain/${chainId}/room/${roomId}/waiting`);
  };

  const handleCreateRoom = () => {
    const newRoomId = Date.now().toString();
    router.push(`/chain/${chainId}/room/${newRoomId}/waiting`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-green-500';
      case 'playing': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return '대기중';
      case 'playing': return '게임중';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-5xl">
        {/* 헤더 */}
        <div className="mb-10">
          <button
            onClick={() => router.back()}
            className="mb-6 text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
          >
            <svg className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            체인 선택으로 돌아가기
          </button>
          <div className="flex items-center gap-5 mb-8">
            <div className={`h-20 w-20 rounded-2xl ${chain.color} flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-black/30`}>
              {chain.symbol[0]}
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                {chain.name} 게임방
              </h1>
              <p className="text-slate-300 text-lg">
                최대 10명의 플레이어와 함께 가격을 예측하세요
              </p>
            </div>
          </div>

          {/* 방 생성 버튼 */}
          <button
            onClick={handleCreateRoom}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            새 방 만들기
          </button>
        </div>

        {/* 방 목록 */}
        <div className="grid gap-5">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-2xl hover:shadow-purple-500/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-semibold text-white">
                      {room.name}
                    </h3>
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(room.status)} shadow-lg`} />
                    <span className="text-sm text-slate-400 font-medium">
                      {getStatusText(room.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="font-medium">{room.players}/{room.maxPlayers}</span>
                    </div>
                    {room.status === 'waiting' && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        <span>대기중</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* 참가자 아바타들 */}
                  <div className="flex -space-x-2">
                    {Array.from({ length: Math.min(room.players, 5) }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-slate-800 shadow-lg"
                      />
                    ))}
                    {room.players > 5 && (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-slate-600 to-slate-700 border-2 border-slate-800 flex items-center justify-center text-xs text-white font-semibold shadow-lg">
                        +{room.players - 5}
                      </div>
                    )}
                  </div>

                  {/* 참가 버튼 */}
                  {room.status === 'waiting' && room.players < room.maxPlayers && (
                    <button
                      onClick={() => handleJoinRoom(room.id)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-7 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:scale-105"
                    >
                      참가하기
                    </button>
                  )}

                  {room.status === 'playing' && (
                    <button
                      disabled
                      className="bg-slate-700/50 text-slate-500 px-7 py-3 rounded-xl font-semibold cursor-not-allowed border border-slate-600/50"
                    >
                      게임중
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {rooms.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-4">
              <Users className="h-20 w-20 mx-auto mb-6 opacity-50" />
              <p className="text-xl mb-2">아직 생성된 방이 없습니다</p>
              <p className="text-slate-500">첫 번째 방을 만들어 보세요!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
