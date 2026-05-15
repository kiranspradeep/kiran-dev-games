import GameLayout from "@/components/GameLayout";
import WordleGame from "@/components/games/WordleGame";
import ScoreSyncWrapper from "@/components/games/ScoreSyncWrapper";

const CONTROLS = [
  { key: "A–Z", description: "Type a letter" },
  { key: "Enter", description: "Submit guess" },
  { key: "⌫", description: "Delete letter" },
];

export default function WordlePage() {
  return (
    <GameLayout title="Wordle" controls={CONTROLS}>
      <ScoreSyncWrapper gameId="wordle">
        <WordleGame />
      </ScoreSyncWrapper>
    </GameLayout>
  );
}