import { Experience } from 'soundworks/server';


class ThingExperience extends Experience {
  constructor(clientTypes, comm, scores, startTime) {
    super(clientTypes);

    this.comm = comm;
    this.scores = scores;
    this.startTime = startTime;

    this.sharedParams = this.require('shared-params');
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
  }

  start() {
    this.comm.addListener('score', (index, values) => {
      this.broadcast('thing', null, 'score', index, values);
    });
  }

  enter(client) {
    super.enter(client);

    this.receive(client, 'require-start', () => {
      this.send(client, 'start', this.startTime);
    });

    this.scores.forEach((score, index) => {
      this.send(client, 'score', index, score);
    });

    this.sharedParams.update('numThings', this.clients.length);
  }

  exit(client) {
    super.exit(client);

    this.sharedParams.update('numThings', this.clients.length);
  }
}

export default ThingExperience;
