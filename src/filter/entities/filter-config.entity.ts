import { Column, Entity, PrimaryColumn } from 'typeorm';

// Singleton row: this app has exactly one user, so there is exactly one
// filter config row, always addressed by this fixed id.
export const FILTER_CONFIG_ROW_ID = 'default';

@Entity('filter_config')
export class FilterConfigEntity {
  @PrimaryColumn()
  id: string;

  @Column('simple-array')
  includeKeywords: string[];

  @Column('simple-array')
  excludeKeywords: string[];

  @Column({ type: 'datetime', nullable: true })
  lastParsedAt: Date | null;
}
