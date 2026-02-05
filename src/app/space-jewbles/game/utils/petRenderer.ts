import * as Phaser from 'phaser';

export interface PhysicalTraits {
  bodyType: string;
  primaryColor: string;
  secondaryColor: string;
  pattern: string;
  texture: string;
  size: number;
  features: string[];
}

export class PetRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates a dynamic pet sprite based on MetaPet traits
   */
  createPetSprite(
    traits: PhysicalTraits,
    genomeSeed: number = 0,
    size: number = 50
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(0, 0);

    // 1. Body shape based on bodyType
    const body = this.createBody(traits.bodyType, traits.primaryColor, size);
    container.add(body);

    // 2. Pattern overlay
    if (traits.pattern !== 'Solid') {
      const pattern = this.createPattern(
        traits.pattern,
        traits.secondaryColor,
        size,
        genomeSeed
      );
      container.add(pattern);
    }

    // 3. Texture effects
    if (traits.texture === 'Glowing') {
      const glow = this.scene.add.pointlight(
        0,
        0,
        this.hexToNumber(traits.primaryColor),
        size * 2,
        0.3
      );
      container.add(glow);
    }

    // 4. Features (wings, horns, tail flame, aura)
    traits.features.forEach((feature) => {
      const featureSprite = this.createFeature(feature, traits, size);
      if (featureSprite) {
        container.add(featureSprite);
      }
    });

    // 5. Eyes
    const eyes = this.createEyes(traits.bodyType, size);
    eyes.forEach((eye) => container.add(eye));

    return container;
  }

  private createBody(bodyType: string, color: string, size: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const fillColor = this.hexToNumber(color);

    graphics.fillStyle(fillColor, 1);

    switch (bodyType) {
      case 'Spherical':
        graphics.fillCircle(0, 0, size / 2);
        break;
      case 'Cubic':
        graphics.fillRect(-size / 2, -size / 2, size, size);
        break;
      case 'Pyramidal':
        graphics.fillTriangle(
          0,
          -size / 2, // top
          -size / 2,
          size / 2, // bottom left
          size / 2,
          size / 2 // bottom right
        );
        break;
      default:
        // Default to spherical
        graphics.fillCircle(0, 0, size / 2);
    }

    return graphics;
  }

  private createPattern(
    pattern: string,
    color: string,
    size: number,
    seed: number
  ): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    const fillColor = this.hexToNumber(color);

    graphics.fillStyle(fillColor, 0.5);

    switch (pattern) {
      case 'Striped':
        // Vertical stripes
        for (let i = -size / 2; i < size / 2; i += size / 5) {
          graphics.fillRect(i, -size / 2, size / 10, size);
        }
        break;
      case 'Spotted':
        // Random spots based on seed
        Phaser.Math.RND.sow([seed.toString()]);
        for (let i = 0; i < 5; i++) {
          const x = Phaser.Math.Between(-size / 3, size / 3);
          const y = Phaser.Math.Between(-size / 3, size / 3);
          graphics.fillCircle(x, y, size / 8);
        }
        break;
    }

    return graphics;
  }

  private createFeature(
    feature: string,
    traits: PhysicalTraits,
    size: number
  ): Phaser.GameObjects.Graphics | null {
    const graphics = this.scene.add.graphics();
    const color = this.hexToNumber(traits.secondaryColor);

    graphics.fillStyle(color, 1);
    graphics.lineStyle(2, 0x000000, 0.5);

    switch (feature) {
      case 'Wings':
        // Simple wing shapes on sides
        graphics.fillEllipse(-size / 2, 0, size / 3, size / 2);
        graphics.fillEllipse(size / 2, 0, size / 3, size / 2);
        break;

      case 'Horns':
        // Two horns on top
        graphics.fillTriangle(
          -size / 4,
          -size / 2,
          -size / 4 - 5,
          -size / 2 - 15,
          -size / 4 + 5,
          -size / 2 - 15
        );
        graphics.fillTriangle(
          size / 4,
          -size / 2,
          size / 4 - 5,
          -size / 2 - 15,
          size / 4 + 5,
          -size / 2 - 15
        );
        break;

      case 'Tail Flame':
        // Flame effect at bottom
        graphics.fillStyle(0xff6600, 1);
        graphics.fillTriangle(0, size / 2, -10, size / 2 + 20, 10, size / 2 + 20);
        break;

      case 'Aura':
        // Subtle glow ring
        graphics.lineStyle(3, color, 0.3);
        graphics.strokeCircle(0, 0, size / 2 + 10);
        return graphics;

      default:
        return null;
    }

    return graphics;
  }

  private createEyes(bodyType: string, size: number): Phaser.GameObjects.Graphics[] {
    const leftEye = this.scene.add.graphics();
    const rightEye = this.scene.add.graphics();

    // Eye positioning based on body type
    let eyeY = bodyType === 'Pyramidal' ? -size / 4 : -size / 6;

    leftEye.fillStyle(0xffffff, 1);
    leftEye.fillCircle(-size / 4, eyeY, size / 8);
    leftEye.fillStyle(0x000000, 1);
    leftEye.fillCircle(-size / 4, eyeY, size / 12);

    rightEye.fillStyle(0xffffff, 1);
    rightEye.fillCircle(size / 4, eyeY, size / 8);
    rightEye.fillStyle(0x000000, 1);
    rightEye.fillCircle(size / 4, eyeY, size / 12);

    return [leftEye, rightEye];
  }

  /**
   * Apply trait-based stat bonuses
   */
  calculateTraitBonuses(traits: PhysicalTraits): {
    fireRate: number;
    damage: number;
    critChance: number;
    speed: number;
  } {
    const bonuses = {
      fireRate: 1.0,
      damage: 1.0,
      critChance: 0.05,
      speed: 1.0,
    };

    // Body type bonuses
    if (traits.bodyType === 'Spherical') {
      bonuses.speed = 1.2; // Faster movement
    } else if (traits.bodyType === 'Cubic') {
      bonuses.damage = 1.15; // More damage
    } else if (traits.bodyType === 'Pyramidal') {
      bonuses.critChance = 0.15; // Higher crit
    }

    // Size bonuses
    if (traits.size < 1.0) {
      bonuses.fireRate = 1.3; // Smaller = faster fire rate
    } else if (traits.size > 1.5) {
      bonuses.damage = 1.2; // Larger = more damage
    }

    // Feature bonuses
    if (traits.features.includes('Wings')) {
      bonuses.speed = 1.25;
    }
    if (traits.features.includes('Horns')) {
      bonuses.damage = 1.2;
    }

    // Color bonuses (simplified)
    const primaryHue = this.getHue(traits.primaryColor);
    if (primaryHue < 30 || primaryHue > 330) {
      // Red
      bonuses.damage = 1.15;
    } else if (primaryHue > 200 && primaryHue < 260) {
      // Blue
      bonuses.fireRate = 1.15;
    }

    return bonuses;
  }

  private hexToNumber(hex: string): number {
    return parseInt(hex.replace('#', ''), 16);
  }

  private getHue(hex: string): number {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = ((rgb >> 16) & 255) / 255;
    const g = ((rgb >> 8) & 255) / 255;
    const b = (rgb & 255) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) return 0;

    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
    } else if (max === g) {
      hue = ((b - r) / delta + 2) / 6;
    } else {
      hue = ((r - g) / delta + 4) / 6;
    }

    return hue * 360;
  }
}
