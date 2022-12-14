import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UniCommerceInterceptor } from './interceptors/uni-commerce.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalInterceptors(new UniCommerceInterceptor());
  await app.listen(3000);
}
bootstrap();
