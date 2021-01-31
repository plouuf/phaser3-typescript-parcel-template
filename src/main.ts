import Phaser from "phaser";
import Game from "./scenes/Game";
import UI from "./scenes/UI"
import GameOver from "./scenes/GameOver"

//2100+3000 -memorial/11/01 @ 17:42 + @ 18:33

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "matter",
    matter: {
      debug: true,
    },
  },
  scene: [Game, UI, GameOver],
};

export default new Phaser.Game(config);
