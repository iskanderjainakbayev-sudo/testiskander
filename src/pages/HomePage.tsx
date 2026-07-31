import { Link } from 'wouter';
import '../styles/afterfall.css';

export function HomePage() {
  return (
    <main className="afterfall-home">
      <div className="afterfall-home__rain" />
      <div className="afterfall-home__outline" />
      <section className="afterfall-home__content">
        <p>FIELD SURVIVAL // HOLLOW CREEK, DAY 14</p>
        <h1>
          AFTER
          <br />
          <i>FALL</i>
        </h1>
        <b>
          When the evacuation signal dies, every road through the abandoned valley
          becomes a decision: search, craft, stay quiet—or run.
        </b>
        <Link href="/game">START FIELD EXPEDITION <span>→</span></Link>
        <Link href="/signup" className="afterfall-home__signup">
          REGISTER WITH GOOGLE
        </Link>
        <small>THREE.JS WEBGL · OFFLINE FIELD SAVES · PWA READY</small>
      </section>
      <section className="afterfall-home__features" aria-label="Game features">
        <article>
          <b>⌖</b>
          <span>Explore</span>
          <small>Hospital, checkpoint, forest and rail yard</small>
        </article>
        <article>
          <b>▣</b>
          <span>Survive</span>
          <small>Hunger, thirst, energy and weather</small>
        </article>
        <article>
          <b>✦</b>
          <span>Adapt</span>
          <small>Loot, craft and fight for a way out</small>
        </article>
      </section>
    </main>
  );
}
