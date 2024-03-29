import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BundleDto, CreateBundleDto } from 'src/dto/create-bundle.dto';
import { CreateSessionEventDto } from 'src/dto/create-session-event.dto';
import { TrainerProfileDto } from 'src/dto/trainer.dto';
import { Bundle } from 'src/entites/bundle.entity';
import { Client, GhostClient } from 'src/entites/client.entity';
import { SessionEvent } from 'src/entites/session-event.entity';
import { Trainer } from 'src/entites/trainer.entity';
import { Repository } from 'typeorm';
@Injectable()
export class TrainerProfileService {
  constructor(
    @InjectRepository(Trainer)
    private trainerRepository: Repository<Trainer>,

    @InjectRepository(Client)
    private clientRepository: Repository<Client>,

    @InjectRepository(Bundle)
    private bundleRepository: Repository<Bundle>,

    @InjectRepository(GhostClient)
    private ghostClientRepository: Repository<GhostClient>,

    @InjectRepository(SessionEvent)
    private sessionEventRepository: Repository<SessionEvent>,
  ) {}

  async findTrainerByUserId(userId: number): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!trainer) {
      throw new NotFoundException(`Trainer with user ID ${userId} not found`);
    }

    return trainer;
  }

  async updateTrainerProfile(
    userId: number,
    trainerProfileDto: TrainerProfileDto,
  ): Promise<Trainer | null> {
    const trainer = await this.trainerRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!trainer) {
      throw new NotFoundException(`Trainer with user ID ${userId} not found.`);
    }

    const updateData: Partial<Trainer> = {};
    (Object.keys(trainerProfileDto) as Array<keyof TrainerProfileDto>).forEach(
      (key) => {
        if (trainerProfileDto[key] !== undefined) {
          updateData[key] = trainerProfileDto[key];
        }
      },
    );

    if (trainerProfileDto.hasOwnProperty('educationalBackground')) {
      updateData.educationalBackground = JSON.stringify(
        trainerProfileDto.educationalBackground,
      );
    }

    await this.trainerRepository.update(trainer.id, updateData);

    return this.trainerRepository.findOne({
      where: { id: trainer.id },
      relations: ['user'],
    });
  }

  async createBundleForClient(
    createBundleDto: CreateBundleDto,
    userId: number,
  ): Promise<Bundle> {
    const trainerId = await this.getTrainerIdFromUserId(userId);

    let associatedClient;
    if (createBundleDto.isGhost) {
      const ghostClient = await this.ghostClientRepository.findOneOrFail({
        where: { trainer: { id: trainerId }, id: createBundleDto.clientId },
      });

      associatedClient = ghostClient;
    } else {
      const client = await this.clientRepository.findOneOrFail({
        where: { trainers: { id: trainerId }, id: createBundleDto.clientId },
        relations: ['trainers'],
      });

      associatedClient = client;
    }

    if (!associatedClient) {
      throw new Error('Client does not belong to the trainer');
    }

    // Assuming you've added a 'trainer' relation to the Bundle entity as discussed
    let bundle = this.bundleRepository.create({
      ...createBundleDto,
      remainingSessions: createBundleDto.sessionsNumber,
      client: createBundleDto.isGhost ? null : associatedClient,
      ghostClient: createBundleDto.isGhost ? associatedClient : null,
      trainer: { id: trainerId }, // Directly link the bundle to the trainer
    });

    return this.bundleRepository.save(bundle);
  }

  async getTrainerIdFromUserId(userId: number): Promise<number> {
    const trainer = await this.trainerRepository.findOne({
      where: { user: { id: userId } },
      select: ['id'],
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found');
    }

    return trainer.id;
  }

  async getClientsByTrainer(userId: number): Promise<any[]> {
    const trainerId = await this.getTrainerIdFromUserId(userId);

    const trainer = await this.trainerRepository.findOne({
      where: { id: trainerId },
      relations: ['clients', 'ghostClients'],
    });

    if (!trainer) {
      throw new NotFoundException(`Trainer with ID ${trainerId} not found`);
    }

    const combinedClients = [
      ...trainer.clients,
      ...trainer.ghostClients.map((ghost) => ({ ...ghost, isGhost: true })),
    ];

    return combinedClients;
  }

  async createOrUpdateSessionEvent(
    createSessionEventDto: CreateSessionEventDto,
  ): Promise<SessionEvent> {
    const bundle = await this.bundleRepository.findOneOrFail({
      where: { id: createSessionEventDto.sessionsBundleId },
    });

    if (
      !createSessionEventDto.sessionsBundleSessionId &&
      bundle.remainingSessions <= 0
    ) {
      throw new Error('No sessions left in this bundle.');
    }

    let sessionEvent: SessionEvent;

    if (createSessionEventDto.sessionsBundleSessionId) {
      // Fetch and update an existing session event
      sessionEvent = await this.sessionEventRepository.findOneOrFail({
        where: { id: createSessionEventDto.sessionsBundleSessionId },
      });

      sessionEvent.description = createSessionEventDto.description;
      sessionEvent.location = createSessionEventDto.location;
      sessionEvent.startDateTime = createSessionEventDto.startDateTime;
      sessionEvent.endDateTime = createSessionEventDto.endDateTime;
      // Other fields to update...
    } else {
      // Create a new session event
      sessionEvent = this.sessionEventRepository.create({
        ...createSessionEventDto,
        sessionBundle: bundle,
        done: false, // Assuming 'done' is managed elsewhere
      });

      bundle.remainingSessions -= 1;
      await this.bundleRepository.save(bundle);
    }

    // Save the updated or new session event
    await this.sessionEventRepository.save(sessionEvent);

    return sessionEvent;
  }

  async getBundleById(bundleId: number): Promise<BundleDto> {
    const bundle = await this.bundleRepository.findOne({
      where: { id: bundleId },
      relations: ['client', 'ghostClient', 'sessionEvents'],
    });

    if (!bundle) {
      throw new NotFoundException(`Bundle with ID ${bundleId} not found`);
    }

    // Calculate remaining sessions
    const completedSessions = bundle.sessionEvents.filter(
      (session) => session.done,
    ).length;
    const remainingSessions = bundle.sessionsNumber - completedSessions;

    // Map to DTO
    const bundleDto: BundleDto = { ...bundle, remainingSessions };
    return bundleDto;
  }

  async getBundlesByClientAndTrainerId(
    userId: number,
    clientId: number,
    isGhost: boolean,
  ): Promise<BundleDto[]> {
    const trainerId = await this.getTrainerIdFromUserId(userId);

    let bundles;

    if (isGhost) {
      bundles = await this.bundleRepository.find({
        where: {
          ghostClient: { id: clientId },
          trainer: { id: trainerId },
        },
        relations: ['sessionEvents', 'ghostClient'],
      });
    } else {
      bundles = await this.bundleRepository.find({
        where: {
          client: { id: clientId },
          trainer: { id: trainerId },
        },
        relations: ['sessionEvents', 'client'],
      });
    }

    // Map to DTOs, assuming BundleDto includes a property for remainingSessions
    const bundleDtos = bundles.map((bundle) => {
      // Directly use remainingSessions from the Bundle entity
      return {
        ...bundle,
        // Ensure to correctly map or spread the bundle properties as needed for the DTO
        remainingSessions: bundle.remainingSessions,
      };
    });

    return bundleDtos;
  }

  async getEventsByTrainerId(userId: number): Promise<any[]> {
    const trainerId = await this.getTrainerIdFromUserId(userId);

    const sessionEvents = await this.sessionEventRepository
      .createQueryBuilder('sessionEvent')
      .leftJoinAndSelect('sessionEvent.sessionBundle', 'bundle')
      .leftJoinAndSelect('bundle.client', 'client')
      .leftJoinAndSelect('bundle.ghostClient', 'ghostClient')
      .leftJoin('client.trainers', 'trainer')
      .leftJoin('ghostClient.trainer', 'gTrainer')
      .where('trainer.id = :trainerId OR gTrainer.id = :trainerId', {
        trainerId,
      })
      .select([
        'sessionEvent.id AS id',
        'sessionEvent.done AS done',
        'sessionEvent.startDateTime AS startDateTime',
        'sessionEvent.endDateTime AS endDateTime',
        'sessionEvent.description AS description',
        'sessionEvent.location AS location',
        'sessionEvent.sessionBundleId AS sessionBundleId',
        'bundle.sessionsNumber AS sessionsNumber',
        'COALESCE(client.firstName, ghostClient.firstName) AS firstName',
        'COALESCE(client.lastName, ghostClient.lastName) AS lastName',
      ])
      .getRawMany();

    // Transform the raw results to include a single 'clientName' field
    return sessionEvents;
  }

  async uploadProfilePicture(file: Express.Multer.File): Promise<string> {
    const uploadDir = 'uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    const imageUrl = `http://localhost:3000/${uploadDir}/${filename}`;

    return imageUrl;
  }
}
