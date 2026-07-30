import * as THREE from 'three';
import type { EclipseAudio } from './audio';
import type { EclipseEncounters } from './encounters';
import type { EclipsePlayer, PlayerFrame } from './player';
import type { EclipseSession } from './session';

type Toast = (message: string) => void;

export function collectNearbyResources(scene: THREE.Scene, encounters: EclipseEncounters, frame: PlayerFrame, session: EclipseSession, audio: EclipseAudio, elapsed: number, setToast: Toast) {
  encounters.resources.forEach((resource, index) => {
    if (resource.taken) return;
    resource.mesh.rotation.y += .035;
    resource.mesh.position.y = Math.sin(elapsed * 2 + index) * .18;
    if (resource.mesh.position.distanceTo(frame.position) > 1.5) return;
    resource.taken = true;
    scene.remove(resource.mesh);
    session.flags.add(`resource:${resource.id}`);
    session.addResource(resource.kind);
    audio.play('pickup');
    setToast(resource.kind === 'shard' ? 'Lunar Shard recovered.' : 'Rift Alloy secured.');
  });
}

export function updateMobilityVisuals(encounters: EclipseEncounters, runner: THREE.Group, companion: THREE.Group, frame: PlayerFrame, session: EclipseSession) {
  encounters.hoverbike.visible = !frame.mounted;
  if (frame.mounted) encounters.hoverbike.position.copy(frame.position).add(new THREE.Vector3(0, .05, 0));
  runner.visible = !frame.mounted;
  companion.visible = session.beaconOnline;
  if (companion.visible) companion.position.lerp(new THREE.Vector3(frame.position.x - 1.1, frame.position.y + 1.8, frame.position.z + .7), .06);
  companion.rotation.y += .03;
  encounters.beacon.rotation.y += .004;
}

export function interactionPrompt(encounters: EclipseEncounters, frame: PlayerFrame, session: EclipseSession) {
  if (encounters.beacon.position.distanceTo(frame.position) < 2.9 && !session.beaconOnline) return `Press E to stabilize the Beacon (${session.shards}/6 shards)`;
  if (!frame.mounted && encounters.hoverbike.position.distanceTo(frame.position) < 3.2) return 'Press E to link the hoverbike';
  return null;
}

export function useGrapple(encounters: EclipseEncounters, player: EclipsePlayer, frame: PlayerFrame, audio: EclipseAudio, setToast: Toast) {
  const anchor = [...encounters.anchors].sort((a, b) => a.position.distanceToSquared(frame.position) - b.position.distanceToSquared(frame.position))[0];
  if (anchor && anchor.position.distanceTo(frame.position) < 26) { player.pullToward(anchor.position); audio.play('dash'); setToast('Grapple tether engaged.'); }
  else setToast('No grapple anchor in range.');
}
