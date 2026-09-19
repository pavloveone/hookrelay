import { CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

export class Basic {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
