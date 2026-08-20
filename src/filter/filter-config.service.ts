import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  FilterConfigEntity,
  FILTER_CONFIG_ROW_ID,
} from './entities/filter-config.entity';

export async function loadOrSeedFilterConfig(
  repository: Repository<FilterConfigEntity>,
  defaults: { includeKeywords: readonly string[]; excludeKeywords: readonly string[] },
): Promise<FilterConfigEntity> {
  const existing = await repository.findOneBy({ id: FILTER_CONFIG_ROW_ID });
  if (existing) {
    return existing;
  }
  return repository.save({
    id: FILTER_CONFIG_ROW_ID,
    includeKeywords: [...defaults.includeKeywords],
    excludeKeywords: [...defaults.excludeKeywords],
    lastParsedAt: null,
  });
}

@Injectable()
export class FilterConfigService {
  constructor(
    private readonly repository: Repository<FilterConfigEntity>,
    private cached: FilterConfigEntity,
  ) {}

  get includeKeywords(): readonly string[] {
    return this.cached.includeKeywords;
  }

  get excludeKeywords(): readonly string[] {
    return this.cached.excludeKeywords;
  }

  get lastParsedAt(): Date | null {
    return this.cached.lastParsedAt;
  }

  async updateKeywords(changes: {
    includeKeywords?: string[];
    excludeKeywords?: string[];
  }): Promise<void> {
    this.cached = await this.repository.save({ ...this.cached, ...changes });
  }

  async recordParseRun(): Promise<void> {
    this.cached = await this.repository.save({
      ...this.cached,
      lastParsedAt: new Date(),
    });
  }
}
