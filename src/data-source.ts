import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { LeadEntity } from './leads/lead.entity';
import { NoteEntity } from './notes/note.entity';
import { ActivityEntity } from './activities/activity.entity';
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.LEADS_DATABASE_URL,
  entities: [LeadEntity, NoteEntity, ActivityEntity],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
