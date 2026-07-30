import * as THREE from 'three';
import { CameraBlender } from './CameraBlender';
import { CameraPose } from './CameraPose';
import { DirectorClock } from './DirectorClock';
import { smootherstep } from './easing';
import { CINEMATIC_PRESETS } from './presets';
import { RailComposer } from './RailComposer';
import { createRailPose, sampleRail } from './railMath';
import { ShotTimeline } from './ShotTimeline';
import type { CinematicFrame, CinematicKind, CinematicPlayOptions, CinematicState } from './types';

export class CinematicDirector {
  readonly state: CinematicState = {
    active: false,
    completed: false,
    justCompleted: false,
    skipRequested: false,
    kind: null,
    currentShot: 'idle',
    caption: '',
    progress: 0,
    elapsed: 0,
    duration: 0,
  };
  private readonly clock = new DirectorClock();
  private readonly blender: CameraBlender;
  private readonly railPose = createRailPose();
  private readonly composer = new RailComposer();
  private readonly startPose = new CameraPose();
  private readonly returnPose = new CameraPose();
  private readonly interruptPose = new CameraPose();
  private readonly timeline = new ShotTimeline();
  private preset = CINEMATIC_PRESETS['discovery-flyby'];
  private targetRadius = 22;
  private interruptElapsed = 0;
  private interruptDuration = 0.9;
  private interrupting = false;

  constructor(private readonly camera: THREE.PerspectiveCamera) {
    this.blender = new CameraBlender(camera);
  }

  play(kind: CinematicKind, options: CinematicPlayOptions = {}): CinematicState {
    const preserveReturn = this.state.active;
    this.startPose.capture(this.camera);
    if (!preserveReturn) this.returnPose.capture(this.camera);
    this.preset = CINEMATIC_PRESETS[kind];
    this.targetRadius = Math.max(1, options.targetRadius ?? 22);
    this.clock.reset(this.preset.duration);
    this.timeline.reset(this.preset, options);
    this.interrupting = false;
    Object.assign(this.state, {
      active: true,
      completed: false,
      justCompleted: false,
      skipRequested: false,
      kind,
      currentShot: 'departure',
      caption: '',
      progress: 0,
      elapsed: 0,
      duration: this.preset.duration,
    });
    this.timeline.update(0, this.state);
    return this.state;
  }

  skip(): void {
    if (!this.state.active || this.interrupting) return;
    this.clock.requestSkip();
    this.state.skipRequested = true;
  }

  interrupt(duration = 0.9): void {
    if (!this.state.active) return;
    this.interruptPose.capture(this.camera);
    this.interruptElapsed = 0;
    this.interruptDuration = Math.max(0.35, duration);
    this.interrupting = true;
    this.state.currentShot = 'interrupted';
    this.state.caption = 'FLIGHT CONTROL // CAMERA AUTHORITY RESTORING';
  }

  update(delta: number, frame: CinematicFrame): CinematicState {
    this.state.justCompleted = false;
    if (!this.state.active) return this.state;
    if (this.interrupting) {
      this.updateInterruption(delta);
      return this.state;
    }
    const progress = this.clock.update(delta);
    this.state.progress = progress;
    this.state.elapsed = Math.min(this.clock.elapsed, this.preset.duration);
    this.timeline.update(progress, this.state);
    this.applyTimelinePose(progress, frame);
    if (progress >= 1) this.finish();
    return this.state;
  }

  private applyTimelinePose(progress: number, frame: CinematicFrame): void {
    const { entryEnd, exitStart, rail } = this.preset;
    if (progress < entryEnd) {
      sampleRail(rail, 0, this.railPose);
      this.composer.compose(this.railPose, frame, this.targetRadius);
      this.blender.fromPose(
        this.startPose,
        this.composer.position,
        this.composer.quaternion,
        this.railPose.fov,
        smootherstep(progress / entryEnd),
      );
      return;
    }
    if (progress < exitStart) {
      const railProgress = smootherstep((progress - entryEnd) / (exitStart - entryEnd));
      sampleRail(rail, railProgress, this.railPose);
      this.composer.compose(this.railPose, frame, this.targetRadius);
      this.blender.apply(this.composer.position, this.composer.quaternion, this.railPose.fov);
      return;
    }
    sampleRail(rail, 1, this.railPose);
    this.composer.compose(this.railPose, frame, this.targetRadius);
    this.blender.toPose(
      this.composer.position,
      this.composer.quaternion,
      this.railPose.fov,
      this.returnPose,
      smootherstep((progress - exitStart) / (1 - exitStart)),
    );
  }

  private updateInterruption(delta: number): void {
    this.interruptElapsed += Math.max(0, Math.min(delta, 0.1));
    const alpha = smootherstep(this.interruptElapsed / this.interruptDuration);
    this.blender.between(this.interruptPose, this.returnPose, alpha);
    if (alpha >= 1) this.finish();
  }

  private finish(): void {
    this.returnPose.apply(this.camera);
    this.interrupting = false;
    this.state.active = false;
    this.state.completed = true;
    this.state.justCompleted = true;
    this.state.currentShot = 'complete';
    this.state.caption = '';
    this.state.progress = 1;
  }
}
