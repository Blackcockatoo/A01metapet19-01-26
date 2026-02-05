import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private petData: any;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Listen for pet data from React
    this.events.on('petData', (data: any) => {
      this.petData = data;
    });

    // Background gradient
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0a0520, 0x0a0520, 0x1a0f3a, 0x1a0f3a, 1);
    graphics.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, height / 3, 'SPACE JEWBLES', {
      font: 'bold 48px Arial',
      color: '#00ffff',
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 60, 'Tap to Attack • Idle to Progress', {
      font: '20px Arial',
      color: '#ff00ff',
    });
    subtitle.setOrigin(0.5);

    // Instructions
    const instructions = this.add.text(width / 2, height - 100, 'Tap anywhere to start', {
      font: '18px Arial',
      color: '#ffffff',
    });
    instructions.setOrigin(0.5);

    // Pulsing animation for instructions
    this.tweens.add({
      targets: instructions,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Start game on tap/click
    this.input.once('pointerdown', () => {
      this.scene.start('GameScene', { petData: this.petData });
    });
  }
}
