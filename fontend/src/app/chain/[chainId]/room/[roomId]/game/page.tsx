"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { Heart, Star, TrendingDown, TrendingUp, X, Zap } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const chains = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    color: "bg-blue-500",
    tradingViewSymbol: "BINANCE:ETHUSDT",
  },
  solana: {
    name: "Solana",
    symbol: "SOL",
    color: "bg-purple-500",
    tradingViewSymbol: "BINANCE:SOLUSDT",
  },
  polygon: {
    name: "Polygon",
    symbol: "MATIC",
    color: "bg-indigo-500",
    tradingViewSymbol: "BINANCE:MATICUSDT",
  },
  arbitrum: {
    name: "Arbitrum",
    symbol: "ARB",
    color: "bg-cyan-500",
    tradingViewSymbol: "BINANCE:ARBUSDT",
  },
  base: {
    name: "Base",
    symbol: "BASE",
    color: "bg-orange-500",
    tradingViewSymbol: "BINANCE:BTCUSDT",
  },
  optimism: {
    name: "Optimism",
    symbol: "OP",
    color: "bg-red-500",
    tradingViewSymbol: "BINANCE:OPUSDT",
  },
};

interface Player {
  id: string;
  name: string;
  avatar: string;
  bet: "up" | "down" | null;
  isEliminated: boolean;
  deposit: number;
}

// Mock 참가자 데이터 - 4명으로 설정하여 첫 라운드 후 2명이 남도록
const initialPlayers: Player[] = [
  {
    id: "1",
    name: "Player 1",
    avatar: "P1",
    bet: null,
    isEliminated: false,
    deposit: 100,
  },
  {
    id: "2",
    name: "Player 2",
    avatar: "P2",
    bet: null,
    isEliminated: false,
    deposit: 100,
  },
  {
    id: "3",
    name: "Player 3",
    avatar: "P3",
    bet: null,
    isEliminated: false,
    deposit: 100,
  },
  {
    id: "4",
    name: "Player 4",
    avatar: "P4",
    bet: null,
    isEliminated: false,
    deposit: 100,
  },
];

type GameState =
  | "loading"
  | "betting"
  | "result"
  | "elimination"
  | "nextRound"
  | "finalWinner";

const SWIPE_THRESHOLD = 50;
const BETTING_TIME = 5;
const BET_AMOUNT = 100;

