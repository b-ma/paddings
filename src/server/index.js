import 'source-map-support/register'; // enable sourcemaps in node
import path from 'path';
import EventEmitter from 'events';
import * as soundworks from 'soundworks/server';
import PlayerExperience from './PlayerExperience';
import MetroExperience from './MetroExperience';
import ControllerExperience from './ControllerExperience';
import ThingExperience from './ThingExperience';

const configName = process.env.ENV || 'default';
const configPath = path.join(process.cwd(), 'dist', 'shared', 'config', configName);
let config = null;

// rely on node `require` as the path is dynamic
try {
  config = require(configPath).default;
} catch(err) {
  console.error(`Invalid ENV "${configName}", file "${configPath}.js" not found`);
  process.exit(1);
}

process.env.NODE_ENV = config.env;

if (process.env.PORT) {
  config.port = process.env.PORT;
}


soundworks.server.init(config);

soundworks.server.setClientConfigDefinition((clientType, config, httpRequest) => {
  return {
    clientType: clientType,
    env: config.env,
    appName: config.appName,
    websockets: config.websockets,
    defaultType: config.defaultClient,
    assetsDomain: config.assetsDomain,
  };
});

const sharedParams = soundworks.server.require('shared-params');
sharedParams.addText('numPlayers', '# players', '0');
sharedParams.addText('numThings', '# things', '0');

const sync = soundworks.server.require('sync');
const startTime = sync.getSyncTime();

const comm = new EventEmitter();
const scores = [];

comm.addListener('score', (index, score) => scores[index] = score);

const experience = new PlayerExperience('player', comm, scores, startTime);
const thing = new ThingExperience('thing', comm, scores, startTime);
const metro = new MetroExperience('metro', comm, startTime);
const controller = new ControllerExperience('controller', comm, scores, startTime);

soundworks.server.start();
