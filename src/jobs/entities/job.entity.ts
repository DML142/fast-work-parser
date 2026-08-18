import { Column, Entity, PrimaryColumn } from 'typeorm';

export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown';
export type ContractType = 'full-time' | 'contract' | 'unknown';

@Entity('jobs')
export class JobEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  source: string;

  @Column()
  title: string;

  @Column()
  company: string;

  @Column('text')
  description: string;

  @Column('simple-array')
  stack: string[];

  @Column()
  location: string;

  @Column({ type: 'text' })
  remoteType: RemoteType;

  @Column({ type: 'text' })
  contractType: ContractType;

  @Column({ type: 'text', nullable: true })
  compensation: string | null;

  @Column()
  sourceUrl: string;

  @Column({ type: 'datetime', nullable: true })
  postedAt: Date | null;

  @Column({ type: 'datetime' })
  fetchedAt: Date;
}
