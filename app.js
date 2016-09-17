"use strict";

const url = require('url');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const woothee = require('woothee');

function html(){ return `<!DOCTYPE html><html> <head> <meta charset="UTF-8"> <link rel="stylesheet" href="/index.css"> <title>PHH アクセスカウンター</title> <script> window.onload = function(){ domain = document.getElementById("domain").innerText; document.getElementById("domain").innerText = Object.keys(JSON.parse(domain)).length; os= document.getElementById("os").innerText; document.getElementById("os").innerText = Object.keys(JSON.parse(os)).length; browser = document.getElementById("browser").innerText; document.getElementById("browser").innerText = Object.keys(JSON.parse(browser)).length; } </script> </head> <body> <h1>PHH アクセスカウンター</h1> <p>これまで、<b id="domain">${JSON.stringify(domains)}</b>個のドメイン、<b id="browser">${JSON.stringify(bro)}</b>種類のブラウザ、<b id="os">${JSON.stringify(oss)}</b>種類の OS のアクセスがありました。</p> </body></html>` };
var app = express();
var domains = {};
var browsers = {};
var urls = {};
var oss = {};
var bro = {};
var pc_access = {};

// app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(function(req, res, next) {
    try {
        next();
    } catch(e) {
        console.error(error.stack);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', function(req, res) {
    res.status(200).send(html());
});

app.post('/reset', function(req, res) {
    domains = {};
    browsers = {};
    urls = {};
    oss = {};         
    bro = {};
    pc_access = {};
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
    if(pc_access[endpoint.host + endpoint.path] == undefined){
        if(userAgent.category && userAgent.category === 'pc'){
            pc_access[endpoint.host + endpoint.path] = 1;
        }
    }else { if(userAgent.category && userAgent.category === 'pc') pc_access[endpoint.host + endpoint.path]++; }
    res.status(201).send('{ "ok": true }');
}
);

app.get('/count', function(req, res) {
    var endpoint = url.parse(req.query.url);

    var url_count= urls[endpoint.host + endpoint.path];
    var pc = pc_access[endpoint.host + endpoint.path];
    var smartphone = url_count - pc;
    res.status(200).send(JSON.stringify({
        count: url_count,
        pc: pc,
        smartphone: smartphone}));
}
);

app.get('/stats', function(req, res) {
    var stats = {
        url: urls,
        os: oss,
        user_agent:browsers
    };
    res.status(200).send(JSON.stringify(
        {url: urls,
        os: oss,
        user_agent:browsers}
	));
});

app.listen(3000, function() {
    console.log('listening on port 3000');
    console.log('Please access to http://localhost:3000/');
});
