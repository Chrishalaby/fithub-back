import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bundle } from './bundle.entity';
import { Client, GhostClient } from './client.entity';
import { Users } from './users.entity';

@Entity()
export class Trainer {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Users, { eager: true })
  @JoinColumn()
  user: Users;

  @ManyToMany(() => Client, (client) => client.trainers)
  @JoinTable()
  clients: Client[];

  @OneToMany(() => GhostClient, (ghostClient) => ghostClient.trainer)
  ghostClients: GhostClient[];

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @OneToMany(() => Bundle, (bundle) => bundle.trainer)
  bundles: Bundle[];

  @Column({ nullable: true, type: 'text' })
  briefBio: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column('simple-array', { nullable: true })
  specialities: string[];

  @Column({ type: 'json', nullable: true })
  educationalBackground: any;

  @Column({ nullable: true })
  educationalLevel: string;

  @Column('simple-array', { nullable: true })
  certifications: string[];

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  tiktok: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  linkedin: string;
}
