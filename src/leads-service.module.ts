import { Module } from '@nestjs/common';
import { LeadsController } from './leads/leads.controller';
import { LeadsService } from './leads/leads.service';
import { ActivitiesController } from './activities/activities.controller';
import { ActivitiesService } from './activities/activities.service';
import { NotesController } from './notes/notes.controller';
import { NotesService } from './notes/notes.service';
import { AnalyticsController } from './analytics/analytics.controller';
import { AnalyticsService } from './analytics/analytics.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';
import { LeadEntity } from './leads/lead.entity';
import { NoteEntity } from './notes/note.entity';
import { ActivityEntity } from './activities/activity.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    TypeOrmModule.forFeature([LeadEntity, NoteEntity, ActivityEntity]),
  ],
  controllers: [
    LeadsController,
    NotesController,
    ActivitiesController,
    AnalyticsController,
  ],
  providers: [LeadsService, NotesService, ActivitiesService, AnalyticsService],
})
export class LeadsServiceModule {}
