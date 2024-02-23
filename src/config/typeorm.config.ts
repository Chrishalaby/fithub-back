import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// export const typeOrmConfig: TypeOrmModuleOptions = {
//   type: 'postgres',
//   host: 'localhost',
//   port: 5432,
//   username: 'postgres',
//   password: '123',
//   database: 'fithub',
//   entities: [__dirname + '/../**/*.entity{.ts,.js}'],
//   synchronize: true,
//   logging: true,
// };
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'fithubc1.postgres.database.azure.com',
  port: 5432,
  username: 'postgres',
  password: 'qvmhEYpJRubJgj5',
  database: 'fithub',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true,
  ssl: {
    rejectUnauthorized: false,
  },
};
