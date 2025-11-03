import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { CanvasState } from './entities/canvas-state.entity';
import { AuthModule } from './auth/auth.module';
import { CanvasModule } from './canvas/canvas.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'canvas_app.db',
      entities: [User, CanvasState],
      synchronize: true,
    }),
    AuthModule,
    CanvasModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

