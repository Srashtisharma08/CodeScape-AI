import type { VisualizationEvent, VisualizationEventType } from './types';

let eventCounter = 0;

export function resetEventCounter(): void {
  eventCounter = 0;
}

export function createVisualizationEvent(
  type: VisualizationEventType,
  sourceStepId: string,
  lineStart: number,
  lineEnd: number,
  description: string,
  extra: Partial<VisualizationEvent> = {}
): VisualizationEvent {
  eventCounter++;
  const id = `visual-${String(eventCounter).padStart(4, '0')}`;
  return {
    id,
    type,
    sourceStepId,
    lineStart,
    lineEnd,
    description,
    ...extra,
  };
}
