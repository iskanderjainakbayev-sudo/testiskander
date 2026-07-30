import { createServer } from 'vite';
import { Object3D, Vector3 } from 'three';

const vite = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  const { MissionController } = await vite.ssrLoadModule(
    '/src/lib/odyssey/world/MissionController.ts',
  );
  const { validateCinematicPresets } = await vite.ssrLoadModule(
    '/src/lib/odyssey/cinematics/validateCinematics.ts',
  );
  const { PerformanceMonitor } = await vite.ssrLoadModule(
    '/src/lib/odyssey/world/PerformanceMonitor.ts',
  );
  const { FlightController } = await vite.ssrLoadModule(
    '/src/lib/odyssey/world/FlightController.ts',
  );
  const { LandingController } = await vite.ssrLoadModule(
    '/src/lib/odyssey/world/LandingController.ts',
  );
  const { SurfaceController } = await vite.ssrLoadModule(
    '/src/lib/odyssey/world/SurfaceController.ts',
  );
  const { createTrafficSystem } = await vite.ssrLoadModule(
    '/src/lib/odyssey/space/traffic/createTrafficSystem.ts',
  );
  const { surfaceHeight } = await vite.ssrLoadModule(
    '/src/lib/odyssey/surface/terrainNoise.ts',
  );
  const { nacreHeight } = await vite.ssrLoadModule(
    '/src/lib/odyssey/nacre/nacreNoise.ts',
  );
  const { buildSceneList } = await vite.ssrLoadModule(
    '/src/lib/odyssey/world/CaptureScenes.ts',
  );

  const mission = new MissionController();
  assert(mission.update(2.3, true, 0, 1) === 'solace', 'Solace survey must resolve');
  assert(mission.solaceSurveyed, 'Solace orbital survey flag must persist');
  assert(mission.echoes === 0, 'Orbital survey alone must not recover an echo');
  mission.cycleTarget();
  assert(mission.target === 'solace', 'Solace ground expedition must gate the route');
  mission.completeSolaceExpedition();
  assert(mission.echoes === 1 && mission.target === 'nacre', 'Surface samples must unlock Nacre');
  assert(mission.update(2.3, true, 0, 1) === 'nacre', 'Nacre survey must resolve');
  assert(mission.nacreSurveyed, 'Nacre orbital survey flag must persist');
  mission.cycleTarget();
  assert(mission.target === 'nacre', 'Nacre ground expedition must gate the route');
  mission.completeNacreExpedition();
  assert(mission.echoes === 1 && mission.target === 'veil', 'Nacre must unlock Veil without adding an echo');
  assert(mission.update(2.3, true, 0, 1) === 'veil', 'Veil scan must resolve');
  assert(mission.update(2.3, true, 0, 1) === 'pilgrim', 'Pilgrim scan must resolve');
  assert(mission.echoes === 3 && mission.target === 'atlas', 'Three echoes must unlock Atlas');
  assert(mission.update(2.3, true, 0, 1) === 'atlas', 'Atlas finale must resolve');

  const captureScenes = buildSceneList();
  assert(captureScenes.length === 22, 'QA capture catalog must contain 22 base scenes');
  assert(new Set(captureScenes).size === captureScenes.length, 'QA capture scenes must be unique');
  for (const required of [
    'walk-cockpit', 'flight-atlas', 'discovery-veil',
    'landing-solace', 'surface-nacre', 'takeoff-nacre', 'ending',
  ]) {
    assert(captureScenes.includes(required), `QA capture catalog is missing ${required}`);
  }

  const cinematic = validateCinematicPresets();
  assert(cinematic.valid, `Cinematic rails invalid: ${cinematic.issues.join(', ')}`);
  const monitor = new PerformanceMonitor();
  for (let frame = 0; frame < 1_800; frame += 1) monitor.push(16.62);
  const metrics = monitor.read();
  assert(metrics.averageFps >= 60, 'Synthetic 60 fps trace misreported');
  assert(metrics.p99Milliseconds < 17, 'Synthetic p99 trace misreported');

  for (let x = -420; x <= 420; x += 35) {
    for (let z = -420; z <= 420; z += 35) {
      assert(Number.isFinite(surfaceHeight(x, z)), 'Solace terrain contains a non-finite height');
      assert(Number.isFinite(nacreHeight(x, z)), 'Nacre terrain contains a non-finite height');
    }
  }

  const traffic = createTrafficSystem();
  const shipPosition = new Vector3();
  for (let time = 0; time < 60; time += 0.5) {
    const update = traffic.update(time, shipPosition);
    assert(Number.isFinite(update.nearestShipDistance), 'Traffic distance must remain finite');
  }
  traffic.dispose();
  assert(traffic.group.children.length === 0, 'Traffic disposal must empty its root');

  for (const [planet, height] of [['solace', surfaceHeight], ['nacre', nacreHeight]]) {
    const flight = new FlightController();
    const landing = new LandingController();
    landing.beginLanding(flight, planet);
    let landed = false;
    for (let frame = 0; frame < 480; frame += 1) {
      landed ||= landing.updateLanding(1 / 60, flight);
    }
    assert(landed && flight.position.toArray().every(Number.isFinite), `${planet} landing must finish`);
    landing.beginTakeoff();
    let launched = false;
    for (let frame = 0; frame < 420; frame += 1) {
      launched ||= landing.updateTakeoff(1 / 60, flight);
    }
    assert(launched && flight.position.toArray().every(Number.isFinite), `${planet} takeoff must finish`);
    const sites = [new Object3D(), new Object3D(), new Object3D()];
    const walker = new SurfaceController(height, sites, planet === 'nacre' ? 28 : 45);
    walker.resetExpedition();
    assert(walker.position.toArray().every(Number.isFinite), `${planet} walker spawn must be finite`);
  }

  process.stdout.write(JSON.stringify({
    mission: 'complete',
    cinematicVelocityJump: cinematic.maximumNormalizedVelocityJump,
    syntheticPerformance: metrics,
    traffic: 'finite-and-disposed',
    terrain: 'solace-and-nacre-finite',
    expeditions: 'two-landings-two-takeoffs-finite',
    captures: `${captureScenes.length}-scene-catalog-complete`,
  }, null, 2) + '\n');
} finally {
  await vite.close();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
