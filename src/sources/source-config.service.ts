import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SourceConfigEntity } from './entities/source-config.entity';

export async function loadOrSeedSourceConfig(
  repository: Repository<SourceConfigEntity>,
  sourceNames: readonly string[],
): Promise<SourceConfigEntity[]> {
  const existing = await repository.find();
  const existingNames = new Set(existing.map((row) => row.name));
  const missingNames = sourceNames.filter((name) => !existingNames.has(name));
  const seeded =
    missingNames.length > 0
      ? await repository.save(
          missingNames.map((name) => ({ name, enabled: true })),
        )
      : [];
  return [...existing, ...seeded];
}

@Injectable()
export class SourceConfigService {
  private readonly cached: Map<string, boolean>;

  constructor(
    private readonly repository: Repository<SourceConfigEntity>,
    initialRows: SourceConfigEntity[],
  ) {
    this.cached = new Map(initialRows.map((row) => [row.name, row.enabled]));
  }

  isEnabled(name: string): boolean {
    return this.cached.get(name) ?? true;
  }

  list(): { name: string; enabled: boolean }[] {
    return [...this.cached.entries()].map(([name, enabled]) => ({
      name,
      enabled,
    }));
  }

  async setEnabled(name: string, enabled: boolean): Promise<void> {
    await this.repository.save({ name, enabled });
    this.cached.set(name, enabled);
  }
}
