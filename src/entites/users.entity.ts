import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Client } from './client.entity';
import { Trainer } from './trainer.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn({
    type: 'integer',
  })
  id: number;

  @Column({
    type: 'text',
  })
  username: string;

  @Column({
    type: 'text',
  })
  email: string;

  @Column('text')
  password: string;

  @OneToOne(() => Trainer, (trainer) => trainer.user)
  trainer: Trainer;

  @OneToOne(() => Client, (client) => client.user, { nullable: true })
  client: Client | null;

  @Column({ type: 'integer', default: 0 })
  aiRequestToken: number;

  @Column({ nullable: true })
  subscriptionId: string;
}
