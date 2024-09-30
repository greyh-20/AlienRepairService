class SpaceGame extends Phaser.Scene {
    constructor() {
        super({ key: 'SpaceGame' });
        this.spaceship = null;
        this.cursors = null;
        this.superSpeedMode = false;
        this.maxSpeed = 500;
        this.linearAcceleration = 50;
        this.superSpeedAcceleration = 1000;
        this.angularAcceleration = 10;
        this.lives = 5;
        this.inertiaFactor = 0.99;
        this.isPaused = false;
        this.mapWidth = 5000;
        this.mapHeight = 5000;
        this.asteroids = null;
        this.stations = null;
        this.stationsVisited = 0;
    }

    preload() {
        this.load.image('spaceship', 'assets/ship1.png');
        this.load.image('station', 'assets/space_station.png');
        this.load.spritesheet('asteroid', 'assets/asteroid_spritesheet.png', { frameWidth: 96, frameHeight: 96 });
        this.load.image('background', 'assets/space_bg.png');

        this.load.spritesheet('station_effect', 'assets/station_effect_spritesheet.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('station_engine', 'assets/station_engine_spritesheet.png', { frameWidth: 128, frameHeight: 128 });
    }

    create() {
        this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.background = this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, 'background').setOrigin(0, 0);

        this.spaceship = this.physics.add.sprite(this.mapWidth / 2, this.mapHeight / 2, 'spaceship').setCollideWorldBounds(true);
        this.spaceship.setOrigin(0.5, 0.5);
        this.spaceship.displayWidth = 64;
        this.spaceship.displayHeight = 64;
        this.spaceship.body.setSize(25, 25);

        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.cameras.main.startFollow(this.spaceship);
        this.cursors = this.input.keyboard.addKeys({
            a: Phaser.Input.Keyboard.KeyCodes.A,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            w: Phaser.Input.Keyboard.KeyCodes.W,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            f: Phaser.Input.Keyboard.KeyCodes.F,
            p: Phaser.Input.Keyboard.KeyCodes.P
        });
        
        this.createAsteroids(300);
        this.createStations(5);
        
        this.physics.add.collider(this.spaceship, this.asteroids, this.handleAsteroidCollision, null, this);
        this.physics.add.collider(this.asteroids, this.asteroids);
        
        this.physics.add.collider(this.spaceship, this.stations, this.handleStationCollision, null, this);
        
        this.livesText = this.add.text(10, 10, 'Lives: ' + this.lives, { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);
        this.speedText = this.add.text(10, 30, 'Speed: 0', { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);
        this.superSpeedText = this.add.text(10, 50, '', { fontSize: '20px', fill: '#fff' }).setScrollFactor(0);

        this.gameOverText = this.add.text(400, 300, '', { fontSize: '32px', fill: '#fff' }).setScrollFactor(0);
        this.pauseText = this.add.text(400, 300, 'Paused Experience', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
        this.pauseBackground = this.add.rectangle(400, 300, 400, 250, 0x000000, 0.8).setOrigin(0.5).setVisible(false);
        
        this.anims.create({
            key: 'asteroidAnimation',
            frames: this.anims.generateFrameNumbers('asteroid', { start: 0, end: 7 }),
            repeat: 0
        });

        this.anims.create({
            key: 'stationEffectAnimation',
            frames: this.anims.generateFrameNumbers('station_effect', { start: 0, end: 9 }),
            frameRate: 5,
            repeat: 1
        });

        this.anims.create({
            key: 'stationEngineAnimation',
            frames: this.anims.generateFrameNumbers('station_engine', { start: 0, end: 9 }),
            frameRate: 5,
            repeat: 1
        });
    }

    update() {
        if (this.lives <= 0) {
            this.physics.pause();
            this.gameOverText.setText('Game Over');
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.p)) {
            this.togglePause();
        }

        if (!this.isPaused) {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.f)) {
                this.superSpeedMode = !this.superSpeedMode;
                this.superSpeedText.setText(this.superSpeedMode ? 'Super Speed Activated!' : '');
            }
            this.handleMovement();
            let speed = Math.sqrt(this.spaceship.body.velocity.x ** 2 + this.spaceship.body.velocity.y ** 2);
            this.speedText.setText('Speed: ' + Math.round(speed));
        }
    }

    handleMovement() {
        if (this.superSpeedMode) {
            this.spaceship.setAngularVelocity(0);

            this.spaceship.setVelocityX(Math.cos(this.spaceship.rotation - Math.PI / 2) * this.superSpeedAcceleration);
            this.spaceship.setVelocityY(Math.sin(this.spaceship.rotation - Math.PI / 2) * this.superSpeedAcceleration);

            if (this.cursors.a.isDown) {
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x - Math.cos(this.spaceship.rotation) * this.superSpeedAcceleration / 2);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y - Math.sin(this.spaceship.rotation) * this.superSpeedAcceleration / 2);
            } else if (this.cursors.d.isDown) {
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x + Math.cos(this.spaceship.rotation) * this.superSpeedAcceleration / 2);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y + Math.sin(this.spaceship.rotation) * this.superSpeedAcceleration / 2);
            }
        } else {
            const maxReverseSpeed = this.maxSpeed * 0.2;

            if (this.cursors.a.isDown) {
                this.spaceship.setAngularVelocity(this.spaceship.body.angularVelocity - this.angularAcceleration);
            } else if (this.cursors.d.isDown) {
                this.spaceship.setAngularVelocity(this.spaceship.body.angularVelocity + this.angularAcceleration);
            } else {
                this.spaceship.setAngularVelocity(this.spaceship.body.angularVelocity * this.inertiaFactor);
            }

            if (this.cursors.w.isDown) {
                if (this.spaceship.body.angularVelocity > 0) {
                    this.spaceship.setAngularVelocity(this.spaceship.body.angularVelocity * 0.8);
                }
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x + Math.cos(this.spaceship.rotation - Math.PI / 2) * this.linearAcceleration);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y + Math.sin(this.spaceship.rotation - Math.PI / 2) * this.linearAcceleration);
            } else if (this.cursors.s.isDown) {
                if (this.spaceship.body.angularVelocity > 0) {
                    this.spaceship.setAngularVelocity(this.spaceship.body.angularVelocity * 0.8);
                }
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x - Math.cos(this.spaceship.rotation - Math.PI / 2) * this.linearAcceleration / 100);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y - Math.sin(this.spaceship.rotation - Math.PI / 2) * this.linearAcceleration / 100);
            } else {
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x * this.inertiaFactor);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y * this.inertiaFactor);
            }

            let speed = Math.sqrt(this.spaceship.body.velocity.x ** 2 + this.spaceship.body.velocity.y ** 2);
            if (speed > this.maxSpeed && this.cursors.w.isDown) {
                let factor = this.maxSpeed / speed;
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x * factor);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y * factor);
            } else if (speed > maxReverseSpeed && this.cursors.s.isDown) {
                let factor = maxReverseSpeed / speed;
                this.spaceship.setVelocityX(this.spaceship.body.velocity.x * factor);
                this.spaceship.setVelocityY(this.spaceship.body.velocity.y * factor);
            }
        }
    }

    handleAsteroidCollision(spaceship, asteroid) {
        this.lives--;
        this.livesText.setText('Lives: ' + this.lives);

        asteroid.play('asteroidAnimation');

        const collisionAngle = Phaser.Math.Angle.Between(
            spaceship.x, spaceship.y,
            asteroid.x, asteroid.y
        );

        const bounceVelocity = 200;
        asteroid.setVelocity(
            Math.cos(collisionAngle) * bounceVelocity,
            Math.sin(collisionAngle) * bounceVelocity
        );

        asteroid.setAngularVelocity(Phaser.Math.Between(-100, 100));

        spaceship.setVelocity(
            -Math.cos(collisionAngle) * 50,
            -Math.sin(collisionAngle) * 50
        );
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseText.setVisible(this.isPaused);
        this.pauseBackground.setVisible(this.isPaused);
        if (this.isPaused) {
            this.physics.pause();
        } else {
            this.physics.resume();
        }
    }

    createAsteroids(count) {
        this.asteroids = this.physics.add.group();

        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(-100, this.mapWidth + 100);
            const y = Phaser.Math.Between(-100, this.mapHeight + 100);
            const asteroid = this.asteroids.create(x, y, 'asteroid');
            asteroid.setOrigin(0.5, 0.5);
            asteroid.setDisplaySize(64, 64);
            asteroid.body.setSize(30, 30)
            asteroid.setAngularVelocity(Phaser.Math.Between(-100, 100));
            asteroid.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-50, 50));

            asteroid.anims.stop();
        }
    }

    createStations(count) {
        this.stations = this.physics.add.group();

        for (let i = 0; i < count; i++) {
            const x = Phaser.Math.Between(100, this.mapWidth - 100);
            const y = Phaser.Math.Between(100, this.mapHeight - 100);
            const station = this.stations.create(x, y, 'station');
            station.setOrigin(0.5, 0.5);
            station.setDisplaySize(200, 200);
            station.setSize(100, 100);
            station.setImmovable(true);
        }
    }

    handleStationCollision(spaceship, station) {
        //const effect = this.physics.add.sprite(station.x, station.y, 'station_effect').setOrigin(0.5, 0.5);
        //effect.play('stationEffectAnimation');

        //const engine = this.physics.add.sprite(station.x, station.y, 'station_engine').setOrigin(0.5, 0.5);
        //engine.play('stationEngineAnimation');

        this.lives = 5;
        this.stationsVisited++;
        station.disableBody(true, true);

        if (this.stationsVisited === this.stations.getChildren().length) {
            this.gameOverText.setText('You Win!');
            this.physics.pause();
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'gameContainer',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: SpaceGame
};

const game = new Phaser.Game(config);
