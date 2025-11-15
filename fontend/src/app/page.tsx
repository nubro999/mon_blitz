"use client";

import { useRouter } from "next/navigation";

const chains = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "bg-blue-500",
    description: "가장 큰 스마트 컨트랙트 플랫폼",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    color: "bg-purple-500",
    description: "고성능 블록체인 네트워크",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    color: "bg-indigo-500",
    description: "Ethereum의 Layer 2 솔루션",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    color: "bg-cyan-500",
    description: "Ethereum Layer 2 롤업",
  },
  {
    id: "base",
    name: "Base",
    symbol: "BASE",
    color: "bg-orange-500",
    description: "Coinbase의 Layer 2 네트워크",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    color: "bg-red-500",
    description: "Ethereum Layer 2 옵티미스틱 롤업",
  },
];

export default function ChainSelection() {
  const router = useRouter();

  const handleChainSelect = (chainId: string) => {
    router.push(`/chain/${chainId}/rooms`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            코인 가격 예측 게임
          </h1>
          <p className="text-slate-300 text-lg">참여할 블록체인을 선택하세요</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainSelect(chain.id)}
              className="group relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 text-left transition-all hover:bg-white/10 hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 flex items-center gap-4">
                <div
                  className={`h-14 w-14 rounded-2xl ${chain.color} flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-black/20`}
                >
                  {chain.symbol[0]}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">
                    {chain.name}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">
                    {chain.symbol}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-slate-300 leading-relaxed">
                {chain.description}
              </p>
              <div className="absolute right-5 top-5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-1">
                <svg
                  className="h-6 w-6 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
