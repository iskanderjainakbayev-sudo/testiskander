import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { SpaceGamePage } from './pages/SpaceGamePage';
import { NotFoundPage } from './pages/NotFoundPage';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <Suspense fallback={null}>
      <Switch>
        <Route path="/" component={SpaceGamePage} />
        <Route path="/game" component={SpaceGamePage} />
        <Route path="/afterfall" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Suspense>
  );
}
