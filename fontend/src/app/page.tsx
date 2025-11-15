"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingUp, Zap, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { BrowserProvider, Eip1193Provider } from "ethers";
import Image from "next/image";

// Ethereum window object type
declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

const chains = [
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "from-[#85E6FF] to-[#B9E3F9]",
    gradient: "from-[#85E6FF]/20 to-[#B9E3F9]/20",
    description: "가장 큰 스마트 컨트랙트 플랫폼",
    icon: "⟠",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    color: "from-[#FF8EE4] to-[#FFAE45]",
    gradient: "from-[#FF8EE4]/20 to-[#FFAE45]/20",
    description: "고성능 블록체인 네트워크",
    icon: "◎",
  },
  {
    id: "polygon",
    name: "Polygon",
    symbol: "MATIC",
    color: "from-[#FFAE45] to-[#FF8EE4]",
    gradient: "from-[#FFAE45]/20 to-[#FF8EE4]/20",
    description: "Ethereum의 Layer 2 솔루션",
    icon: "⬟",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    color: "from-[#85E6FF] to-[#B9E3F9]",
    gradient: "from-[#85E6FF]/20 to-[#B9E3F9]/20",
    description: "Ethereum Layer 2 롤업",
    icon: "⟠",
  },
  {
    id: "base",
    name: "Base",
    symbol: "BASE",
    color: "from-[#FFAE45] to-[#FF8EE4]",
    gradient: "from-[#FFAE45]/20 to-[#FF8EE4]/20",
    description: "Coinbase의 Layer 2 네트워크",
    icon: "⬡",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    color: "from-[#FF8EE4] to-[#FFAE45]",
    gradient: "from-[#FF8EE4]/20 to-[#FFAE45]/20",
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
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // Monad 테스트넷 설정
  const MONAD_TESTNET = {
    chainId: "0x279f", // 10143 in hex (CORRECT!)
    chainName: "Monad Testnet",
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: [
      "https://rpc.ankr.com/monad_testnet",  // Ankr RPC (primary)
      "https://rpc-testnet.monadinfra.com",  // Monad Foundation RPC (fallback)
      "https://testnet-rpc.monad.xyz"        // Official RPC (fallback)
    ],
    blockExplorerUrls: ["https://explorer.testnet.monad.xyz"],
  };

  // 네트워크 전환/추가
  const switchToMonadTestnet = async () => {
    if (typeof window.ethereum === "undefined") {
      return false;
    }

    try {
      // 먼저 네트워크 전환 시도
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: MONAD_TESTNET.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // 네트워크가 없으면 추가
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MONAD_TESTNET],
          });
          return true;
        } catch (addError) {
          console.error("❌ Failed to add Monad Testnet:", addError);
          return false;
        }
      }
      console.error("❌ Failed to switch to Monad Testnet:", switchError);
      return false;
    }
  };

  // 지갑 연결
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask를 설치해주세요!");
      return;
    }

    try {
      // 1. 먼저 계정 연결 요청
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // 2. Monad 테스트넷으로 전환
      const switched = await switchToMonadTestnet();
      if (!switched) {
        alert("Monad 테스트넷으로 전환해주세요!");
        return;
      }

      // 3. Provider 생성 및 정보 조회
      const browserProvider = new BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      setWalletAddress(address);

      // 잔액 조회 시도 (실패해도 지갑 연결은 유지)
      try {
        const balanceBigInt = await browserProvider.getBalance(address);
        const balanceInMon = (Number(balanceBigInt) / 1e18).toFixed(4);
        setBalance(balanceInMon);
        console.log("✅ Balance:", balanceInMon, "MON");
      } catch (balanceError) {
        console.warn("⚠️  Could not fetch balance, but wallet is connected");
        setBalance("0.0000"); // 기본값 설정
      }

      console.log("✅ Wallet connected:", address);
      console.log("✅ Network: Monad Testnet");
    } catch (error: any) {
      console.error("❌ Wallet connection failed:", error);
      alert(`지갑 연결 실패: ${error.message || "알 수 없는 오류"}`);
    }
  };

  // 지갑 연결 해제
  const disconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
  };

  // 컴포넌트 마운트 시 지갑 상태 확인
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window.ethereum === "undefined") {
        return;
      }

      try {
        // 이미 연결된 계정이 있는지 확인
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (accounts && accounts.length > 0) {
          // 계정이 연결되어 있으면 정보 업데이트
          const browserProvider = new BrowserProvider(window.ethereum);
          const network = await browserProvider.getNetwork();

          // Monad 테스트넷인지 확인 (Chain ID: 10143)
          if (network.chainId === BigInt(10143)) {
            const signer = await browserProvider.getSigner();
            const address = await signer.getAddress();

            setWalletAddress(address);

            // 잔액 조회 시도
            try {
              const balanceBigInt = await browserProvider.getBalance(address);
              const balanceInMon = (Number(balanceBigInt) / 1e18).toFixed(4);
              setBalance(balanceInMon);
            } catch (balanceError) {
              console.warn("⚠️  Could not fetch balance");
              setBalance("0.0000");
            }

            console.log("✅ Wallet already connected:", address);
          } else {
            console.log("⚠️  Wrong network, please switch to Monad Testnet");
          }
        }
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
      }
    };

    checkWalletConnection();

    // 계정 변경 감지
    if (window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: any) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkWalletConnection();
        }
      });

      // 네트워크 변경 감지
      window.ethereum.on?.("chainChanged", () => {
        checkWalletConnection();
      });
    }
  }, []);

  const handleChainSelect = (chainId: string) => {
    // ETH를 선택하면 deposit 페이지로 이동
    router.push(`/chain/${chainId}/deposit`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E091C] via-[#6E54FF]/20 to-[#000000] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-[#6E54FF]/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Wallet Connection Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-end mb-8"
        >
          {walletAddress ? (
            <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6E54FF]/10 to-[#6E54FF]/10 backdrop-blur-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6E54FF] to-[#6E54FF] flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#DDD7FE]/80 font-medium">연결된 지갑</span>
                  <span className="text-sm text-white font-bold">
                    {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                  </span>
                </div>
              </div>
              {balance && (
                <div className="ml-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-sm text-[#DDD7FE] font-bold">{balance} MON</span>
                </div>
              )}
              <button
                onClick={disconnectWallet}
                className="ml-2 px-4 py-2 rounded-lg bg-[#B9E3F9]/20 hover:bg-[#B9E3F9]/30 border border-[#B9E3F9]/30 hover:border-[#B9E3F9]/50 text-xs text-[#DDD7FE] hover:text-white transition-all duration-200"
              >
                연결 해제
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6E54FF] to-[#6E54FF] hover:from-[#6E54FF]/80 hover:to-[#6E54FF]/80 border border-[#6E54FF]/20 transition-all duration-300 shadow-lg shadow-[#6E54FF]/20 hover:shadow-[#6E54FF]/40"
            >
              <Wallet className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
              <span className="text-sm text-white font-bold">지갑 연결</span>
            </button>
          )}
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-6"
          >
            <Image
              src="/logo.png"
              alt="Mon Blitz Logo"
              width={200}
              height={60}
              className="h-20 w-auto"
            />
          </motion.div>

          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <Sparkles className="h-4 w-4 text-[#6E54FF]" />
            <span className="text-sm text-[#DDD7FE]">블록체인 가격 예측 게임</span>
          </motion.div>

          <h1 className="mb-6 text-6xl sm:text-7xl font-bold">
            <span className="bg-gradient-to-r from-white via-[#DDD7FE] to-[#DDD7FE] bg-clip-text text-transparent">
              Mon Blitz
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-[#DDD7FE]/80 leading-relaxed mb-8">
            실시간 코인 가격을 예측하고 승부하세요
            <br />
            <span className="text-[#DDD7FE]/60">다양한 블록체인 네트워크에서 게임에 참여하세요</span>
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-[#DDD7FE]/60">
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
              className="group relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-8 text-left transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl hover:shadow-[#6E54FF]/20"
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
                      <p className="text-sm text-[#DDD7FE]/80 font-medium group-hover:text-[#DDD7FE] transition-colors">
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
                <p className="text-sm text-[#DDD7FE] leading-relaxed group-hover:text-white transition-colors duration-300">
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
          <p className="text-sm text-[#DDD7FE]/60">
            블록체인 네트워크를 선택하여 게임을 시작하세요
          </p>
        </motion.div>
      </div>
    </div>
  );
}
