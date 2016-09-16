"use strict";

const url = require('url');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const pmysql = require('promise-mysql');

const woothee = require('woothee');

var app = express();
var dict = [];
var domains = {};
var browsers = {};
var urls = {};
var oss = {};
var bro = {};
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
    res.render('index', { domains: domains, userAgents: bro, oss: oss });
});

app.post('/reset', function(req, res) {
    dict = [];
    domains = {};
    browsers = {};
    urls = {};
    oss = {};         
    bro = {};
    res.status(200).send('');
});

app.post('/access', function(req, res) {
    var endpoint = url.parse(req.body.url);
    var userAgent = woothee.parse(req.body.user_agent);
    var poe = [endpoint.host, endpoint.path, userAgent.category, userAgent.name, userAgent.os, userAgent.version];
    for(var i=0;i<poe.length;i++){
        if(!poe[i]){
            res.status(500);
        }
    }
    var beforeQuery = new Date();
    if(bro[userAgent.name] == undefined){
        bro[userAgent.name] = 1;
    }else { bro[userAgent.name]++; }
    if(browsers[userAgent.name + ' ' + userAgent.version] == undefined){
        browsers[userAgent.name + ' ' + userAgent.version] = 1;
    }else { browsers[userAgent.name + ' ' + userAgent.version]++; }
    if(urls[endpoint.host+ endpoint.path] == undefined){
        urls[endpoint.host+ endpoint.path] = 1;
    }else { urls[endpoint.host+ endpoint.path]++; }
    if(oss[userAgent.os] == undefined){
        oss[userAgent.os] = 1;
    }else { oss[userAgent.os]++; }
    if(domains[endpoint.host] == undefined){
        domains[endpoint.host] = 1;
    }else { domains[endpoint.host]++; }
    dict.push(
        { domain: endpoint.host,
            path: endpoint.path,
            category: userAgent.category,
            user_agent: userAgent.name,
            os: userAgent.os,
            version: userAgent.version
        }  );
    res.status(201).json({ ok: true });
}
);

app.get('/count', function(req, res) {
    var endpoint = url.parse(req.query.url);

    var filterd = dict.filter(val => val.domain == endpoint.host && val.path == endpoint.path);
    var count = filterd.length;
    var pc = filterd.filter(val => val.category == 'pc').length;
    var smartphone = count - pc;
    res.status(200).json({
        count: count,
        pc: pc,
        smartphone: smartphone});
}
);

app.get('/stats', function(req, res) {
    var stats = {
        url: urls,
        os: oss,
        user_agent:browsers
    };
    res.status(200).json(stats);
});

app.listen(3000, function() {
    console.log('listening on port 3000');
    console.log('Please access to http://localhost:3000/');
});
