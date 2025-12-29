// Global sound management service for platform-wide audio
class SoundManager {
  constructor() {
    this.sounds = {};
    this.context = null;
    this.enabled = true;
    this.volume = 1.0;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (err) {
      console.warn('Audio context not supported:', err);
    }
  }

  async unlock() {
    // Mobile Safari requires user interaction to unlock audio
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  async loadSound(key, url) {
    if (!this.initialized) await this.init();
    
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.sounds[key] = audioBuffer;
    } catch (err) {
      console.warn(`Failed to load sound: ${key}`, err);
    }
  }

  play(key, volume = 1.0) {
    if (!this.enabled || !this.sounds[key] || !this.context) return;

    try {
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();
      
      source.buffer = this.sounds[key];
      gainNode.gain.value = this.volume * volume;
      
      source.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      source.start(0);
    } catch (err) {
      console.warn(`Failed to play sound: ${key}`, err);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  ensureTone(key, frequency = 880, durationMs = 180, volume = 0.3) {
    if (this.sounds[key]) return;
    if (!this.initialized) this.init();
    if (!this.context) return;

    const sampleRate = this.context.sampleRate || 44100;
    const frameCount = Math.floor((durationMs / 1000) * sampleRate);
    const buffer = this.context.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i += 1) {
      const envelope = 1 - i / frameCount;
      data[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * envelope * volume;
    }

    this.sounds[key] = buffer;
  }

  safePlay(key, volume = 1) {
    try {
      this.play(key, volume);
    } catch (err) {
      console.warn('Sound play skipped', err);
    }
  }
}

// Singleton instance
export const soundManager = new SoundManager();

// Initialize on first user interaction
document.addEventListener('click', () => soundManager.unlock(), { once: true });
document.addEventListener('touchstart', () => soundManager.unlock(), { once: true });
