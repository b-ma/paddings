import { Experience, CanvasView, Canvas2dRenderer, audioContext } from 'soundworks/client';
import { BPM, numSteps, baseFrequency } from '../../shared/globals';
import * as masters from 'waves-masters';

const template = `
<canvas class="background"></canvas>
<div class="foreground">
  <div class="section-top"></div>
  <div class="section-center"></div>
  <div class="section-bottom"></div>
</div>
`;

class FlashRenderer extends Canvas2dRenderer {
  constructor() {
    super();

    this.isActive = false;
    this.activate = this.activate.bind(this);
  }

  activate() {
    this.isActive = true;
  }

  render(ctx) {
    const color = this.isActive ? '#ffffff' : '#000000';

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    if (this.isActive) {
      this.isActive = false;
    }
  }
}

class MetroEngine extends masters.TimeEngine {
  constructor(period, sync, canvasRenderer) {
    super();

    this.period = period;
    this.sync = sync;
    this.canvasRenderer = canvasRenderer;
    this.buffer = audioContext.createBuffer(1, 10, audioContext.sampleRate);

    const data = this.buffer.getChannelData(0);
    data[0] = 1;
    data[1] = -1;
  }

  advanceTime(syncTime) {
    const syncNow = this.sync.getSyncTime();
    const audioTime = this.master.audioTime;

    // activate renderer
    const dt = syncTime - syncNow;
    setTimeout(this.canvasRenderer.activate, Math.round(dt * 1000));

    // play sound
    const src = audioContext.createBufferSource();
    src.buffer = this.buffer;
    src.connect(audioContext.destination);
    src.start(audioTime);

    return syncTime + this.period;
  }
}

class MetroExperience extends Experience {
  constructor() {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.sync = this.require('sync');
  }

  start() {
    super.start();

    this.scheduler = new masters.Scheduler(() => {
      return this.sync.getSyncTime();
    }, {
      currentTimeToAudioTimeFunction: (time) => {
        return this.sync.getAudioTime(time);
      },
    });

    const beatPeriod = 60 / BPM;
    const metroPeriod = beatPeriod * 4;

    this.view = new CanvasView(template);
    this.canvasRenderer = new FlashRenderer();
    this.view.addRenderer(this.canvasRenderer);

    this.engine = new MetroEngine(metroPeriod, this.sync, this.canvasRenderer);

    this.show().then(() => {
      this.receive('start', syncStartTime => {
        const syncTime = this.sync.getSyncTime();
        const dt = syncTime - syncStartTime;
        const numPeriodSinceStartTime = Math.ceil(dt / metroPeriod);
        const startAt = syncStartTime + numPeriodSinceStartTime * metroPeriod;

        this.scheduler.add(this.engine, startAt);
      });

      this.send('require-start');
    });
  }
}

export default MetroExperience;

