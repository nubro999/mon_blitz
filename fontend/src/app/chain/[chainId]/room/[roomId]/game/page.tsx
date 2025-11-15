"use client";

import { faHeartBroken, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "framer-motion";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";
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
  const [isReturning, setIsReturning] = useState(false);
  const [showResultStamp, setShowResultStamp] = useState(false);
  const [userWon, setUserWon] = useState<boolean | null>(null);

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

  // TradingView 위젯 로드 - 컴포넌트 마운트 시 즉시 로드 시작
  useEffect(() => {
    if (
      gameState === "loading" &&
      tradingViewRef.current &&
      !tradingViewLoaded
    ) {
      const refCurrent = tradingViewRef.current;

      // 기존 내용 제거
      refCurrent.innerHTML = "";

      // widgetContainer 생성
      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      widgetContainer.style.height = "100%";
      widgetContainer.style.width = "100%";

      // 스크립트 생성
      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbol: chain.tradingViewSymbol,
        chartOnly: false,
        dateRange: "1D",
        noTimeScale: false,
        colorTheme: "dark",
        isTransparent: true,
        locale: "kr",
        width: "100%",
        autosize: true,
        height: "100%",
      });

      script.onload = () => {
        setTimeout(() => {
          setTradingViewLoaded(true);
        }, 500);
      };
      script.onerror = () => {
        setTradingViewLoaded(true);
      };

      // 중요: widgetContainer를 먼저 추가하고, 그 다음 스크립트를 컨테이너에 직접 추가
      refCurrent.appendChild(widgetContainer);
      refCurrent.appendChild(script); // widgetContainer가 아닌 refCurrent에 추가

      const timeout = setTimeout(() => {
        setTradingViewLoaded(true);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        if (refCurrent && widgetContainer.parentNode === refCurrent) {
          refCurrent.removeChild(widgetContainer);
        }
        if (refCurrent && script.parentNode === refCurrent) {
          refCurrent.removeChild(script);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, chain.tradingViewSymbol]);

  // 차트 로드 완료 시 카운트다운 시작
  useEffect(() => {
    if (gameState === "loading" && tradingViewLoaded) {
      // 차트가 로드 완료되면 즉시 betting 상태로 전환
      setGameState("betting");
    }
  }, [gameState, tradingViewLoaded]);

  // 차트 로딩 타임아웃 - 최대 5초 후에도 로드되지 않으면 강제로 시작
  useEffect(() => {
    if (gameState === "loading") {
      const timer = setTimeout(() => {
        // 타임아웃 시 차트 로드 완료로 표시하고 betting 상태로 전환
        setTradingViewLoaded(true);
        setGameState("betting");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // betting 상태로 전환될 때 차트가 반드시 로드되어 있도록 보장
  useEffect(() => {
    if (
      gameState === "betting" &&
      !tradingViewLoaded &&
      tradingViewRef.current
    ) {
      // betting 상태인데 차트가 로드되지 않았다면 즉시 로드 시작
      const refCurrent = tradingViewRef.current;

      // 기존 내용 제거
      refCurrent.innerHTML = "";

      const widgetContainer = document.createElement("div");
      widgetContainer.className = "tradingview-widget-container__widget";
      widgetContainer.style.height = "100%";
      widgetContainer.style.width = "100%";

      const script = document.createElement("script");
      script.src =
        "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        symbol: chain.tradingViewSymbol,
        chartOnly: false,
        dateRange: "1D",
        noTimeScale: false,
        colorTheme: "dark",
        isTransparent: true,
        locale: "kr",
        width: "100%",
        autosize: true,
        height: "100%",
      });

      script.onload = () => {
        setTimeout(() => {
          setTradingViewLoaded(true);
        }, 500);
      };
      script.onerror = () => {
        setTradingViewLoaded(true);
      };

      refCurrent.appendChild(widgetContainer);
      widgetContainer.appendChild(script);

      const timeout = setTimeout(() => {
        setTradingViewLoaded(true);
      }, 3000);

      return () => {
        clearTimeout(timeout);
        if (refCurrent && widgetContainer.parentNode === refCurrent) {
          refCurrent.removeChild(widgetContainer);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, tradingViewLoaded]);

  // 베팅 화면 시작 시 모든 플레이어가 자동으로 "up" 선택 (mockdata)
  useEffect(() => {
    if (gameState === "betting" && bettingCountdown === BETTING_TIME) {
      // 모든 활성 플레이어가 자동으로 "up" 선택
      setActivePlayers((prev) =>
        prev.map((p) => ({ ...p, bet: "up" as const }))
      );
    }
  }, [gameState, bettingCountdown]);

  // 베팅 카운트다운
  useEffect(() => {
    if (gameState === "betting" && bettingCountdown > 0) {
      const timer = setTimeout(() => {
        setBettingCountdown(bettingCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState === "betting" && bettingCountdown === 0) {
      // 5초 후 가격 방향 결정 (모든 플레이어가 up을 선택하므로 up으로 설정)
      setTimeout(() => {
        const direction = "up"; // 모든 플레이어가 up을 선택하므로 항상 up
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

        // 사용자 승리/패배 확인
        const userPlayer = activePlayers[0];
        const userWonResult = userPlayer?.bet === direction;
        setUserWon(userWonResult);

        setEliminatedThisRound(eliminated);
        setActivePlayers(remaining);
        setPlayers((prev) =>
          prev.map((p) => {
            const found = remaining.find((r) => r.id === p.id);
            return found ? found : { ...p, isEliminated: true };
          })
        );
        setGameState("result");
        setShowResultStamp(true);
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
        setShowResultStamp(false);
        setUserWon(null);
        setActivePlayers((prev) => prev.map((p) => ({ ...p, bet: null })));
        setGameState("betting");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, roundNumber, endPrice]);

  const handleDragEnd = () => {
    const xValue = x.get();

    if (xValue > SWIPE_THRESHOLD && userBet === null) {
      handlePrediction("up");
    } else if (xValue < -SWIPE_THRESHOLD && userBet === null) {
      handlePrediction("down");
    } else {
      // 제자리로 복귀
      x.set(0);
    }
  };

  const handlePrediction = (prediction: "up" | "down") => {
    if (userBet !== null || gameState !== "betting") return;

    setUserBet(prediction);
    setIsReturning(true);

    // 사용자 베팅 반영
    setActivePlayers((prev) =>
      prev.map((p, idx) => (idx === 0 ? { ...p, bet: prediction } : p))
    );

    // 카드를 제자리로 복귀
    setTimeout(() => {
      x.set(0);
      setIsReturning(false);
    }, 300);
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
      return "h-12 w-12 rounded-full bg-linear-to-r from-gray-600 to-gray-700 opacity-50 flex items-center justify-center text-white font-bold text-sm shadow-lg relative";
    }
    const baseColor = `bg-linear-to-r ${getPlayerAvatarColor(index)}`;
    return `h-12 w-12 rounded-full ${baseColor} flex items-center justify-center text-white font-bold text-sm shadow-lg relative`;
  };

  const totalDeposit = players.reduce(
    (sum, p) => sum + (p.isEliminated ? 0 : p.deposit),
    0
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Tinder 스타일 메인 카드 */}
      <div className="w-full max-w-md relative">
        {/* 스와이프 안내 - 카드 바깥 왼쪽/오른쪽 */}
        {gameState === "betting" && userBet === null && (
          <>
            {/* 왼쪽 안내 */}
            <motion.div
              animate={{
                x: [-5, 0, -5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-4 z-10"
            >
              <div className="flex flex-col items-center gap-2 text-slate-500 opacity-50">
                <TrendingDown className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap">
                  slide to down
                </span>
              </div>
            </motion.div>

            {/* 오른쪽 안내 */}
            <motion.div
              animate={{
                x: [5, 0, 5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-4 z-10"
            >
              <div className="flex flex-col items-center gap-2 text-slate-500 opacity-50">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xs font-medium whitespace-nowrap">
                  slide to up
                </span>
              </div>
            </motion.div>
          </>
        )}

        <AnimatePresence mode="wait">
          {/* 로딩 화면 */}
          {gameState === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl text-center h-[90vh] flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-white text-xl font-semibold">
                준비중입니다...
              </p>
            </motion.div>
          )}

          {/* 베팅 화면 - 모든 내용이 하나의 카드에 */}
          {gameState === "betting" && (
            <motion.div
              key="betting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <motion.div
                ref={cardRef}
                drag={userBet === null ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{
                  x: isReturning ? 0 : x,
                  rotate: isReturning ? 0 : rotate,
                  opacity: isReturning ? 1 : opacity,
                }}
                animate={isReturning ? { x: 0, rotate: 0 } : {}}
                transition={
                  isReturning
                    ? { type: "spring", stiffness: 300, damping: 30 }
                    : {}
                }
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl cursor-grab active:cursor-grabbing relative overflow-hidden h-[90vh] flex flex-col"
              >
                {/* 스와이프 방향 힌트 */}
                {userBet === null && (
                  <>
                    {/* UP 배경 */}
                    <motion.div
                      className="absolute top-0 right-0 w-32 h-full bg-green-500/20 flex items-center justify-center z-20"
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: swipeDirection === "right" ? 0.5 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <TrendingUp className="h-16 w-16 text-green-400" />
                    </motion.div>

                    {/* DOWN 배경 */}
                    <motion.div
                      className="absolute top-0 left-0 w-32 h-full bg-red-500/20 flex items-center justify-center z-20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: swipeDirection === "left" ? 0.5 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TrendingDown className="h-16 w-16 text-red-400" />
                    </motion.div>
                  </>
                )}

                {/* 헤더 정보 */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${chain.color} flex items-center justify-center text-white font-bold shadow-lg`}
                    >
                      {chain.symbol[0]}
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs font-medium">체인</p>
                      <p className="text-white font-bold">{chain.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-medium">라운드</p>
                    <p className="text-white font-bold">{roundNumber}</p>
                  </div>
                </div>

                {/* 카운트다운 */}
                <div className="text-center mb-4 relative z-10">
                  <motion.div
                    key={bettingCountdown}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-6xl font-bold text-white mb-1"
                  >
                    {bettingCountdown}
                  </motion.div>
                  <p className="text-slate-300 text-sm font-semibold">
                    베팅 시간
                  </p>
                </div>

                {/* 차트 */}
                <div className="bg-white/5 rounded-2xl p-3 h-48 mb-4 relative z-10">
                  <div
                    ref={tradingViewRef}
                    className="h-full w-full tradingview-widget-container"
                  />
                  {/* betting 상태에서는 로딩 표시하지 않음 - 차트가 반드시 표시되어야 함 */}
                  {!tradingViewLoaded && gameState !== "betting" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"
                        />
                        <div className="text-slate-400 text-xs font-medium">
                          차트 로딩 중...
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 가격 정보 */}
                <div className="text-center mb-4 relative z-10">
                  <h2 className="text-2xl font-bold bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent mb-1">
                    {chain.name}
                  </h2>
                  <p className="text-slate-400 text-sm mb-3">{chain.symbol}</p>
                  <div className="text-4xl font-bold text-white mb-2">
                    ${currentPrice.toLocaleString()}
                  </div>
                </div>

                {/* 참가자 정보 */}
                <div className="relative z-10 mb-2">
                  <p className="text-slate-400 text-xs mb-2 text-center font-medium">
                    참가자 ({activePlayers.length}명)
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {players.map((player, index) => {
                      const isActive = activePlayers.find(
                        (p) => p.id === player.id
                      );
                      if (!isActive && player.isEliminated) return null;

                      return (
                        <div key={player.id} className="relative">
                          <div className={getPlayerClassName(player, index)}>
                            {player.avatar}
                            {isActive && isActive.bet && (
                              <div
                                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center ${
                                  isActive.bet === "up"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              >
                                {isActive.bet === "up" ? (
                                  <TrendingUp className="h-2 w-2 text-white" />
                                ) : (
                                  <TrendingDown className="h-2 w-2 text-white" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 상금 정보 */}
                <div className="mt-4 text-center relative z-10">
                  <div className="flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <p className="text-slate-400 text-xs font-medium">
                      총 상금
                    </p>
                    <p className="text-white font-bold">
                      $
                      {totalPot > 0
                        ? totalPot.toLocaleString()
                        : totalDeposit.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 스와이프 안내 또는 선택된 결과 표시 - 카드 하단 */}
                {userBet === null ? (
                  <div className="mt-auto mb-4 text-center relative z-10">
                    <motion.div
                      animate={{
                        x: [0, 10, 0, -10, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex items-center justify-center gap-3 text-slate-500 opacity-60"
                    >
                      <TrendingDown className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        스와이프하여 선택
                      </span>
                      <TrendingUp className="h-5 w-5" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="mt-auto mb-6 text-center relative z-10">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      className={`flex flex-col items-center gap-3 ${
                        userBet === "up" ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {userBet === "up" ? (
                        <TrendingUp className="h-16 w-16" />
                      ) : (
                        <TrendingDown className="h-16 w-16" />
                      )}
                      <div className="text-4xl font-bold">
                        {userBet === "up" ? "UP" : "DOWN"}
                      </div>
                      <div className="text-lg font-medium opacity-80">
                        선택됨
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* 결과 화면 - 승리/패배 낙인 애니메이션 */}
          {gameState === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-8 py-10 shadow-2xl text-center relative overflow-hidden h-[90vh] flex flex-col"
            >
              {/* 승리/패배 낙인 애니메이션 */}
              {showResultStamp && userWon !== null && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 ${
                    userWon ? "text-green-400" : "text-red-400"
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: 3,
                    }}
                    className={`text-7xl font-black mb-4 ${
                      userWon ? "text-green-400" : "text-red-400"
                    }`}
                    style={{
                      textShadow: userWon
                        ? "0 0 40px rgba(34, 197, 94, 0.8)"
                        : "0 0 40px rgba(239, 68, 68, 0.8)",
                    }}
                  >
                    {userWon ? "승리" : "패배"}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`text-2xl font-bold ${
                      userWon ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    {userWon ? (
                      <FontAwesomeIcon icon={faTrophy} className="h-8 w-8" />
                    ) : (
                      <FontAwesomeIcon
                        icon={faHeartBroken}
                        className="h-8 w-8"
                      />
                    )}
                  </motion.div>
                </motion.div>
              )}

              {/* 가격 방향 표시 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-4xl font-bold mb-4 relative z-10"
              >
                {priceDirection === "up" ? (
                  <div className="text-green-400">↑ 상승!</div>
                ) : (
                  <div className="text-red-400">↓ 하락!</div>
                )}
              </motion.div>

              {/* 가격 정보 */}
              <div className="bg-white/5 rounded-2xl p-6 mb-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <p className="text-slate-400 text-xs mb-2 font-medium">
                      시작 가격
                    </p>
                    <p className="text-2xl font-bold text-white">
                      ${currentPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="mx-4">
                    {priceDirection === "up" ? (
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-400" />
                    )}
                  </div>

                  <div className="flex-1 text-right">
                    <p className="text-slate-400 text-xs mb-2 font-medium">
                      결정 가격
                    </p>
                    <p
                      className={`text-2xl font-bold ${
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

              {/* 참가자 정보 */}
              {showResultStamp && userWon !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative z-10 mb-4"
                >
                  <p className="text-slate-400 text-xs mb-2 text-center font-medium">
                    참가자 ({activePlayers.length}명)
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {players.map((player, index) => {
                      const isActive = activePlayers.find(
                        (p) => p.id === player.id
                      );
                      if (!isActive && player.isEliminated) return null;

                      return (
                        <div key={player.id} className="relative">
                          <div className={getPlayerClassName(player, index)}>
                            {player.avatar}
                            {isActive && isActive.bet && (
                              <div
                                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center ${
                                  isActive.bet === "up"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              >
                                {isActive.bet === "up" ? (
                                  <TrendingUp className="h-2 w-2 text-white" />
                                ) : (
                                  <TrendingDown className="h-2 w-2 text-white" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* 참가자 결과 - 최종 승자 화면과 동일한 스타일 */}
              {showResultStamp && userWon !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mt-auto relative z-10"
                >
                  <p className="text-slate-400 text-xs mb-3 text-center font-medium">
                    참가자 결과 ({players.length}명)
                  </p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    {players.map((player, index) => {
                      const isWinner = activePlayers[0]?.id === player.id;
                      // Survived: activePlayers에 포함되어 있는 경우 (마지막 라운드까지 생존)
                      const isSurvived = activePlayers.some(
                        (p) => p.id === player.id
                      );

                      return (
                        <motion.div
                          key={player.id}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="relative"
                        >
                          <div className={getPlayerClassName(player, index)}>
                            {player.avatar}
                            {/* 승자 표시 - 상단에만 표시 */}
                            {isWinner && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 15,
                                }}
                                className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20"
                              >
                                Winner
                              </motion.div>
                            )}
                          </div>
                          {/* 각 플레이어 상태 표시 - 하단에 Survived/Lost 표시 */}
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 200,
                              damping: 15,
                              delay: 1.0 + index * 0.1,
                            }}
                            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                              isSurvived
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {isSurvived ? "Survived" : "Lost"}
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* 탈락자 표시 */}
          {gameState === "elimination" && (
            <motion.div
              key="elimination"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-center h-[90vh] flex flex-col"
            >
              <h2 className="text-3xl font-bold bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent mb-4">
                라운드 {roundNumber - 1} 종료
              </h2>
              <p className="text-slate-300 mb-6 text-lg font-medium">
                {activePlayers.length}명이 다음 라운드로 진출합니다
              </p>

              {eliminatedThisRound.length > 0 && (
                <div className="mb-6">
                  <p className="text-red-400 text-sm mb-4 font-semibold">
                    탈락한 참가자
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {eliminatedThisRound.map((player) => (
                      <motion.div
                        key={player.id}
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 0.8, opacity: 0.5 }}
                        className="bg-red-900/30 border border-red-500/30 rounded-2xl p-3 backdrop-blur-xl"
                      >
                        <div className="text-red-400 font-bold mb-1 text-xs">
                          탈락
                        </div>
                        <div className="text-white font-semibold text-sm">
                          {player.avatar}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-auto text-center bg-white/5 rounded-2xl p-4"
              >
                <p className="text-slate-300 text-base mb-1 font-semibold">
                  다음 라운드 준비 중...
                </p>
                <p className="text-slate-400 text-xs">
                  라운드 {roundNumber} 시작
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* 최종 승자 */}
          {gameState === "finalWinner" && (
            <motion.div
              key="finalWinner"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-center relative overflow-hidden h-[90vh] flex flex-col"
            >
              {/* 중앙 콘텐츠 */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  <FontAwesomeIcon
                    icon={faTrophy}
                    className="h-16 w-16 text-yellow-400"
                  />
                </motion.div>

                <h2 className="text-4xl font-bold bg-linear-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-6">
                  최종 승자!
                </h2>

                {/* 승자 아바타 */}
                {activePlayers[0] && (
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className={`w-32 h-32 rounded-3xl bg-linear-to-r ${getPlayerAvatarColor(
                      0
                    )} mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold shadow-2xl`}
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
                  className="text-6xl font-bold bg-linear-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"
                >
                  +${totalPot.toLocaleString()}
                </motion.div>
              </div>

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

              {/* 플레이어 아이콘 - 버튼 바로 위에 표시 */}
              <div className="mt-auto relative z-10 mb-10">
                <p className="text-slate-400 text-xs mb-3 text-center font-medium">
                  참가자 결과 ({players.length}명)
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {players.map((player, index) => {
                    const isWinner = activePlayers[0]?.id === player.id;
                    // Survived: activePlayers에 포함되어 있는 경우 (마지막 라운드까지 생존)
                    const isSurvived = activePlayers.some(
                      (p) => p.id === player.id
                    );

                    return (
                      <motion.div
                        key={player.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="relative"
                      >
                        <div className={getPlayerClassName(player, index)}>
                          {player.avatar}
                          {/* 승자 표시 - 상단에만 표시 */}
                          {isWinner && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                              }}
                              className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg z-20"
                            >
                              Winner
                            </motion.div>
                          )}
                        </div>
                        {/* 각 플레이어 상태 표시 - 하단에 Survived/Lost 표시 */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                            delay: 1.2 + index * 0.1,
                          }}
                          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                            isSurvived
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {isSurvived ? "Survived" : "Lost"}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleBackToRooms}
                className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105"
              >
                방 목록으로 돌아가기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
