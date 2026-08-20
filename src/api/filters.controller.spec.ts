import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FilterConfigService } from '../filter/filter-config.service';
import { SourceConfigService } from '../sources/source-config.service';

function fakeFilterConfigService(
  overrides: Partial<{
    includeKeywords: string[];
    excludeKeywords: string[];
  }> = {},
): { service: FilterConfigService; updateKeywords: jest.Mock } {
  const updateKeywords = jest.fn().mockResolvedValue(undefined);
  const service = {
    includeKeywords: overrides.includeKeywords ?? ['React'],
    excludeKeywords: overrides.excludeKeywords ?? ['US citizen'],
    updateKeywords,
  } as unknown as FilterConfigService;
  return { service, updateKeywords };
}

function fakeSourceConfigService(): {
  service: SourceConfigService;
  setEnabled: jest.Mock;
} {
  const setEnabled = jest.fn().mockResolvedValue(undefined);
  const service = {
    list: () => [{ name: 'RemoteOK', enabled: true }],
    setEnabled,
  } as unknown as SourceConfigService;
  return { service, setEnabled };
}

describe('FiltersController', () => {
  it('returns the current include/exclude keywords and source list', () => {
    const { service: filterConfigService } = fakeFilterConfigService();
    const { service: sourceConfigService } = fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    expect(controller.getFilters()).toEqual({
      includeKeywords: ['React'],
      excludeKeywords: ['US citizen'],
      sources: [{ name: 'RemoteOK', enabled: true }],
    });
  });

  it('writes through updated keywords and returns the refreshed filters', async () => {
    const { service: filterConfigService, updateKeywords } =
      fakeFilterConfigService({
        includeKeywords: ['Rust'],
      });
    const { service: sourceConfigService } = fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    const result = await controller.updateFilters({
      includeKeywords: ['Rust'],
    });

    expect(updateKeywords).toHaveBeenCalledWith({ includeKeywords: ['Rust'] });
    expect(result.includeKeywords).toEqual(['Rust']);
  });

  it('toggles a source and returns its new state', async () => {
    const { service: filterConfigService } = fakeFilterConfigService();
    const { service: sourceConfigService, setEnabled } =
      fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    const result = await controller.updateSource('hh.ru', { enabled: false });

    expect(setEnabled).toHaveBeenCalledWith('hh.ru', false);
    expect(result).toEqual({ name: 'hh.ru', enabled: false });
  });

  it('rejects a non-array includeKeywords without writing it through', async () => {
    const { service: filterConfigService, updateKeywords } =
      fakeFilterConfigService();
    const { service: sourceConfigService } = fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    await expect(
      controller.updateFilters({
        includeKeywords: 'React' as unknown as string[],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateKeywords).not.toHaveBeenCalled();
  });

  it('rejects a non-array excludeKeywords without writing it through', async () => {
    const { service: filterConfigService, updateKeywords } =
      fakeFilterConfigService();
    const { service: sourceConfigService } = fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    await expect(
      controller.updateFilters({
        excludeKeywords: [1, 2] as unknown as string[],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateKeywords).not.toHaveBeenCalled();
  });

  it('rejects an unknown source name without persisting a phantom row', async () => {
    const { service: filterConfigService } = fakeFilterConfigService();
    const { service: sourceConfigService, setEnabled } =
      fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    await expect(
      controller.updateSource('NotARealSource', { enabled: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(setEnabled).not.toHaveBeenCalled();
  });

  it('rejects a non-boolean enabled flag', async () => {
    const { service: filterConfigService } = fakeFilterConfigService();
    const { service: sourceConfigService, setEnabled } =
      fakeSourceConfigService();
    const controller = new FiltersController(
      filterConfigService,
      sourceConfigService,
    );

    await expect(
      controller.updateSource('hh.ru', {
        enabled: 'yes' as unknown as boolean,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(setEnabled).not.toHaveBeenCalled();
  });
});
