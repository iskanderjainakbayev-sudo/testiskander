import * as THREE from "three";
import type { Mission, Weather } from "./levels";

export class Atmosphere {
  private readonly rain: THREE.Points;
  private readonly rainMaterial = new THREE.PointsMaterial({ color: 0xb7e8ff, size: 0.08, transparent: true, opacity: 0.65 });
  private readonly rainPositions = new Float32Array(360);
  private readonly sparkles: THREE.Points;
  private readonly sparkleMaterial = new THREE.PointsMaterial({ color: 0xfff8bf, size: 0.09, transparent: true, opacity: 0.82, depthWrite: false });
  private readonly sparklePositions = new Float32Array(300);
  private readonly sun = new THREE.DirectionalLight(0xc7eaff, 1.5);
  private weather: Weather = "clear";

  constructor(private readonly scene: THREE.Scene) {
    for (let index = 0; index < this.rainPositions.length; index += 3) {
      this.rainPositions[index] = (Math.random() - 0.5) * 90;
      this.rainPositions[index + 1] = Math.random() * 26;
      this.rainPositions[index + 2] = (Math.random() - 0.5) * 90;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(this.rainPositions, 3));
    this.rain = new THREE.Points(
      geometry,
      this.rainMaterial,
    );
    for (let index = 0; index < this.sparklePositions.length; index += 3) {
      this.sparklePositions[index] = (Math.random() - 0.5) * 85;
      this.sparklePositions[index + 1] = Math.random() * 13 + 0.5;
      this.sparklePositions[index + 2] = (Math.random() - 0.5) * 85;
    }
    const sparkleGeometry = new THREE.BufferGeometry();
    sparkleGeometry.setAttribute("position", new THREE.BufferAttribute(this.sparklePositions, 3));
    this.sparkles = new THREE.Points(sparkleGeometry, this.sparkleMaterial);
    this.sun.position.set(-20, 28, 10);
    this.sun.castShadow = true;
    this.scene.add(this.rain, this.sparkles, this.sun);
  }

  setMission(mission: Mission) {
    this.setWeather(mission.weather);
  }

  setWeather(weather: Weather) {
    this.weather = weather;
    this.rain.visible = weather === "rain" || weather === "snow" || weather === "sandstorm";
    this.sparkles.visible = weather === "shiny";
    this.rainMaterial.color.setHex(weather === "snow" ? 0xffffff : weather === "sandstorm" ? 0xe0ae67 : 0xa8dcff);
    const fog = weather === "rain" ? 0x132437 : weather === "shiny" ? 0x9de9ff : weather === "sandstorm" ? 0x9a6a3d : 0x182b45;
    const far = weather === "shiny" ? 125 : weather === "sandstorm" ? 68 : 92;
    this.scene.fog = new THREE.Fog(fog, weather === "shiny" ? 45 : 24, far);
  }

  update(delta: number, time: number, player: THREE.Vector3) {
    const daylight = this.weather === "shiny" ? 2.1 + Math.sin(time * 0.0002) * 0.2 : 0.62 + Math.sin(time * 0.000035) * 0.22;
    this.sun.intensity = daylight;
    this.sun.position.x = Math.sin(time * 0.000035) * 35;
    if (this.sparkles.visible) this.updateSparkles(delta, player);
    if (!this.rain.visible) return;
    for (let index = 0; index < this.rainPositions.length; index += 3) {
      this.rainPositions[index + 1] -= delta * (this.weather === "snow" ? 2.2 : this.weather === "sandstorm" ? 3.4 : 15);
      if (this.weather === "sandstorm") this.rainPositions[index] += delta * 10;
      if (this.rainPositions[index + 1] < 0) {
        this.rainPositions[index] = player.x + (Math.random() - 0.5) * 50;
        this.rainPositions[index + 1] = 20 + Math.random() * 8;
        this.rainPositions[index + 2] = player.z + (Math.random() - 0.5) * 50;
      }
    }
    (this.rain.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }

  dispose() {
    this.scene.remove(this.rain, this.sparkles, this.sun);
    this.rain.geometry.dispose();
    this.rainMaterial.dispose();
    this.sparkles.geometry.dispose();
    this.sparkleMaterial.dispose();
  }

  private updateSparkles(delta: number, player: THREE.Vector3) {
    for (let index = 0; index < this.sparklePositions.length; index += 3) {
      this.sparklePositions[index] += delta * 0.7;
      this.sparklePositions[index + 1] += Math.sin(index + performance.now() * 0.003) * delta * 0.12;
      if (this.sparklePositions[index] > player.x + 42) {
        this.sparklePositions[index] = player.x - 42;
        this.sparklePositions[index + 2] = player.z + (Math.random() - 0.5) * 80;
      }
    }
    (this.sparkles.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}
