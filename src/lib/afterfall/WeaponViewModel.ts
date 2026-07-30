import * as THREE from 'three';

type Shell = { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number };

export class WeaponViewModel {
  readonly group = new THREE.Group();
  private readonly receiver = new THREE.Group();
  private readonly muzzleFlash: THREE.Mesh;
  private readonly muzzleLight = new THREE.PointLight('#ffd17a', 0, 5, 2);
  private readonly shells: Shell[] = [];
  private recoil = 0;
  private flashFor = 0;
  private reloadProgress = 0;

  constructor() {
    const metal = new THREE.MeshStandardMaterial({ color: '#28312c', roughness: .34, metalness: .83 });
    const darkMetal = new THREE.MeshStandardMaterial({ color: '#101613', roughness: .22, metalness: .92 });
    const wood = new THREE.MeshStandardMaterial({ color: '#684a32', roughness: .72, metalness: .05 });
    const sight = new THREE.MeshStandardMaterial({ color: '#b9b781', emissive: '#918b47', emissiveIntensity: .55, roughness: .28 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(.2, .17, .72), metal);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(.035, .042, .67, 8), darkMetal);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(.24, .2, .5), wood);
    const magazine = new THREE.Mesh(new THREE.BoxGeometry(.12, .3, .15), darkMetal);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(.1, .28, .11), darkMetal);
    const ironSight = new THREE.Mesh(new THREE.BoxGeometry(.035, .07, .04), sight);
    body.position.z = -.23; barrel.rotation.x = Math.PI / 2; barrel.position.z = -.84;
    stock.position.z = .28; magazine.position.set(0, -.21, -.14); grip.position.set(0, -.2, .04); ironSight.position.set(0, .13, -.42);
    this.receiver.add(body, barrel, stock, magazine, grip, ironSight);
    const flashMaterial = new THREE.MeshBasicMaterial({ color: '#fff0ad', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    this.muzzleFlash = new THREE.Mesh(new THREE.SphereGeometry(.14, 9, 7), flashMaterial);
    this.muzzleFlash.position.z = -1.19; this.muzzleFlash.add(this.muzzleLight); this.receiver.add(this.muzzleFlash);
    this.group.add(this.receiver); this.group.position.set(.48, -.45, -.78); this.group.rotation.set(-.1, -.1, 0);
  }

  fire() {
    this.recoil = 1; this.flashFor = .065;
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(.017, .017, .09, 6), new THREE.MeshStandardMaterial({ color: '#b88d45', roughness: .32, metalness: .75 }));
    casing.rotation.z = Math.PI / 2; casing.position.set(.12, .06, -.17); this.group.add(casing);
    this.shells.push({ mesh: casing, velocity: new THREE.Vector3(.9, .95, .25), life: 1.05 });
  }

  setReloadProgress(value: number) { this.reloadProgress = THREE.MathUtils.clamp(value, 0, 1); }
  update(delta: number, moving: boolean, crouching: boolean) {
    this.recoil = Math.max(0, this.recoil - delta * 9); this.flashFor = Math.max(0, this.flashFor - delta);
    const bob = moving ? Math.sin(performance.now() * .009) * .012 : 0;
    this.group.position.set(.48, crouching ? -.55 : -.45 + bob, -.78 + this.recoil * .15);
    this.group.rotation.set(-.1 - this.recoil * .22, -.1, Math.sin(performance.now() * .006) * .008);
    this.receiver.rotation.z = this.reloadProgress ? Math.sin(this.reloadProgress * Math.PI) * .42 : 0;
    const material = this.muzzleFlash.material as THREE.MeshBasicMaterial;
    material.opacity = this.flashFor > 0 ? this.flashFor / .065 : 0;
    this.muzzleFlash.scale.setScalar(1 + this.flashFor * 7); this.muzzleLight.intensity = this.flashFor > 0 ? 3.8 : 0;
    for (const shell of this.shells) { shell.life -= delta; shell.velocity.y -= delta * 2.8; shell.mesh.position.addScaledVector(shell.velocity, delta); shell.mesh.rotation.x += delta * 18; shell.mesh.rotation.z += delta * 15; }
    const expired = this.shells.filter((shell) => shell.life <= 0); expired.forEach((shell) => this.group.remove(shell.mesh)); this.shells.splice(0, this.shells.length, ...this.shells.filter((shell) => shell.life > 0));
  }

  dispose() { this.group.traverse((node) => { if (node instanceof THREE.Mesh) { node.geometry.dispose(); const material = node.material; if (Array.isArray(material)) material.forEach((entry) => entry.dispose()); else material.dispose(); } }); }
}
