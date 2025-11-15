import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '../common/config/config.service';
import { ChainType } from '../common/constants/chain-types';

// Import ABI
import * as OXGameV2ABI from '../../../contract/artifacts/contracts/OXGameV2.sol/OXGameV2.json';

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Provider 설정
      this.provider = new ethers.JsonRpcProvider(
        this.configService.monadRpcUrl,
      );

      // Oracle Wallet 설정
      const privateKey = this.configService.oraclePrivateKey;
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Contract 연결
      const contractAddress = this.configService.oxGameAddress;
      this.contract = new ethers.Contract(
        contractAddress,
        OXGameV2ABI.abi,
        this.wallet,
      );

      this.logger.log(`✅ Blockchain connected`);
      this.logger.log(`📝 Contract: ${contractAddress}`);
      this.logger.log(`🔑 Oracle: ${this.wallet.address}`);

      // Event listeners 시작
      this.startEventListeners();
    } catch (error) {
      this.logger.error('❌ Blockchain connection failed:', error);
    }
  }

  /**
   * processRound 호출 (5초마다)
   */
  async processRound(chainType: ChainType, previousAnswer: boolean) {
    try {
      this.logger.log(
        `📤 Processing round for ${ChainType[chainType]} - Answer: ${previousAnswer ? 'O (UP)' : 'X (DOWN)'}`,
      );

      const tx = await this.contract.processRound(chainType, previousAnswer);
      const receipt = await tx.wait();

      this.logger.log(
        `✅ Round processed - TX: ${receipt.hash.substring(0, 10)}...`,
      );

      return receipt;
    } catch (error) {
      this.logger.error(`❌ processRound failed:`, error.message);
      throw error;
    }
  }

  /**
   * 풀 정보 조회
   */
  async getPoolInfo(chainType: ChainType) {
    try {
      const poolInfo = await this.contract.getPoolInfo(chainType);
      return {
        totalDeposit: ethers.formatEther(poolInfo[0]),
        currentRound: Number(poolInfo[1]),
        lastRoundTime: Number(poolInfo[2]),
        isActive: poolInfo[3],
        activePlayerCount: Number(poolInfo[4]),
        totalPlayerCount: Number(poolInfo[5]),
      };
    } catch (error) {
      this.logger.error(`getPoolInfo failed:`, error.message);
      return null;
    }
  }

  /**
   * Event Listeners
   */
  private startEventListeners() {
    // PlayerJoined 이벤트
    this.contract.on(
      'PlayerJoined',
      (chainType, player, playerCount, event) => {
        this.logger.log(
          `👤 Player joined ${ChainType[Number(chainType)]}: ${player} (Total: ${playerCount})`,
        );
      },
    );

    // RoundStarted 이벤트
    this.contract.on('RoundStarted', (chainType, round, startTime, event) => {
      this.logger.log(
        `🎮 Round started ${ChainType[Number(chainType)]} #${round}`,
      );
    });

    // RoundEnded 이벤트
    this.contract.on(
      'RoundEnded',
      (chainType, round, correctAnswer, survivorCount, event) => {
        this.logger.log(
          `🏁 Round ended ${ChainType[Number(chainType)]} #${round} - Answer: ${correctAnswer ? 'O' : 'X'} - Survivors: ${survivorCount}`,
        );
      },
    );

    // PlayerEliminated 이벤트
    this.contract.on(
      'PlayerEliminated',
      (chainType, player, round, reason, event) => {
        this.logger.log(
          `❌ Player eliminated ${ChainType[Number(chainType)]}: ${player} - Reason: ${reason}`,
        );
      },
    );

    // GameEnded 이벤트
    this.contract.on(
      'GameEnded',
      (chainType, winners, prizePerWinner, event) => {
        this.logger.log(
          `🎉 Game ended ${ChainType[Number(chainType)]} - Winners: ${winners.length} - Prize: ${ethers.formatEther(prizePerWinner)} MON`,
        );
      },
    );

    this.logger.log('👂 Event listeners started');
  }
}
