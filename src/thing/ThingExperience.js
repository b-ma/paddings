import { Experience, client } from 'soundworks/thing';
import path from 'path';
import pd from 'node-libpd';
import * as masters from 'waves-masters';
import { BPM, numSteps, baseFrequency } from '../shared/globals';

const initialized = pd.init({
  // some cards doesn't have any input, so it crashes
  numInputChannels: 0,
  numOutputChannels: 1,
  // we launch jackd at 44100, so if we put something else, it crashes
  sampleRate: 48000,
  ticks: 2,
});


class StepEngine extends masters.TimeEngine {
  constructor(BPM, numSteps, baseFrequency) {
    super();

    this.BPM = BPM;
    this.period = 60 / BPM;
    this.numSteps = numSteps;
    this.pads = null;
    this.currentStep = -1;
    this.score = [];

    this.intervalRatio = Math.pow(2, 1/7);

    this.voices = [];
    const numNotes = 12;

    for (let i = numNotes - 1; i >= 0; i--) {
      const patch = pd.openPatch('synth.pd', path.join(process.cwd(), 'pd'));
      const freq = baseFrequency * Math.pow(this.intervalRatio, i);

      pd.send(`${patch.$0}-frequency-control`, ['setValue', freq], pd.currentTime);

      this.voices.push(patch);
    }
  }

  advanceTime(schedulerTime) {
    this.currentStep = (this.currentStep + 1) % this.numSteps;

    const audioTime = this.master.audioTime;
    const stepScore = this.score[this.currentStep];

    if (Array.isArray(stepScore)) {
      // console.log(stepScore);

      for (let i = 0; i < stepScore.length; i++) {
        const value = stepScore[i];

        if (value !== 0) {
          const patch = this.voices[i];
          // the 1 at index 1 should be needed, but pd somehow treat the thing as a symbol...
          pd.send(`${patch.$0}-gain-control`, ['cancel', 1], audioTime);
          pd.send(`${patch.$0}-gain-control`, ['linearRampToValue', 0.7, 0.01], audioTime);
          pd.send(`${patch.$0}-gain-control`, ['exponentialRampToValue', 0.0001, 1.5], audioTime + 0.01);
        }
      }
    }

    return schedulerTime + this.period;
  }
}

class ThingExperience extends Experience {
  constructor() {
    super();

    this.checkin = this.require('checkin');
    this.sharedParams = this.require('shared-params');
    this.sync = this.require('sync', {
      getTime: () => pd.currentTime,
    });
  }

  start() {
    super.start();

    const scheduler = new masters.Scheduler(() => {
      return this.sync.getSyncTime();
    }, {
      currentTimeToAudioTimeFunction: (time) => {
        return this.sync.getAudioTime(time);
      },
    });

    scheduler.lookahead = 0.1;

    const stepEngine = new StepEngine(BPM, numSteps, baseFrequency);

    this.receive('start', (syncStartTime) => {
      const stepPeriod = 60 / BPM;
      const now = this.sync.getSyncTime();
      const nextTime = Math.ceil((now - syncStartTime) / stepPeriod) * stepPeriod;
      const nextStep = (nextTime / stepPeriod) % numSteps;

      stepEngine.currentStep = nextStep - 1;
      scheduler.add(stepEngine, nextTime);
    });

    this.receive('score', (index, values) => {
      if (index === client.index) {
        stepEngine.score = values;
      }
    });

    this.send('require-start');
  }

}

export default ThingExperience;
