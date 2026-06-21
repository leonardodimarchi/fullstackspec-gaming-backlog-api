import type { IgdbExpectedTimes } from './igdb.types';

export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
}

export function mapIgdbTimeToBeatToExpectedTimes(
  timeToBeat: { normally?: number; completely?: number } | null,
): IgdbExpectedTimes {
  if (!timeToBeat) {
    return {};
  }

  return {
    expectedTime:
      timeToBeat.normally !== undefined
        ? secondsToHours(timeToBeat.normally)
        : undefined,
    expectedTimeForAllContent:
      timeToBeat.completely !== undefined
        ? secondsToHours(timeToBeat.completely)
        : undefined,
  };
}
