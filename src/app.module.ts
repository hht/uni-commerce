import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from '~/controllers/app.controller';
import { AppService } from '~/services/app.service';
import { UniCommerceController } from '~/controllers/uni-commerce.controller';
import { UniCommerceService } from '~/services/uni-commerce.service';
import { PrismaService } from '~/services/prisma.service';
import { CronService } from '~/services/cron.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '/public'),
      exclude: ['/api*'],
      serveRoot: '/',
    }),
  ],
  controllers: [AppController, UniCommerceController],
  providers: [AppService, CronService, PrismaService, UniCommerceService],
})
export class AppModule {}
