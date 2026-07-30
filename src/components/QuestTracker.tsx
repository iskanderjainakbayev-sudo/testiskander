import { getQuests } from '../lib/monkey/quests';

type Props = { bananas: number; chests: number };

export function QuestTracker({ bananas, chests }: Props) {
  const quests = getQuests(bananas, chests).slice(0, 2);
  return <aside className="quest-tracker"><p>EXPLORER'S PATH</p>{quests.map((quest) => <div key={quest.id}><b>{quest.title}</b><span>{quest.description}</span><em>{Math.min(quest.current, quest.target)}/{quest.target}</em></div>)}</aside>;
}
