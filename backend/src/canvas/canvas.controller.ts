import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { CanvasService } from './canvas.service';

@Controller('canvas')
export class CanvasController {
  constructor(private canvasService: CanvasService) {}

  @Post('save/:userId')
  async saveCanvas(
    @Param('userId') userId: number,
    @Body() body: { canvasData: string },
  ) {
    await this.canvasService.saveCanvasState(userId, body.canvasData);
    return { success: true };
  }

  @Get('load/:userId')
  async loadCanvas(@Param('userId') userId: number) {
    const canvasState = await this.canvasService.getCanvasState(userId);
    return canvasState;
  }
}

