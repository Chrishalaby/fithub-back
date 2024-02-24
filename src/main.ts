import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // origin: 'http://localhost:4200', // Angular server
    origin: ['https://fithublb.netlify.app', 'http://localhost:4200'],
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
    credentials: true,
  });
  await app.listen(8080);
}
bootstrap();
