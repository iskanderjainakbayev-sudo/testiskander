import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { LoadingScreen } from './components/LoadingScreen';
import { NotFoundPage } from './pages/NotFoundPage';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const OceanGamePage = lazy(() => import('./pages/OceanGamePage').then((module) => ({ default: module.OceanGamePage })));
const SpaceGamePage = lazy(() => import('./pages/SpaceGamePage').then((module) => ({ default: module.SpaceGamePage })));
const ShooterArenaPage = lazy(() => import('./components/GameArena').then((module) => ({ default: module.GameArena })));

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/" component={OceanGamePage} />
        <Route path="/game" component={OceanGamePage} />
        <Route path="/shooter" component={ShooterArenaPage} />
        <Route path="/signup" component={() => <LoginPage initialMode="register" />} />
        <Route path="/login" component={() => <LoginPage initialMode="signin" />} />
        <Route path="/space" component={SpaceGamePage} />
        <Route path="/afterfall" component={HomePage} />
        <Route component={NotFoundPage} />
      </Switch>
    </Suspense>
  );
}
