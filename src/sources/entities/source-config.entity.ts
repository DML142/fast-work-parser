import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('source_config')
export class SourceConfigEntity {
  @PrimaryColumn()
  name: string;

  @Column({ default: true })
  enabled: boolean;
}
