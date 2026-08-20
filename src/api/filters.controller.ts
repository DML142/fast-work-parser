import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { FilterConfigService } from '../filter/filter-config.service';
import { SourceConfigService } from '../sources/source-config.service';
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
    await this.filterConfigService.updateKeywords(body);
    return this.getFilters();
  }

  @Put('sources/:name')
  async updateSource(
    @Param('name') name: string,
    @Body() body: UpdateSourceBody,
  ): Promise<{ name: string; enabled: boolean }> {
    await this.sourceConfigService.setEnabled(name, body.enabled);
    return { name, enabled: body.enabled };
  }
}
