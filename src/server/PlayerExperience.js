import { Experience } from 'soundworks/server';

class PlayerExperience extends Experience {
  constructor(clientType, comm, scores, startTime) {
    super(clientType);

    this.comm = comm;
    this.scores = scores;
    this.startTime = startTime;

    console.log(scores);
    this.sync = this.require('sync');
    this.sharedParams = this.require('shared-params');
  }

  start() {
    super.start();
  }

  enter(client) {
    super.enter(client);

    this.receive(client, 'require-start', () => {
      this.send(client, 'start', this.startTime);
    });

    this.receive(client, 'score', (index, values) => {
      this.comm.emit('score', index, values);
      this.broadcast('player', client, 'score', index, values);
    });

    // send current state
    this.scores.forEach((score, index) => {
      this.send(client, 'score', index, score);
    });

    this.sharedParams.update('numPlayers', this.clients.length);
  }

  exit(client) {
    super.exit(client);

    this.sharedParams.update('numPlayers', this.clients.length);
  }
}

export default PlayerExperience;
