import * as soundworks from 'soundworks/client';
import { Matrix } from '@ircam/gui-components';
import * as controllers from '@ircam/basic-controllers';

const template = `
  <div class="">
    <div id="commons">
      <button class="btn" id="clear">Clear</button>
    </div>
    <div id="pads">
      <div class="pad"></div>
      <div class="pad"></div>
      <div class="pad"></div>
      <div class="pad"></div>
    </div>
  </div>
`;

class PadView extends soundworks.View {
  constructor(comm, numDrums, numSteps, defaultBPM) {
    super(template, {}, {}, {});

    this.comm = comm;
    this.numDrums = numDrums;
    this.numSteps = numSteps;
    this.defaultBPM = defaultBPM;
    this.matrices = [];
    this.beatMatrices = [];

    this.installEvents({
      'click #clear': e => {
        e.preventDefault();

        this.matrices.forEach(matrix => matrix.reset());
      },
    })
  }

  onRender() {
    super.onRender();

    this.$commons = this.$el.querySelector('#commons');
    this.$padsContainer = this.$el.querySelector('#pads');
    this.$pads = Array.from(this.$el.querySelectorAll('.pad'));

    for (let i = 0; i < this.numDrums; i++) {
      const beatMatrix = new Matrix({
        container: this.$pads[i],
        numRows: 1,
        numCols: this.numSteps,
        height: 10,
      });

      const matrix = new Matrix({
        container: this.$pads[i],
        numRows: 12,
        numCols: this.numSteps,
        callback: values => this.comm.emit('pad', i, values),
      });

      this.beatMatrices[i] = beatMatrix;
      this.matrices[i] = matrix;
    }
  }

  onResize(width, height, orientation) {
    const ratio = 1/10; // 1/6;

    const commonHeight = ratio * height;
    const padsHeight = (1 - ratio) * height;

    this.$commons.style.height = `${commonHeight}px`;
    this.$padsContainer.style.height = `${padsHeight}px`;

    for (let i = 0; i < this.numDrums; i++) {
      const padWidth = width / 2;
      const padHeight = padsHeight / 2;
      const top = Math.floor(i / 2) * padHeight;
      const left = (i % 2) * padWidth;

      this.$pads[i].style.width = `${padWidth}px`;
      this.$pads[i].style.height = `${padHeight}px`;
      this.$pads[i].style.left = `${left}px`;
      this.$pads[i].style.top = `${top}px`;

      this.beatMatrices[i].resize(padWidth - 20, 10);
      this.matrices[i].resize(padWidth - 20, padHeight - (20 + 10));
    }
  }

  updatePad(index, values) {
    this.matrices[index].setValues(values, { silent: true });
  }
}

export default PadView;
