const url = require('url');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const woothee = require('woothee');

function html(){ return `<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" href="/index.css"><title>PHH アクセスカウンター</title><script>window.onload=function(){domain=document.getElementById("domain").innerText;document.getElementById("domain").innerText=Object.keys(JSON.parse(domain)).length;os=document.getElementById("os").innerText;document.getElementById("os").innerText=Object.keys(JSON.parse(os)).length;browser=document.getElementById("browser").innerText;document.getElementById("browser").innerText=Object.keys(JSON.parse(browser)).length};</script></head><body><h1>PHH アクセスカウンター</h1> <p>これまで、<b id="domain">${JSON.stringify(domains)}</b>個のドメイン、<b id="browser">${JSON.stringify(bro)}</b>種類のブラウザ、<b id="os">${JSON.stringify(oss)}</b>種類の OS のアクセスがありました。</p></body></html>` };
var app = express();
var domains = {};
var browsers = {};
var urls = {};
var oss = {};
var bro = {};
var pc_access = {};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
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
    var hostPath = endpoint.host + endpoint.path;
    var uName = userAgent.name;
    var uv = userAgent.name + ' ' + userAgent.version;
    if(!bro[uName]){
        bro[uName] = 1;
    }else { bro[uName]++; }
    if(!browsers[uv]){
        browsers[uv] = 1;
    }else { browsers[uv]++; }
    if(!urls[hostPath]){
        urls[hostPath] = 1;
    }else { urls[hostPath]++; }
    if(!oss[userAgent.os]){
        oss[userAgent.os] = 1;
    }else { oss[userAgent.os]++; }
    if(!domains[endpoint.host]){
        domains[endpoint.host] = 1;
    }else { domains[endpoint.host]++; }
    if(!pc_access[hostPath]){
        if(userAgent.category && userAgent.category === 'pc'){
            pc_access[hostPath] = 1;
        }
    }else { if(userAgent.category && userAgent.category === 'pc') pc_access[hostPath]++; }
    res.status(201).send('{ "ok": true }');
}
);

app.get('/count', function(req, res) {
    var endpoint = url.parse(req.query.url);
    var hostPath = endpoint.host + endpoint.path;
    var url_count= urls[hostPath];
    var pc = pc_access[hostPath];
    var smartphone = url_count - pc;
    res.status(200).send(JSON.stringify({
        count: url_count,
        pc: pc,
        smartphone: smartphone}));
}
);

app.get('/stats', function(req, res) {
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