export default function GamePage() {
  const router = useRouter();
  const params = useParams();
  const chainId = params.chainId as string;
  const chain = chains[chainId as keyof typeof chains];

  const [gameState, setGameState] = useState<GameState>("loading");
  const [bettingCountdown, setBettingCountdown] = useState(BETTING_TIME);
  const [roundNumber, setRoundNumber] = useState(1);
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [activePlayers, setActivePlayers] = useState<Player[]>(initialPlayers);
  const [userBet, setUserBet] = useState<"up" | "down" | null>(null);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | null>(
    null
  );
  const [currentPrice, setCurrentPrice] = useState<number>(2800);
  const [endPrice, setEndPrice] = useState<number | null>(null);
  const [totalPot, setTotalPot] = useState(0);
  const [tradingViewLoaded, setTradingViewLoaded] = useState(false);
  const tradingViewRef = useRef<HTMLDivElement>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [eliminatedThisRound, setEliminatedThisRound] = useState<Player[]>([]);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -50, 0, 50, 200], [0, 1, 1, 1, 0]);

  const cardRef = useRef<HTMLDivElement>(null);

  // 스와이프 방향 추적
  useMotionValueEvent(x, "change", (latest) => {
    if (latest > 50) {
      setSwipeDirection("right");
    } else if (latest < -50) {
      setSwipeDirection("left");
    } else {
      setSwipeDirection(null);
    }
  });

  // 초기 로딩
  useEffect(() => {
    const timer = setTimeout(() => {
      setGameState("betting");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // TradingView 위젯 로드
  useEffect(() => {
    if (
      (gameState === "loading" || gameState === "betting") &&
      tradingViewRef.current &&
      !tradingViewLoaded
    ) {
      const container = document.createElement("div");
      container.className = "tradingview-widget-container";
      container.style.height = "100%";
      container.style.width = "100%";

      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      widgetContainer.style.height = "calc(100% - 32px)";
      widgetContainer.style.width = "100%";

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      script.async = true;
      script.text = JSON.stringify({
        symbol: chain.tradingViewSymbol,
        width: "100%",
        height: "100%",
        locale: "kr",
        dateRange: "1D",
        colorTheme: "dark",
        isTransparent: true,
        autosize: true,
        largeChartUrl: "",
      });

      container.appendChild(widgetContainer);
      container.appendChild(script);
      tradingViewRef.current.appendChild(container);

      setTimeout(() => {
        setTradingViewLoaded(true);
      }, 0);
    }
  }, [gameState, chain.tradingViewSymbol, tradingViewLoaded]);

  // 베팅 카운트다운
  useEffect(() => {
    if (gameState === "betting" && bettingCountdown > 0) {
      const timer = setTimeout(() => {
        setBettingCountdown(bettingCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "betting" && bettingCountdown === 0) {
      // 5초 후 가격 방향 결정
      setTimeout(() => {
        const direction = Math.random() > 0.5 ? "up" : "down";
        setPriceDirection(direction);

        // 가격 계산 (시뮬레이션)
        const change = direction === "up" ? 0.02 : -0.02;
        setEndPrice(currentPrice * (1 + change));

        // 탈락자 처리
        const eliminated: Player[] = [];
        const remaining: Player[] = [];

        activePlayers.forEach((player) => {
          if (!player.bet || player.bet !== direction) {
            eliminated.push({ ...player, isEliminated: true });
          } else {
            remaining.push(player);
          }
        });

        setEliminatedThisRound(eliminated);
        setActivePlayers(remaining);
        setPlayers((prev) =>
          prev.map((p) => {
            const found = remaining.find((r) => r.id === p.id);
            return found ? found : { ...p, isEliminated: true };
          })
        );
        setGameState("result");
      }, 0);
    }
  }, [gameState, bettingCountdown, activePlayers, currentPrice]);

  // 결과 화면 후 남은 인원 체크
  useEffect(() => {
    if (gameState === "result") {
      const timer = setTimeout(() => {
        // 1명 남으면 최종 승자
        if (activePlayers.length === 1) {
          const totalPotAmount = initialPlayers.length * BET_AMOUNT;
          setTotalPot(totalPotAmount);
          setGameState("finalWinner");
        } else if (activePlayers.length > 1) {
          // 2명 이상 남으면 탈락 표시 후 다음 라운드
          setGameState("elimination");
        } else {
          // 모두 탈락 (예외 처리)
          setGameState("finalWinner");
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState, activePlayers.length]);

  // 탈락 표시 후 다음 라운드
  useEffect(() => {
    if (gameState === "elimination") {
      const timer = setTimeout(() => {
        // 다음 라운드를 위한 가격 업데이트 (이전 라운드의 결정 가격이 새로운 시작 가격)
        if (endPrice !== null) {
          setCurrentPrice(endPrice);
        }

        setRoundNumber(roundNumber + 1);
        setBettingCountdown(BETTING_TIME);
        setUserBet(null);
        setPriceDirection(null);
        setEndPrice(null);
        setEliminatedThisRound([]);
        setActivePlayers((prev) => prev.map((p) => ({ ...p, bet: null })));
        setGameState("betting");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, roundNumber, endPrice]);

  const handleDragEnd = () => {
    const xValue = x.get();

    if (xValue > SWIPE_THRESHOLD) {
      handlePrediction("up");
    } else if (xValue < -SWIPE_THRESHOLD) {
      handlePrediction("down");
    } else {
      x.set(0);
    }
  };

  const handlePrediction = (prediction: "up" | "down") => {
    if (userBet !== null || gameState !== "betting") return;

    setUserBet(prediction);

    // 사용자 베팅 반영
    setActivePlayers((prev) =>
      prev.map((p, idx) => (idx === 0 ? { ...p, bet: prediction } : p))
    );
  };

  const handleBackToRooms = () => {
    router.push(`/chain/${chainId}/rooms`);
  };

  const getPlayerAvatarColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-purple-500 to-purple-600",
      "from-green-500 to-green-600",
      "from-yellow-500 to-yellow-600",
      "from-red-500 to-red-600",
      "from-indigo-500 to-indigo-600",
    ];
    return colors[index % colors.length];
  };

  const getPlayerClassName = (player: Player, index: number) => {
    if (player.isEliminated) {
      return "h-12 w-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 opacity-50 flex items-center justify-center text-white font-bold text-sm shadow-lg relative";
    }
    const baseColor = `bg-gradient-to-r ${getPlayerAvatarColor(index)}`;
    return `h-12 w-12 rounded-full ${baseColor} flex items-center justify-center text-white font-bold text-sm shadow-lg relative`;
  };

  const totalDeposit = players.reduce(
    (sum, p) => sum + (p.isEliminated ? 0 : p.deposit),
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col">
      {/* 헤더 - 체인 정보 & 예치금 */}
      <div className="p-4">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-4 flex-wrap">
          {/* 체인 정보 카드 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div
              className={`h-12 w-12 rounded-xl ${chain.color} flex items-center justify-center text-white font-bold shadow-lg`}
            >
              {chain.symbol[0]}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">체인</p>
              <p className="text-white font-bold text-lg">{chain.name}</p>
            </div>
          </div>

          {/* 예치금 정보 카드 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">총 상금</p>
              <p className="text-white font-bold text-lg">
                $
                {totalPot > 0
                  ? totalPot.toLocaleString()
                  : totalDeposit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* 라운드 정보 */}
          {gameState !== "loading" && gameState !== "finalWinner" && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
              <div>
                <p className="text-slate-400 text-xs font-medium">라운드</p>
                <p className="text-white font-bold text-lg">{roundNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {/* 베팅 시간 카운트다운 - 차트 위에 표시 */}
        {gameState === "betting" && (
          <div className="w-full max-w-md mb-4 text-center">
            <motion.div
              key={bettingCountdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-8xl font-bold text-white mb-2"
            >
              {bettingCountdown}
            </motion.div>
            <p className="text-slate-300 text-xl font-semibold">베팅 시간</p>
          </div>
        )}

        {/* TradingView 차트 - 항상 렌더링, 로딩/베팅 화면에서만 표시 */}
        <div
          className={`w-full max-w-md mb-4 ${
            gameState === "loading" || gameState === "betting"
              ? "block"
              : "hidden"
          }`}
        >
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 h-64 relative shadow-2xl">
            <div ref={tradingViewRef} className="h-full w-full" />
            {!tradingViewLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"
                  />
                  <div className="text-slate-400 text-sm font-medium">차트 로딩 중...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* 로딩 화면 */}
            {gameState === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md text-center"
              >
                {/* 로딩 메시지 */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                />
                <p className="text-white text-xl font-semibold">준비중입니다...</p>
              </motion.div>
            )}

            {/* 베팅 화면 (5초 카운팅) */}
            {gameState === "betting" && (
              <motion.div
                key="betting"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
              >
                {/* 코인 카드 - 스와이프 가능 */}
                <motion.div
                  ref={cardRef}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={handleDragEnd}
                  style={{ x, rotate, opacity }}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl cursor-grab active:cursor-grabbing relative overflow-hidden"
                >
                  {/* 스와이프 힌트 */}
                  {userBet === null && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-slate-400 text-sm mb-2 font-medium">
                          ← 스와이프하여 선택 →
                        </p>
                      </div>
                    </div>
                  )}

                  {/* UP 배경 */}
                  <motion.div
                    className="absolute top-0 right-0 w-32 h-full bg-green-500/20 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: swipeDirection === "right" ? 0.3 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrendingUp className="h-12 w-12 text-green-400" />
                  </motion.div>

                  {/* DOWN 배경 */}
                  <motion.div
                    className="absolute top-0 left-0 w-32 h-full bg-red-500/20 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: swipeDirection === "left" ? 0.3 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrendingDown className="h-12 w-12 text-red-400" />
                  </motion.div>

                  <div className="text-center relative z-10">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                      {chain.name}
                    </h2>
                    <p className="text-slate-400 mb-8 font-medium">{chain.symbol}</p>

                    <div className="text-5xl font-bold text-white mb-6">
                      ${currentPrice.toLocaleString()}
                    </div>

                    {userBet && (
                      <div
                        className={`text-lg font-medium ${
                          userBet === "up" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {userBet === "up" ? "↑ UP" : "↓ DOWN"} 선택됨
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* 하단 버튼들 */}
                {userBet === null && (
                  <div className="flex items-center justify-center gap-5 mt-8">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePrediction("down")}
                      className="h-16 w-16 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shadow-xl shadow-red-500/30 hover:shadow-red-500/40"
                    >
                      <X className="h-7 w-7" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePrediction("up")}
                      className="h-20 w-20 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-green-500/40 hover:shadow-green-500/50"
                    >
                      <Heart className="h-8 w-8" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 hover:shadow-blue-500/40"
                    >
                      <Star className="h-7 w-7" />
                    </motion.button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 결과 화면 */}
            {gameState === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-full max-w-md"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-6xl font-bold mb-4"
                >
                  {priceDirection === "up" ? (
                    <div className="text-green-400">↑ 상승!</div>
                  ) : (
                    <div className="text-red-400">↓ 하락!</div>
                  )}
                </motion.div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    {/* 시작 가격 - 왼쪽 */}
                    <div className="flex-1 text-left">
                      <p className="text-slate-400 text-sm mb-2 font-medium">시작 가격</p>
                      <p className="text-3xl font-bold text-white">
                        ${currentPrice.toLocaleString()}
                      </p>
                    </div>

                    {/* 화살표 */}
                    <div className="mx-6">
                      {priceDirection === "up" ? (
                        <TrendingUp className="h-10 w-10 text-green-400" />
                      ) : (
                        <TrendingDown className="h-10 w-10 text-red-400" />
                      )}
                    </div>

                    {/* 결정 가격 - 오른쪽 */}
                    <div className="flex-1 text-right">
                      <p className="text-slate-400 text-sm mb-2 font-medium">결정 가격</p>
                      <p
                        className={`text-3xl font-bold ${
                          priceDirection === "up"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        ${endPrice?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 font-medium">결과를 확인하는 중...</p>
              </motion.div>
            )}

            {/* 탈락자 표시 */}
            {gameState === "elimination" && (
              <motion.div
                key="elimination"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center w-full max-w-2xl"
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
                  라운드 {roundNumber - 1} 종료
                </h2>
                <p className="text-slate-300 mb-8 text-lg font-medium">
                  {activePlayers.length}명이 다음 라운드로 진출합니다
                </p>

                {eliminatedThisRound.length > 0 && (
                  <div className="mb-8">
                    <p className="text-red-400 text-sm mb-4 font-semibold">탈락한 참가자</p>
                    <div className="grid grid-cols-3 gap-4">
                      {eliminatedThisRound.map((player) => (
                        <motion.div
                          key={player.id}
                          initial={{ scale: 1, opacity: 1 }}
                          animate={{ scale: 0.8, opacity: 0.5 }}
                          className="bg-red-900/30 border border-red-500/30 rounded-2xl p-4 backdrop-blur-xl"
                        >
                          <div className="text-red-400 font-bold mb-2 text-sm">
                            탈락
                          </div>
                          <div className="text-white font-semibold">{player.avatar}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <p className="text-slate-300 text-lg mb-2 font-semibold">
                    다음 라운드 준비 중...
                  </p>
                  <p className="text-slate-400 text-sm">
                    라운드 {roundNumber} 시작
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* 최종 승자 */}
            {gameState === "finalWinner" && (
              <motion.div
                key="finalWinner"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-full max-w-md relative"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>

                <h2 className="text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-6">
                  최종 승자!
                </h2>

                {/* 승자 아바타 */}
                {activePlayers[0] && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={`w-36 h-36 rounded-3xl bg-gradient-to-r ${getPlayerAvatarColor(
                      0
                    )} mx-auto mb-8 flex items-center justify-center text-white text-3xl font-bold shadow-2xl`}
                  >
                    {activePlayers[0].avatar}
                  </motion.div>
                )}

                {/* 금액 애니메이션 */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-7xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-8"
                >
                  +${totalPot.toLocaleString()}
                </motion.div>

                {/* 금액이 모이는 애니메이션 */}
                {players
                  .filter((p) => p.id !== activePlayers[0]?.id)
                  .map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ x: 0, y: 0, opacity: 1 }}
                      animate={{
                        x: 0,
                        y: -300,
                        opacity: 0,
                      }}
                      transition={{ duration: 2, delay: index * 0.1 }}
                      className="absolute text-green-400 font-bold text-2xl"
                      style={{
                        left: `${20 + index * 15}%`,
                        top: "50%",
                      }}
                    >
                      +${BET_AMOUNT}
                    </motion.div>
                  ))}

                <button
                  onClick={handleBackToRooms}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 mt-8"
                >
                  방 목록으로 돌아가기
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 참가자 아바타 영역 */}
      {gameState !== "loading" && gameState !== "finalWinner" && (
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto">
            <p className="text-slate-400 text-sm mb-4 text-center font-medium">
              참가자 현황 ({activePlayers.length}명 남음)
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {players.map((player, index) => {
                const isActive = activePlayers.find((p) => p.id === player.id);
                if (!isActive && player.isEliminated) return null;

                return (
                  <div key={player.id} className="relative">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={getPlayerClassName(player, index)}
                    >
                      {player.avatar}

                      {/* 베팅 방향 표시 */}
                      {isActive && isActive.bet && (
                        <div
                          className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ${
                            isActive.bet === "up"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {isActive.bet === "up" ? (
                            <TrendingUp className="h-3 w-3 text-white" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-white" />
                          )}
                        </div>
                      )}

                      {/* 탈락 표시 */}
                      {player.isEliminated && (
                        <motion.div
                          initial={{ scale: 0, rotate: -10 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            탈락
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
