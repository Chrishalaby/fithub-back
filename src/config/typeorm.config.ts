import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// #### LOCAL DATABASE ####
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '123',
  database: 'fithub',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: true,
};

// export const typeOrmConfig: TypeOrmModuleOptions = {
//   type: 'postgres',
//   host: 'fithub-server.postgres.database.azure.com',
//   port: 5432,
//   username: 'vgbdgadhkp',
//   password: 'CSDPBA0S4RN77207$',
//   database: 'fithub-database',
//   entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//   synchronize: true,
//   // ssl: {
//   //   rejectUnauthorized: false,
//   // },
// };
