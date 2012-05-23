var util         = require('util'),
    EventEmitter = require('events').EventEmitter,
    Auth         = require('./lib/OAuth').Auth,
    OAuthRequest = require('./lib/OAuth').Request;

var NodeFlix = function(config, endPoints) {
    this.config = config;
    this.endPoints = {
        host:                   'api.netflix.com',
        oauth_request_url:      'http://api.netflix.com/oauth/request_token',
        oauth_access_url:       'http://api.netflix.com/oauth/access_token'
    };

    copyTo(endPoints, this.endPoints);
    
    this.auth = new Auth(this.config);
};

var copyTo = function(source, dest) {
    for (var prop in source) {
        dest[prop] = source[prop];   
    }
};

NodeFlix.prototype = {
    get: function(path, params, callback) {
        return this.request('GET', path, params, callback);
    },
    post: function(path, params, callback) {
        return this.request('POST', path, params, callback);
    },
    put: function(path, params, callback) {
        return this.request('PUT', path, params, callback);
    },
    delete: function(path, params, callback) {
        return this.request('DELETE', path, params, callback);
    },

    request: function(method, path, params, callback) {
        if(typeof(params) === 'function') {
            callback = params;
            params = {};
        }

        for(var prop in this.config) {
            path = path.replace(':' + prop, this.config[prop], 'g');
        }

        var req = new OAuthRequest(this.auth, method, this.endPoints.host,  path, params);

        if(typeof(callback) === 'function') {
            return req.end(callback);
        } else {
            return req;
        }
    }
};

module.exports = NodeFlix;
