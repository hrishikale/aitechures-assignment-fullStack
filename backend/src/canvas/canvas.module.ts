import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';
import { CanvasState } from '../entities/canvas-state.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CanvasState, User])],
  controllers: [CanvasController],
  providers: [CanvasService],
})
export class CanvasModule {}

