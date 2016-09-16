"use strict";

const url = require('url');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const pmysql = require('promise-mysql');

const woothee = require('woothee');

var app = express();
var db = mysql.createConnection({
  host: process.env['DATABASE_HOST'] || 'localhost',
  user: process.env['DATABASE_USERNANE'] || 'root',
  password: process.env['DATABASE_PASSWORD'] || '',
  database: process.env['DATABASE_NAME'] || 'phh-isu2016'
});

db.connect(function(err) {
  if(err) {
    console.error('データベースへの接続に失敗しました');
    console.error(err.stack);
    process.exit(1);
  }
});

var pdb;
pmysql.createConnection({
  host: process.env['DATABASE_HOST'] || 'localhost',
  user: process.env['DATABASE_USERNANE'] || 'root',
  password: process.env['DATABASE_PASSWORD'] || '',
  database: process.env['DATABASE_NAME'] || 'phh-isu2016'
}).then(function(connection){
  pdb = connection;
});

app.set('view engine', 'ejs');

app.use(morgan('tiny'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  try {
    next();
  } catch(e) {
    console.error(error.stack);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', function(req, res) {
  Promise.all([
    pdb.query('SELECT `domain`, COUNT(*) AS `count` FROM `access_logs` GROUP BY `domain`'),
    pdb.query('SELECT `user_agent`, COUNT(*) AS `count` FROM `access_logs` GROUP BY `user_agent`'),
    pdb.query('SELECT `os`, COUNT(*) AS `count` FROM `access_logs` GROUP BY `os`'),
  ]).then(function(values) {
    var rows;

    var domains = {};
    rows = values[0];
    for(var i = 0; i < rows.length; i++) {
      domains[rows[i].domain] = rows[i].count;
    }

    var userAgents = {};
    rows = values[1];
    for(var i = 0; i < rows.length; i++) {
      userAgents[rows[i].user_agent] = rows[i].count;
    }

    var oss = {};
    rows = values[2];
    for(var i = 0; i < rows.length; i++) {
      oss[rows[i].os] = rows[i].count;
    }
    res.render('index', { domains: domains, userAgents: userAgents, oss: oss });
  });
});

app.post('/reset', function(req, res) {
  db.query(
    'TRUNCATE TABLE `access_logs`',
    [],
    function(error, rows, fields) {
      res.status(200).send('');
    }
  );
});

app.post('/access', function(req, res) {
  var endpoint = url.parse(req.body.url);
  var userAgent = woothee.parse(req.body.user_agent);

  var beforeQuery = new Date();
  db.query(
    'INSERT INTO `access_logs` SET ?',
    {
      domain: endpoint.host,
      path: endpoint.path,
      category: userAgent.category,
      user_agent: userAgent.name,
      os: userAgent.os,
      version: userAgent.version
    },
    function(error, rows, fields) {
      if(error) {
        console.error(error.stack);
        res.status(500).json({ error: error.message });
        return;
      }

      var afterQuery = new Date();
      var queryTime = afterQuery - beforeQuery
      var wait = 0;
      if(queryTime < 1500) {
        wait = 1500 - queryTime
      }

      res.status(201).json({ ok: true });
    }
  );
});

app.get('/count', function(req, res) {
  var endpoint = url.parse(req.query.url);

  db.query(
    'SELECT COUNT(*) AS `count` FROM `access_logs` WHERE `domain` = ? AND `path` = ?',
    [ endpoint.host, endpoint.path ],
    function(error, rows, fields) {
      if(error) {
        console.error(error.stack);
        res.status(500).json({ error: error.message });
        return;
      }
      var totalCount = rows[0].count;

      db.query(
        'SELECT COUNT(*) AS `count` FROM `access_logs` WHERE `domain` = ? AND `path` = ? AND `category` = ?',
        [ endpoint.host, endpoint.path, 'pc' ],
        function(error, rows, fields) {
          if(error) {
            console.error(error.stack);
            res.status(500).json({ error: error.message });
            return;
          }
          var pcCount = rows[0].count;

          db.query(
            'SELECT COUNT(*) AS `count` FROM `access_logs` WHERE `domain` = ? AND `path` = ? AND `category` = ?',
            [ endpoint.host, endpoint.path, 'smartphone' ],
            function(error, rows, fields) {
              if(error) {
                console.error(error.stack);
                res.status(500).json({ error: error.message });
                return;
              }
              var smartphoneCount = rows[0].count;

              res.status(200).json({
                count: totalCount,
                pc: pcCount,
                smartphone: smartphoneCount
              });
            }
          );
        }
      );
    }
  );
});

app.get('/stats', function(req, res) {
  var stats = {
    url: {},
    os: {},
    user_agent: {}
  };

  db.query(
    'SELECT `user_agent`, `version`, COUNT(*) AS `count` FROM `access_logs` GROUP BY `user_agent`, `version`',
    [],
    function(error, rows, fields) {
      if(error) {
        console.error(error.stack);
        res.status(500).json({ error: error.message });
        return;
      }

      for(var i = 0; i < rows.length; i++) {
        var row = rows[i];
        stats.user_agent[row.user_agent + ' ' + row.version] = row.count;
      }

      db.query(
        'SELECT CONCAT(`domain`, `path`) AS `url`, COUNT(*) AS `count` FROM `access_logs` GROUP BY `url`',
        [],
        function(error, rows, fields) {
          if(error) {
            console.error(error.stack);
            res.status(500).json({ error: error.message });
            return;
          }

          for(var i = 0; i < rows.length; i++) {
            var row = rows[i];
            stats.url[row.url] = row.count;
          }

          db.query(
            'SELECT `os`, COUNT(*) AS `count` FROM `access_logs` GROUP BY `os`',
            [],
            function(error, rows, fields) {
              if(error) {
                console.error(error.stack);
                res.status(500).json({ error: error.message });
                return;
              }

              for(var i = 0; i < rows.length; i++) {
                var row = rows[i];
                stats.os[row.os] = row.count;
              }

              res.status(200).json(stats);
            }
          );
        }
      )
    }
  );
});

app.listen(3000, function() {
  console.log('listening on port 3000');
  console.log('Please access to http://localhost:3000/');
});
