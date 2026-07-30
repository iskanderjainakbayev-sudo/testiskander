import { Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { SpaceGamePage } from './pages/SpaceGamePage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <Switch>
      <Route path="/" component={SpaceGamePage} />
      <Route path="/game" component={SpaceGamePage} />
      <Route path="/afterfall" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
