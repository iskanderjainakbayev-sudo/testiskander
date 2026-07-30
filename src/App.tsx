import { Route, Switch } from 'wouter';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Здесь живут только маршруты. Сами экраны складывай в src/pages/.
export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/game" component={GamePage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}
