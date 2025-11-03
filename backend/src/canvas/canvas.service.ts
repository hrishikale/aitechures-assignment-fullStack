import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasState } from '../entities/canvas-state.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(CanvasState)
    private canvasStateRepository: Repository<CanvasState>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async saveCanvasState(userId: number, canvasData: string): Promise<CanvasState> {
    let canvasState = await this.canvasStateRepository.findOne({
      where: { userId },
    });

    if (canvasState) {
      canvasState.canvasData = canvasData;
    } else {
      canvasState = this.canvasStateRepository.create({
        userId,
        canvasData,
      });
    }

    return this.canvasStateRepository.save(canvasState);
  }

  async getCanvasState(userId: number): Promise<CanvasState> {
    const canvasState = await this.canvasStateRepository.findOne({
      where: { userId },
    });

    if (!canvasState) {
      // Return empty state if none exists
      return {
        id: 0,
        userId,
        canvasData: JSON.stringify({ images: [], shapes: [] }),
      } as CanvasState;
    }

    return canvasState;
  }
}

