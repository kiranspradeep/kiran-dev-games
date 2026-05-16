export type LudoColor = "RED" | "GREEN" | "YELLOW" | "BLUE";
export type PieceState = "HOME" | "ACTIVE" | "FINISHED";

export interface LudoPiece {
  id:       string;
  color:    LudoColor;
  index:    number;
  state:    PieceState;
  position: number;
  cell:     number;
}

export interface LudoPlayer {
  userId:         string;
  username:       string;
  displayName:    string;
  avatarUrl:      string | null;
  color:          LudoColor;
  slot:           number;
  pieces:         LudoPiece[];
  piecesHome:     number;
  piecesFinished: number;
  isEliminated:   boolean;
}

export interface DiceRoll {
  value:     number;
  rolledBy:  string;
  timestamp: string;
  canMove:   string[];
}

export interface LudoMove {
  pieceId:      string;
  fromPosition: number;
  toPosition:   number;
  captured:     string | null;
  enteredHome:  boolean;
  rolledSix:    boolean;
}