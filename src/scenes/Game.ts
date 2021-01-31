import Phaser from "phaser";
import ObstaclesController from "./ObstaclesController";
import PlayerControl from "./PlayerControl";
import SnowmanControl from "./SnowmanControl";

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private penguin?: Phaser.Physics.Matter.Sprite;
  private playerControl?: PlayerControl;
  private obstacles!: ObstaclesController;
  private snowmen: SnowmanControl[] = [];

  constructor() {
    super("game");
  }

  init() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.obstacles = new ObstaclesController();
    this.snowmen = [];

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      this.destroy();
    });
  }

  preload() {
    this.load.atlas("penguin", "assets/penguin.png", "assets/penguin.json");
    this.load.image("tiles", "assets/sheet.png");
    this.load.tilemapTiledJSON("tilemap", "assets/tiledMap.json");

    this.load.image("star", "assets/star.png");
    this.load.image("health", "assets/health.png");
    this.load.atlas("snowman", "assets/snowman.png", "assets/snowman.json");
  }

  create() {
    this.scene.launch("ui");

    const map = this.make.tilemap({ key: "tilemap" });
    const tileset = map.addTilesetImage("iceWorld", "tiles");

    const ground = map.createLayer("ground", tileset);

    map.createLayer("obstacles", tileset);

    ground.setCollisionByProperty({ collide: true });

    this.matter.world.convertTilemapLayer(ground);

    const objectsLayer = map.getObjectLayer("objects");
    objectsLayer.objects.forEach((objData) => {
      const { x = 0, y = 0, name, width = 0, height = 0 } = objData;

      switch (name) {
        case "spawn": {
          this.penguin = this.matter.add
            .sprite(x + width * 0.5, y, "penguin")
            .setFixedRotation();

          this.playerControl = new PlayerControl(
            this,
            this.penguin,
            this.cursors,
            this.obstacles
          );
          this.cameras.main.startFollow(this.penguin);
          break;
        }
        case "snowman": {
          const snowman = this.matter.add
            .sprite(x, y, "snowman")
            .setFixedRotation();

          this.snowmen.push(new SnowmanControl(this, snowman));
          this.obstacles.add("snowman", snowman.body as MatterJS.BodyType);
          break;
        }

        case "star": {
          const star = this.matter.add.sprite(x, y + 10, "star", undefined, {
            isStatic: true,
            isSensor: true,
          });
          star.setData("type", "star");
          break;
        }

        case "health": {
          const health = this.matter.add.sprite(
            x + width * 0.5,
            y + height * 0.5,
            "health",
            undefined,
            {
              isStatic: true,
              isSensor: true,
            }
          );
          health.setData("type", "health");
          health.setData("healthGain", 25);
          break;
        }

        case "spikes": {
          const spikes = this.matter.add.rectangle(
            x + width * 0.5,
            y + height * 0.5,
            width,
            height,
            {
              isStatic: true,
            }
          );
          this.obstacles.add("spikes", spikes);
          break;
        }
      }
    });
  }

  destroy() {
    this.snowmen.forEach((snowman) => snowman.destroy());
  }

  update(t: number, dt: number) {
    this.playerControl?.update(dt);

    this.snowmen.forEach((snowman) => snowman.update(dt));
  }
}
