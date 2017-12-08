const fs = require('fs');
const path = require('path');

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');

const MySQL = require('mysql');
const pool = MySQL.createPool({
});
const Redis = require('redis');
const redis = Redis.createClient();

const config = {
  port: 34564,
  rootPath: {root: path.resolve(__dirname + '/../webapp/') + '/'}
};

const publicPaths = ['css', 'js'];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

publicPaths.forEach(pubPath => {
  app.use('/' + pubPath, express.static('../webapp/' + pubPath));
});

app.use((req, res, next) => {
  if (req.url === '/login' || req.url === '/performlogin') {
    next();
    return;
  }
  if (publicPaths.indexOf((req.url.split('/')[1])) > -1) {
    next();
    return;
  }
  if (!req.headers['X-API-KEY']) {
    res.location('/login');
    res.status(302);
    res.send();
    return;
  }
  next();
});

app.get('/login', (req, res) => {
  res.sendFile('login.html', config.rootPath);
});

let setConfig = function SetConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile('settings.conf', 'utf8', (err, contents) => {
      if (err) {
        resolve();
        return;
      }

      let properties = contents
                         .split("\n")
                         .map(line => line.trim())
                         .filter(line => line.substring(0,1) !== '#' && line.indexOf('=') > -1)
                         .map(line => line.split('='))
                         .reduce((obj, prop) => {obj[prop[0]] = prop[1]; return obj}, {});

      for (var key in config) {
        if (properties[key]) {
          config[key] = typeof config[key] == 'number' ? +properties[key] : properties[key];
        }
      }

      resolve();
    });
  });
}

setConfig().then(() => {
  app.listen(config.port);
  console.log("Started on " + config.port);
});

process.on('uncaughtexception', e => {
  console.log(e);
});
