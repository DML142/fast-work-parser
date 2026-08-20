import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { FilterConfigService } from '../filter/filter-config.service';
import { SourceConfigService } from '../sources/source-config.service';
import { SOURCE_NAMES } from '../sources/job-sources.token';
import { TelegramInitDataGuard } from './telegram-init-data.guard';

interface FiltersResponse {
  includeKeywords: string[];
  excludeKeywords: string[];
  sources: { name: string; enabled: boolean }[];
}

interface UpdateFiltersBody {
  includeKeywords?: string[];
  excludeKeywords?: string[];
}

interface UpdateSourceBody {
  enabled: boolean;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

@UseGuards(TelegramInitDataGuard)
@Controller('api')
export class FiltersController {
  constructor(
    private readonly filterConfigService: FilterConfigService,
    private readonly sourceConfigService: SourceConfigService,
  ) {}

  @Get('filters')
  getFilters(): FiltersResponse {
    return {
      includeKeywords: [...this.filterConfigService.includeKeywords],
      excludeKeywords: [...this.filterConfigService.excludeKeywords],
      sources: this.sourceConfigService.list(),
    };
  }

  @Put('filters')
  async updateFilters(
    @Body() body: UpdateFiltersBody,
  ): Promise<FiltersResponse> {
    if (
      body.includeKeywords !== undefined &&
      !isStringArray(body.includeKeywords)
    ) {
      throw new BadRequestException(
        'includeKeywords must be an array of strings',
      );
    }
    if (
      body.excludeKeywords !== undefined &&
      !isStringArray(body.excludeKeywords)
    ) {
      throw new BadRequestException(
        'excludeKeywords must be an array of strings',
      );
    }
    await this.filterConfigService.updateKeywords(body);
    return this.getFilters();
  }

  @Put('sources/:name')
  async updateSource(
    @Param('name') name: string,
    @Body() body: UpdateSourceBody,
  ): Promise<{ name: string; enabled: boolean }> {
    if (!SOURCE_NAMES.includes(name)) {
      throw new NotFoundException(`Unknown source: ${name}`);
    }
    if (typeof body.enabled !== 'boolean') {
      throw new BadRequestException('enabled must be a boolean');
    }
    await this.sourceConfigService.setEnabled(name, body.enabled);
    return { name, enabled: body.enabled };
  }
}
