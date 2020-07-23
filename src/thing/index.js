import 'source-map-support/register';
import * as soundworks from 'soundworks/thing';
import path from 'path';
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

// @todo - allow to pass SERVER_IP from command line
// const SERVER_IP = process.env.SERVER_IP || 'http://127.0.0.1:8000';

const serverUrl = `${(config.userHttps ? 'https' : 'http')}://${config.ip}:${config.port}`;

console.log('------------------------------------------------');
console.log('> connecting to server:', serverUrl);
console.log('------------------------------------------------');

config.websockets.url = serverUrl;

soundworks.client.init('thing', config);

const experience = new ThingExperience();

soundworks.client.start();
