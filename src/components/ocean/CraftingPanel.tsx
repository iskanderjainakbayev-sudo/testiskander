import { useState } from 'react';
import { RECIPES, RESOURCE_NAMES } from '../../lib/ocean/content';
import type { OceanSnapshot, Recipe, RecipeId, ResourceId } from '../../lib/ocean/types';

interface CraftingPanelProps {
  snapshot: OceanSnapshot;
  onCraft: (id: RecipeId) => void;
  onClose: () => void;
}

const CATEGORIES: Recipe['category'][] = ['Gear', 'Habitat', 'Escape'];

export function CraftingPanel({ snapshot, onCraft, onClose }: CraftingPanelProps) {
  const [category, setCategory] = useState<Recipe['category']>('Gear');
  return (
    <div className="ocean-overlay">
      <section className="ocean-panel craft-panel">
        <header>
          <div><small>POD FABRICATOR</small><h2>Blueprints</h2></div>
          <button onClick={onClose} aria-label="Close crafting">×</button>
        </header>
        <nav>
          {CATEGORIES.map((item) => (
            <button className={category === item ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>
          ))}
        </nav>
        <div className="recipe-list">
          {RECIPES.filter((recipe) => recipe.category === category).map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} snapshot={snapshot} onCraft={onCraft} />
          ))}
        </div>
        <footer>Materials are preserved in your pressure-sealed pack.</footer>
      </section>
    </div>
  );
}

function RecipeCard({ recipe, snapshot, onCraft }: {
  recipe: Recipe;
  snapshot: OceanSnapshot;
  onCraft: (id: RecipeId) => void;
}) {
  const built = snapshot.crafted.includes(recipe.id) && !recipe.repeatable;
  const locked = Boolean(recipe.requires && !snapshot.crafted.includes(recipe.requires));
  return (
    <article className={built ? 'built' : locked ? 'locked' : ''}>
      <div>
        <small>{built ? 'FABRICATED' : locked ? 'BLUEPRINT LOCKED' : recipe.detail}</small>
        <h3>{recipe.name}</h3>
        <p>
          {Object.entries(recipe.cost).map(([id, amount]) => {
            const resource = id as ResourceId;
            const enough = snapshot.inventory[resource] >= (amount ?? 0);
            return <span className={enough ? '' : 'missing'} key={id}>{RESOURCE_NAMES[resource]} {amount}</span>;
          })}
        </p>
      </div>
      <button disabled={built || locked} onClick={() => onCraft(recipe.id)}>{built ? '✓' : 'BUILD'}</button>
    </article>
  );
}

