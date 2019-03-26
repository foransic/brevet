const express = require('express');
const request = require('request');
const fs = require('fs');
const mustache = require('mustache-express');
const config = require('./conf/config');

var app = express();
app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

// to be removed in production!
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', (req, res) => {
    res.redirect(config.context + '/date-asc--');
});

app.get('/:sort-:order-:field?-:value?', (req, res) => {
    // get the current day date
    var now = new Date();
    var datestamp = Math.round(now.getTime()/(1000*3600*24));
    var frNow = now.toLocaleDateString('fr-FR');
    var filename = './tmp/brevets_' + datestamp + '.json';

    // get sort / filter params
    var sort = {
        field : req.params.sort,
        order : req.params.order
    }

    var filter = {
        field : req.params.field,
        value : req.params.value
    }

    var data = null;

    fs.readFile(filename, (err, data) => {
        if (err || data === null) {
            request({
                url: 'https://veloenfrance.fr/ffvelo/ajax/json/events.json?searchoin=&datestart=' + frNow + '&dateend=&route=on&vtt=on&marche=on&circuitjeune=on&circuitOrientation=on&circuitInit=on&circuit100=on&circuit150=on&circuit200=on&circuit250=on&circuitBevents=on&circuitRandonnee=on&circuitautres=on&distanceStart=0&distanceEnd=251',
                method: 'GET',
            }, (err, resp) => {
                if (err) {
                    console.error(err);
                } else {
                    data = resp.body;
                    fs.writeFile(filename, data, (err) => {
                        console.error(err);
                    });
                    loadData(data, sort, filter, res);
                }
            });
        } else {
            loadData(data, sort, filter, res);
        }
    });
});

loadData = (data, sort, filter, res) => {
    var result = [];
    var depts = [];
    var cities = [];
    var types = [];
    
    if (data) {
        json = JSON.parse(data);
        for (idx in json.features) {
            var feature = json.features[idx];
            var gpxlist = '';
            if (feature.properties.GPXurl) {
                gpxlist = feature.properties.GPXurl.split(',');
            }
            var _date = new Date(feature.properties.dateyear, feature.properties.date.split('/')[1], feature.properties.date.split('/')[0]);
            var _dept = feature.properties.departement;
            var _city = feature.properties.ville.toLowerCase();
            var _type = feature.properties.typenone.toLowerCase();
    
            var toAdd = true;
    
            switch (filter.field) {
                case 'dept' : toAdd = _dept === filter.value ? true : false; break;
                case 'city' : toAdd = _city === filter.value ? true : false; break;
                case 'type' : toAdd = _type === filter.value ? true : false; break;
            }
    
            if (toAdd) {
                if (depts.indexOf(_dept) < 0) depts.push(_dept);
                if (cities.indexOf(_city) < 0) cities.push(_city);
                if (types.indexOf(_type) < 0) types.push(_type);
    
                var line = {
                    id: feature.properties.id,
                    lat: feature.geometry.coordinates[0],
                    lon: feature.geometry.coordinates[1],
                    name: feature.properties.nom.toLowerCase(),
                    department: _dept,
                    city: _city,
                    rawdate: _date,
                    date: feature.properties.date + '/' + feature.properties.dateyear,
                    type: _type,
                    gpxlist: gpxlist,
                    url: 'https://veloenfrance.fr/ffvelo/ajax/page/event/' + feature.properties.slug
                };
                result.push(line);
            }
        }
    
        // sort the result list
        result.sort((a, b) => {
            var o = sort.order === 'asc' ? 1 : -1;
    
            switch (sort.field) {
                case 'city' : 
                    if (a.city === b.city) {
                        return (a.rawdate > b.rawdate) ? 1 : -1;
                    } else {
                        return (a.city > b.city) ? o : -o;
                    }
                    break;
                case 'name' : 
                    if (a.name === b.name) {
                        return (a.rawdate > b.rawdate) ? 1 : -1;
                    } else {
                        return (a.name > b.name) ? o : -o;
                    }
                    break;
                case 'dept' : 
                    if (a.department === b.department) {
                        return (a.rawdate > b.rawdate) ? 1 : -1;
                    } else {
                        return (a.department > b.department) ? o : -o; 
                    }
                    break;
                default : return (a.rawdate > b.rawdate) ? o : -o; break;
            }
        });
    
        res.render('list', {
            baseUrl : config.url + config.context,
            data: result,
            depts: depts.sort(),
            cities : cities.sort(),
            types: types.sort(),
            params : {
                sort : sort,
                filter : filter
            }
        });
    } else {
        res.render('list', {
            baseUrl : config.url + config.context,
            params : {
                sort : sort,
                filter : filter
            }
        });
    }

}
app.listen(config.port);