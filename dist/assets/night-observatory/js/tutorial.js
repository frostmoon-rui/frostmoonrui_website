(function () {
  'use strict';
  const NO = window.NO;
  const devices = ['keyboard', 'touch', 'gamepad'];
  const steps = ['move', 'jump', 'brace', 'interact'];
  const guidedRooms = { archive_porch: 'heavy', tide2: 'soft', light3: 'mirror', grav1: 'gravity', archive_vault: 'spring' };

  class ControlLesson {
    constructor(game, settings, { defaultDevice, save, show, reward }) {
      Object.assign(this, { game, settings, defaultDevice, save, show, reward });
      const stored = settings.tutorialCompleted;
      this.completed = settings.tutorialCompleted = Object.fromEntries(
        devices.filter(device => stored?.[device] === true).map(device => [device, true])
      );
      this.suppressed = new Set();
      this.dismissedRooms = new Set();
      this.device = null;
      this.resetStep();
    }

    get preferredDevice() {
      const choice = this.settings.tutorialMode;
      return devices.includes(choice) ? choice : this.game.input.device || this.defaultDevice;
    }

    key(action) {
      return NO.t('lesson_key_' + this.preferredDevice + '_' + action);
    }

    refresh() {
      const device = this.preferredDevice;
      if (device !== this.device) {
        this.device = device;
        this.index = 0;
        this.resetStep();
      }
      this.render();
    }

    resetStep() {
      this.distance = 0;
      this.inJump = false;
    }

    roomChanged() {
      this.resetStep();
      this.refresh();
    }

    get active() {
      return this.index < steps.length && this.settings.tutorialMode !== 'off' &&
        !this.completed[this.device] && !this.suppressed.has(this.device) &&
        this.game.mode === 'play' && !this.game.paused;
    }

    get acceptingInput() {
      return this.active && this.game.input.device === this.device;
    }

    hint(topic) {
      return NO.t('lesson_hint_' + topic, {
        move: this.key('move'), jump: this.key('jump'), brace: this.key('brace'), interact: this.key('interact'),
      });
    }

    render() {
      this.showingPractice = this.active;
      if (this.active) {
        this.show({
          device: this.device, step: steps[this.index], number: this.index + 1, total: steps.length,
          message: NO.t('lesson_step_' + steps[this.index], {
            move: this.key('move'), jump: this.key('jump'), brace: this.key('brace'), interact: this.key('interact'),
          }),
        });
        return;
      }
      const room = this.game.room?.id;
      const topic = guidedRooms[room];
      const showHint = topic && !this.dismissedRooms.has(room) &&
        this.settings.tutorialMode !== 'off' && this.game.mode === 'play' && !this.game.paused;
      this.show(showHint ? { device: this.device, step: topic, message: this.hint(topic) } : null);
    }

    advance() {
      this.index++;
      this.resetStep();
      if (this.index === steps.length) {
        this.completed[this.device] = true;
        this.save();
        this.reward(NO.t('lesson_done'));
      }
      this.render();
    }

    moved(distance) {
      if (this.acceptingInput && steps[this.index] === 'move' && Math.abs(this.game.input.axis()) > .18) {
        this.distance += Math.abs(distance);
        if (this.distance >= 45) this.advance();
      }
    }

    jumped() {
      if (this.acceptingInput && ['jump', 'brace'].includes(steps[this.index])) this.inJump = true;
    }

    landed(braced, rank) {
      if (!this.acceptingInput || !this.inJump) return;
      this.inJump = false;
      if (steps[this.index] === 'jump' && !braced && rank > 0) this.advance();
      else if (steps[this.index] === 'brace' && braced && rank === 0) this.advance();
    }

    interacted() {
      if (this.acceptingInput && steps[this.index] === 'interact') this.advance();
    }

    skip() {
      if (this.showingPractice) this.suppressed.add(this.device);
      else this.dismissedRooms.add(this.game.room?.id);
      this.render();
    }

    replay() {
      if (this.settings.tutorialMode === 'off') this.settings.tutorialMode = 'auto';
      const device = this.preferredDevice;
      delete this.completed[device];
      this.suppressed.delete(device);
      this.device = null;
      this.refresh();
      this.save();
    }
  }

  NO.ControlLesson = ControlLesson;
})();
