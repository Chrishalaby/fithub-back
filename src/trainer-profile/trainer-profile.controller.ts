import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'src/decorators/user.decorator';
import { BundleDto, CreateBundleDto } from 'src/dto/create-bundle.dto';
import { CreateSessionEventDto } from 'src/dto/create-session-event.dto';
import { TrainerProfileDto } from 'src/dto/trainer.dto';
import { UserDto } from 'src/dto/user.dto';
import { Trainer } from 'src/entites/trainer.entity';
import { JwtAuthGuard } from 'src/modules/auth/local-auth.guard';
import { TrainerProfileService } from './trainer-profile.service';

@UseGuards(JwtAuthGuard)
@Controller('trainer')
export class TrainerProfileController {
  constructor(private trainerProfileService: TrainerProfileService) {}

  @Post('update')
  updateTrainerProfile(
    @User() user: UserDto,
    @Body() trainerProfileDto: TrainerProfileDto,
  ): Promise<Trainer | null> {
    const userId = user.id;
    return this.trainerProfileService.updateTrainerProfile(
      userId,
      trainerProfileDto,
    );
  }

  @Get('show')
  findTrainerProfileWithClients(@User() user: UserDto) {
    return this.trainerProfileService.findTrainerByUserId(user.id);
  }

  @Get('clients')
  getClientsByTrainer(@User() user: UserDto) {
    const userId = user.id;

    return this.trainerProfileService.getClientsByTrainer(userId);
  }

  @Post('create-bundle')
  createBundleForClient(
    @User() user: UserDto,
    @Body() createBundleDto: CreateBundleDto,
  ) {
    const userId = user.id;
    return this.trainerProfileService.createBundleForClient(
      createBundleDto,
      userId,
    );
  }

  @Post('create-event')
  createOrUpdateEvent(@Body() createSessionEventDto: CreateSessionEventDto) {
    return this.trainerProfileService.createOrUpdateSessionEvent(
      createSessionEventDto,
    );
  }

  @Get('bundle:id')
  getBundleById(@Param('id') bundleId: number) {
    return this.trainerProfileService.getBundleById(+bundleId);
  }

  @Get('client-bundle/:clientId')
  async getBundlesByClientId(
    @User() user: UserDto,
    @Param('clientId') clientId: number,
    @Query('isGhost') isGhost: string, // Query parameters are always strings
  ): Promise<BundleDto[]> {
    // Convert isGhost query parameter to a boolean
    const isGhostBoolean = isGhost === 'true';

    const userId = user.id;

    return this.trainerProfileService.getBundlesByClientAndTrainerId(
      userId,
      clientId,
      isGhostBoolean,
    );
  }

  @Get('events')
  async getEventsByUserId(@User() user: UserDto) {
    const userId = user.id;
    return this.trainerProfileService.getEventsByTrainerId(userId);
  }

  @Post('upload-profile-picture')
  @UseInterceptors(FileInterceptor('profilePicture'))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    const imageUrl =
      await this.trainerProfileService.uploadProfilePicture(file);
    return { imageUrl };
  }
}
