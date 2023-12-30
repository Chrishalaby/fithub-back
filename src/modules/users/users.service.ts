import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AddUserDto } from 'src/dto/AddUser.dto';
import { ClientDto, CreateClientDto } from 'src/dto/client.dto';
import { TrainerDto } from 'src/dto/trainer.dto';
import { Client, GhostClient } from 'src/entites/client.entity';
import { Trainer } from 'src/entites/trainer.entity';
import { Users } from 'src/entites/users.entity';
import { TempStorageService } from 'src/shared/TempStorage.service';
import { Repository } from 'typeorm';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,

    @InjectRepository(GhostClient)
    private ghostClientRepository: Repository<GhostClient>,
    private readonly mailerService: MailerService,
    private readonly tempStorageService: TempStorageService,
  ) {}

  async create(addUserDto: AddUserDto): Promise<void> {
    addUserDto.email = addUserDto.email.toLowerCase();
    const existingUser = await this.usersRepository.findOne({
      where: [{ email: addUserDto.email }, { username: addUserDto.username }],
    });
    if (existingUser) {
      throw new ConflictException('Email or username is already in use');
    }

    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    await this.mailerService.sendMail({
      to: addUserDto.email,
      subject: 'Verify Your Account',
      text: `Your verification code is ${verificationCode}`,
    });

    await this.tempStorageService.storeVerificationCode(
      addUserDto.email,
      verificationCode,
    );
    await this.tempStorageService.storeUserData(addUserDto.email, addUserDto);
  }

  async verifyCodeAndCreateUser(email: string, code: string): Promise<Users> {
    email = email.toLowerCase();

    const storedCode = await this.tempStorageService.getVerificationCode(email);
    const trimmedStoredCode = storedCode?.trim().toLowerCase();
    const trimmedCode = code.trim().toLowerCase();

    if (trimmedStoredCode !== trimmedCode) {
      throw new ConflictException('Verification code is incorrect');
    }

    const userData = await this.tempStorageService.getUserData(email);
    if (!userData) {
      throw new NotFoundException(
        'User data not found or verification code has expired',
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Extract userType from userData
    const { userType, ...userDataWithoutType } = userData;

    const user = this.usersRepository.create({
      ...userDataWithoutType,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);
    await this.tempStorageService.clearVerificationData(email);

    // Determine the type of user and create associated entity
    if (userType === 'trainer') {
      const trainer = new Trainer();
      // Set trainer properties
      // ...

      // Associate the trainer with the user
      trainer.user = user;

      // Save the trainer
      await this.trainerRepository.save(trainer);
    } else if (userType === 'client') {
      const client = new Client();
      // Set client properties
      // ...

      // Associate the client with the user
      client.user = user;

      // Save the client
      await this.clientRepository.save(client);
    }

    return user;
  }

  async findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<Users | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user || null;
  }

  async findOneByUsernameOrEmail(
    identifier: string,
  ): Promise<Users | undefined> {
    const user = await this.usersRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
    });
    return user || undefined;
  }

  async update(id: number, updateUserDto: AddUserDto): Promise<Users> {
    const user = await this.usersRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
  }

  async assignClientToTrainer(
    clientId: number,
    trainerId: number,
  ): Promise<TrainerDto> {
    const trainer = await this.trainerRepository.findOne({
      where: { id: trainerId },
      relations: ['clients', 'user'],
    });
    const client = await this.clientRepository.findOne({
      where: { id: clientId },
    });

    if (!trainer || !client) {
      throw new NotFoundException('Trainer or client not found');
    }

    // Check if the client is already assigned to the trainer to avoid duplicates
    const isAlreadyAssigned = trainer.clients.some(
      (existingClient) => existingClient.id === clientId,
    );
    if (isAlreadyAssigned) {
      // Handle the case where the client is already assigned
      throw new BadRequestException(
        'Client is already assigned to this trainer',
      );
    }

    trainer.clients.push(client);
    await this.trainerRepository.save(trainer);

    const trainerDto: TrainerDto = {
      id: trainer.id,
      user: {
        id: trainer.user.id,
        username: trainer.user.username,
        email: trainer.user.email,
        // Do not include the password field
      },
      clients: trainer.clients.map(
        (client) =>
          ({
            id: client.id,
            user: {
              id: client?.user?.id,
              username: client?.user?.username,
              email: client?.user?.email,
              // Do not include the password field
            },
          }) as ClientDto,
      ),
      // Add any additional trainer-specific properties
    };

    return trainerDto;
  }
  async findTrainerWithClients(trainerId: number): Promise<TrainerDto> {
    const trainer = await this.trainerRepository.findOne({
      where: { id: trainerId },
      relations: ['clients', 'clients.user'],
    });

    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${trainerId} not found`);
    }

    // Transform to TrainerDto, excluding sensitive information
    const trainerDto: TrainerDto = {
      id: trainer.id,
      user: {
        id: trainer.user.id,
        username: trainer.user.username,
        email: trainer.user.email,
        // Do not include the password field
      },
      clients: trainer.clients.map(
        (client) =>
          ({
            id: client.id,
            user: {
              id: client?.user?.id,
              username: client?.user?.username,
              email: client?.user?.email,
              // Do not include the password field
            },
          }) as ClientDto,
      ),
      // Add any additional trainer-specific properties
    };

    return trainerDto;
  }

  async createGhostClient(
    createClientDto: CreateClientDto,
  ): Promise<GhostClient> {
    // Create a new GhostClient instance
    const ghostClient = new GhostClient();
    ghostClient.firstName = createClientDto.firstName;
    ghostClient.lastName = createClientDto.lastName;
    ghostClient.phoneNumber = createClientDto.phoneNumber;

    // Fetch the trainer and associate with the ghost client
    const trainer = await this.trainerRepository.findOne({
      where: { id: createClientDto.trainerId },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }
    ghostClient.trainer = trainer;

    // Save the new ghost client
    return this.ghostClientRepository.save(ghostClient);
  }
}
