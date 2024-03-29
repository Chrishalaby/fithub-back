import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { typeOrmConfig } from './config/typeorm.config';
import { OptionsModule } from './modules/Artificial-Inteligence/AI.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TempStorageService } from './shared/TempStorage.service';
import { TrainerProfileModule } from './trainer-profile/trainer-profile.module';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    OptionsModule,
    TypeOrmModule.forRoot(typeOrmConfig),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',

        port: 465,
        secure: true,
        auth: {
          user: 'growtopiay7@gmail.com',
          pass: 'exdiavbasfbeizjs',
        },
      },
      defaults: {
        from: 'No Reply <growtopiay7@gmail.com>',
      },
    }),
    AuthModule,
    TrainerProfileModule,
  ],
  controllers: [],
  providers: [TempStorageService],
})
export class AppModule {}
