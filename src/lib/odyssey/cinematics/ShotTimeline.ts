import type {
  CinematicPlayOptions,
  CinematicPreset,
  CinematicState,
} from './types';

export class ShotTimeline {
  private readonly captions: string[] = [];
  private markerIndex = -1;
  private preset: CinematicPreset | null = null;

  reset(preset: CinematicPreset, options: CinematicPlayOptions): void {
    this.preset = preset;
    this.markerIndex = -1;
    this.captions.length = preset.shots.length;
    const subject = options.subjectName ?? preset.defaultSubject;
    preset.shots.forEach((marker, index) => {
      const template = options.captions?.[marker.id] ?? marker.caption;
      this.captions[index] = template.replace('{subject}', subject);
    });
  }

  update(progress: number, state: CinematicState): void {
    const preset = this.preset;
    if (!preset) return;
    let nextIndex = 0;
    for (let index = 1; index < preset.shots.length; index += 1) {
      if (preset.shots[index].at > progress) break;
      nextIndex = index;
    }
    if (nextIndex === this.markerIndex) return;
    this.markerIndex = nextIndex;
    state.currentShot = preset.shots[nextIndex].id;
    state.caption = this.captions[nextIndex];
  }
}
