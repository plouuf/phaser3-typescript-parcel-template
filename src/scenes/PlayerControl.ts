import Phaser from "phaser";
import StateMachine from "./statemachine/StateMachine";
import { events } from "./EventCenter";
import ObstaclesController from "./ObstaclesController";

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;

export default class PlayerControl {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Matter.Sprite;
  private stateMachine: StateMachine;
  private cursors: CursorKeys;
  private obstacles: ObstaclesController;
  private health = 100;

  constructor(
    scene: Phaser.Scene,
    sprite: Phaser.Physics.Matter.Sprite,
    cursors: CursorKeys,
    obstacles: ObstaclesController
  ) {
    this.scene = scene;
    this.sprite = sprite;
    this.cursors = cursors;
    this.obstacles = obstacles;

    this.penguinAnimation();

    this.stateMachine = new StateMachine(this, "penguin");

    this.stateMachine
      .addState("idle", {
        onEnter: this.idleOnEnter,
        onUpdate: this.idleOnUpdate,
      })
      .addState("walk", {
        onEnter: this.walkOnEnter,
        onUpdate: this.walkOnUpdate,
      })
      .addState("jump", {
        onEnter: this.jumpOnEnter,
        onUpdate: this.jumpOnUpdate,
      })
      .addState("spike-hit", {
        onEnter: this.spikeOnEnter,
        onUpdate: this.spikeOnUpdate,
      })
      .setState("idle");

    this.sprite.setOnCollide((data: MatterJS.ICollisionPair) => {
      const body = data.bodyA as MatterJS.BodyType;
      const gameObject = body.gameObject;

      const bodyB = data.bodyB as MatterJS.BodyType;
      const gameObjectB = bodyB.gameObject;

      if (this.obstacles.is("spikes", bodyB)) {
        this.stateMachine.setState("spike-hit");
        return;
      }

      if (!gameObject || !gameObjectB) {
        return;
      }

      if (gameObject instanceof Phaser.Physics.Matter.TileBody) {
        if (this.stateMachine.isCurrentState("jump")) {
          this.stateMachine.setState("idle");
        }
        return;
      }

      const sp = gameObjectB as Phaser.Physics.Matter.Sprite;
      const type = sp.getData("type");

      switch (type) {
        case "star": {
          // console.log('collided with star')
          events.emit("star-collected");
          sp.destroy();
          break;
        }

        case "health": {
          const value = sprite.getData("healthGain") ?? 25;
          this.health = Phaser.Math.Clamp(this.health + value, 0, 100);
          events.emit("health-changed", this.health);
          sp.destroy();
          break;
        }
      }
    });
  }

  update(dt: number) {
    this.stateMachine.update(dt);
  }

  private idleOnEnter() {
    this.sprite.play("penguin-idle");
  }

  private idleOnUpdate() {
    if (this.cursors.left.isDown || this.cursors.right.isDown) {
      this.stateMachine.setState("walk");
    }

    const penguinJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (penguinJump) {
      this.stateMachine.setState("jump");
    }
  }

  private walkOnEnter() {
    this.sprite.play("penguin-walk");
  }

  private walkOnUpdate() {
    this.makePenguinWalk();

    const penguinJump = Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (penguinJump) {
      this.stateMachine.setState("jump");
    }
  }

  private jumpOnEnter() {
    this.sprite.play("penguin-jump");
    this.sprite.setVelocityY(-9);
  }

  private jumpOnUpdate() {
    const speed = 5;

    if (this.cursors.left.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(speed);
    }
  }

  private spikeOnEnter() {
    this.sprite.setVelocityY(-10);
    this.health = Phaser.Math.Clamp(this.health - 10, 0, 100);

    events.emit("health-changed", this.health);

    const startColor = Phaser.Display.Color.ValueToColor(0xffffff);
    const endColor = Phaser.Display.Color.ValueToColor(0xff0000);

    this.scene.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 100,
      repeat: 2,
      yoyo: true,
      ease: Phaser.Math.Easing.Sine.InOut,
      onUpdate: (tween) => {
        const value = tween.getValue();
        const colorObject = Phaser.Display.Color.Interpolate.ColorWithColor(
          startColor,
          endColor,
          100,
          value
        );

        const color = Phaser.Display.Color.GetColor(
          colorObject.r,
          colorObject.g,
          colorObject.b
        );
        this.sprite.setTint(color);
      },
    });
  }

  private spikeOnUpdate() {
    this.stateMachine.setState("idle");
  }

  private makePenguinWalk() {
    const speed = 5;

    if (this.cursors.left.isDown) {
      this.sprite.flipX = true;
      this.sprite.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.sprite.flipX = false;
      this.sprite.setVelocityX(speed);
    } else {
      this.sprite.setVelocityX(0);
      this.stateMachine.setState("idle");
    }
  }

  private penguinAnimation() {
    this.sprite.anims.create({
      key: "penguin-idle",
      frames: [{ key: "penguin", frame: "penguin_walk01.png" }],
    });

    this.sprite.anims.create({
      key: "penguin-walk",
      frameRate: 10,
      frames: this.sprite.anims.generateFrameNames("penguin", {
        start: 1,
        end: 4,
        prefix: "penguin_walk0",
        suffix: ".png",
      }),
      repeat: -1,
    });

    this.sprite.anims.create({
      key: "penguin-jump",
      frames: [{ key: "penguin", frame: "penguin_jump02.png" }],
    });
  }
}
