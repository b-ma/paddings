import EventEmitter from 'events';
import * as soundworks from 'soundworks/client';
import * as masters from 'waves-masters';
import PadView from './PadView';

const audioContext = soundworks.audioContext;

class StepEngine extends masters.TimeEngine {
  constructor(BPM, numSteps) {
    super();

    this.BPM = BPM;
    this.period = 60 / BPM;
    this.numSteps = numSteps;
    this.pads = null;
    this.currentStep = -1;
  }

  advanceTime(schedulerTime) {
    this.currentStep = (this.currentStep + 1) % this.numSteps;

    const audioTime = this.master.audioTime;
    const now = audioContext.currentTime;
    const dt = Math.floor(audioTime - now);

    // console.log('called', schedulerTime);
    setTimeout(() => {
      for (let i = 0; i < this.pads.length; i++) {
        this.pads[i].reset();
        this.pads[i].setCellValue(this.currentStep, 0, 1);
      }
    }, dt * 1000);

    return schedulerTime + this.period;
  }
}

class PlayerExperience extends soundworks.Experience {
  constructor() {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.sync = this.require('sync');

    this.comm = new EventEmitter();
  }

  start() {
    super.start();

    const numSteps = 16;
    const BPM = 240;

    this.view = new PadView(this.comm, 4, numSteps, BPM);

    this.comm.addListener('pad', (index, values) => {
      this.send('score', index, values);
    });

    const scheduler = new masters.Scheduler(() => {
      return this.sync.getSyncTime();
    }, {
      currentTimeToAudioTimeFunction: syncTime => {
        return this.sync.getAudioTime(syncTime);
      },
    });

    const stepEngine = new StepEngine(BPM, numSteps);

    this.receive('start', syncStartTime => {
      const stepPeriod = 60 / BPM;
      const now = this.sync.getSyncTime();
      const nextTime = Math.ceil((now - syncStartTime) / stepPeriod) * stepPeriod;
      const nextStep = (nextTime / stepPeriod) % numSteps;

      stepEngine.currentStep = nextStep - 1;
      scheduler.add(stepEngine, nextTime);
    });

    this.receive('score', (index, values) => {
      this.view.updatePad(index, values);
    });

    this.show().then(() => {
      stepEngine.pads = this.view.beatMatrices;
      this.send('require-start');
    });
  }
}

export default PlayerExperience;
