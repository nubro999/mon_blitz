"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Zap } from "lucide-react";

const chains = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "from-blue-500 to-cyan-500",
    gradient: "from-blue-500/20 to-cyan-500/20",
    description: "가장 큰 스마트 컨트랙트 플랫폼",
    icon: "⟠",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    color: "from-purple-500 to-pink-500",
    gradient: "from-purple-500/20 to-pink-500/20",
    description: "고성능 블록체인 네트워크",
    icon: "◎",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    color: "from-indigo-500 to-purple-500",
    gradient: "from-indigo-500/20 to-purple-500/20",
    description: "Ethereum의 Layer 2 솔루션",
    icon: "⬟",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    color: "from-cyan-500 to-blue-500",
    gradient: "from-cyan-500/20 to-blue-500/20",
    description: "Ethereum Layer 2 롤업",
    icon: "⟠",
  },
  {
    id: "base",
    name: "Base",
    symbol: "BASE",
    color: "from-orange-500 to-yellow-500",
    gradient: "from-orange-500/20 to-yellow-500/20",
    description: "Coinbase의 Layer 2 네트워크",
    icon: "⬡",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    color: "from-red-500 to-pink-500",
    gradient: "from-red-500/20 to-pink-500/20",
    description: "Ethereum Layer 2 옵티미스틱 롤업",
    icon: "⟠",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function ChainSelection() {
  const router = useRouter();

  const handleChainSelect = (chainId: string) => {
    router.push(`/chain/${chainId}/rooms`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-sm text-slate-300">블록체인 가격 예측 게임</span>
          </motion.div>

          <h1 className="mb-6 text-6xl sm:text-7xl font-bold">
            <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Mon Blitz
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-slate-400 leading-relaxed mb-8">
            실시간 코인 가격을 예측하고 승부하세요
            <br />
            <span className="text-slate-500">다양한 블록체인 네트워크에서 게임에 참여하세요</span>
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>실시간 가격</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>빠른 결제</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>공정한 게임</span>
            </div>
          </div>
        </motion.div>

        {/* Chain Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {chains.map((chain, index) => (
            <motion.button
              key={chain.id}
              variants={itemVariants}
              onClick={() => handleChainSelect(chain.id)}
              className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-8 text-left transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              {/* Gradient overlay on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${chain.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="relative z-10">
                {/* Icon and Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${chain.color} flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-black/30 group-hover:scale-110 transition-transform duration-300`}
                    >
                      {chain.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-white transition-colors">
                        {chain.name}
                      </h3>
                      <p className="text-sm text-slate-400 font-medium group-hover:text-slate-300 transition-colors">
                        {chain.symbol}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ x: 5 }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </motion.div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                  {chain.description}
                </p>

                {/* Bottom accent line */}
                <div className={`mt-6 h-1 w-0 bg-gradient-to-r ${chain.color} group-hover:w-full transition-all duration-500 rounded-full`} />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-slate-500">
            블록체인 네트워크를 선택하여 게임을 시작하세요
          </p>
        </motion.div>
      </div>
    </div>
  );
}
