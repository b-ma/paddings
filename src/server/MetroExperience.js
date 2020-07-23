import { Experience } from 'soundworks/server';


class ThingExperience extends Experience {
  constructor(clientTypes, comm, startTime) {
    super(clientTypes);

    this.comm = comm;
    this.startTime = startTime;

    this.sharedParams = this.require('shared-params');
    this.sync = this.require('sync');
  }

  start() {}

  enter(client) {
    super.enter(client);

    this.receive(client, 'require-start', () => {
      this.send(client, 'start', this.startTime);
    });

    this.sharedParams.update('numPlayers', this.clients.length);
  }

  exit(client) {
    super.exit(client);

    this.sharedParams.update('numPlayers', this.clients.length);
  }
}

export default ThingExperience;
