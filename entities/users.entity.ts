import { CrudValidationGroups } from '@nestjsx/crud';
import { ApiProperty } from '@nestjsx/crud/lib/crud';
import * as bcrypt from 'bcrypt';
import {
  IsDefined,
  IsEmail,
  IsEmpty,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

const { CREATE, UPDATE } = CrudValidationGroups;
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @IsOptional({ groups: [UPDATE] })
  @IsDefined({ groups: [CREATE] })
  @IsString({ always: true })
  @Column()
  username: string;

  @ApiProperty()
  @IsOptional({ groups: [UPDATE] })
  @IsDefined({ groups: [CREATE] })
  @IsEmail({}, { always: true })
  @Column()
  email: string;

  @ApiProperty()
  @IsOptional({ groups: [UPDATE] })
  @IsDefined({ groups: [CREATE] })
  @IsString({ always: true })
  @Column()
  password: string;

  @ApiProperty()
  @IsOptional({ groups: [UPDATE] })
  @IsDefined({ groups: [CREATE] })
  @IsInt({ always: true })
  @Column()
  userTypeId: number;

  @IsEmpty()
  @Column()
  salt?: string;

  // @ApiProperty()
  // @IsOptional({ groups: [UPDATE] })
  // @IsDefined({ groups: [CREATE] })
  // @IsPhoneNumber(undefined, { always: true })
  // @Column()
  // phoneNumber: string;

  // @OneToOne(() => Employee, (employee) => employee.person)
  // employee: Employee;

  // @ManyToOne(() => Gender, (gender) => gender.person)
  // @JoinColumn()
  // gender: Gender;

  // @ManyToOne(() => Ethnicity, (ethnicity) => ethnicity.person)
  // @JoinColumn()
  // ethnicity: Ethnicity;

  public async validatePassword(password: string): Promise<boolean> {
    const hash: string = await bcrypt.hash(password, <string>this.salt);

    return hash === this.password;
  }
}
