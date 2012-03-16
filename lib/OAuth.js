var util         = require('util'),
    http         = require('http'),
    querystring  = require('querystring'),
    EventEmitter = require('events').EventEmitter,
    sha1         = require('./sha1'),
    Response     = require('./Response');

var Auth = function(config) {
    this.config = {
        consumer_key: null,
        consumer_secret: null,
        oauth_token: null,
        oauth_token_secret: null,
        signatureMethod: 'HMAC-SHA1',
        protocol: 'http'
    };

    for(var prop in config) {
        this.config[prop] = config[prop];
    }

    this.parts = [];
};

Auth.prototype.getPath = function(p) {
    var signedParts = this.getSignedParts(p.method, this.config.protocol + '://' + p.host + p.endpoint, this.config.consumer_key, this.config.consumer_secret, p.params, this.config.signatureMethod, this.config.oauth_token, this.config.oauth_token_secret);
    return p.endpoint + '?' + signedParts.body.join('&') + '&oauth_signature=' + this.escape(signedParts.signature);
};

Auth.prototype.getURL = function(p) {
    return this.getSignedURL(p.method, this.config.protocol + '://' + p.endpoint, this.config.consumer_key, this.config.consumer_secret, p.params, this.config.signatureMethod, this.config.oauth_token, this.config.oauth_token_secret);
};

Auth.prototype.getHeaders = function(p) {
    return this.getSignedHeader(p.method, this.config.protocol + '://' + p.endpoint, this.config.consumer_key, this.config.consumer_secret, p.params, this.config.signatureMethod, this.config.oauth_token, this.config.oauth_token_secret);
};

Auth.prototype.getSignedURL = function(method, endpoint, consumer_key, consumer_secret, params, signatureMethod, oauth_token, oauth_token_secret) {
    var signedParts = this.getSignedParts.apply(this, arguments);
    return endpoint + '?' + signedParts.body.join('&') + '&oauth_signature=' + this.escape(signedParts.signature);
};

Auth.prototype.getSignedHeaders = function(method, endpoint, consumer_key, consumer_secret, params, signatureMethod, oauth_token, oauth_token_secret) {
    var signedParts = this.signedParts.apply(this, arguments);
    this.authParts.push(['oauth_signature', signedParts.signature]);

    return this.authParts.sort(this.sort);
};

Auth.prototype.getSignedParts = function(method, endpoint, consumer_key, consumer_secret, params, signatureMethod, oauth_token, oauth_token_secret) {
    this.parts     = [];
    this.authParts = [
        ['oauth_consumer_key',     this.escape(consumer_key)],
        ['oauth_nonce',            this.escape(this.getNonce())],
        ['oauth_signature_method', this.escape(signatureMethod.toUpperCase())],
        ['oauth_timestamp',        this.escape(this.getTimestamp())],
        ['oauth_version',          this.escape('1.0')]
    ];
    if(oauth_token) this.authParts.push(['oauth_token', this.escape(oauth_token)]);
    this.parts = this.parts.concat(this.authParts);

    for(var prop in params) {
        this.parts.push([this.escape(prop), this.escape(params[prop])]);
    }

    this.parts.sort(this.sort);

    var body = this.createBody();
    var head = this.createHead(method, endpoint);

    return {
        body: body,
        signature: this.createSignature(signatureMethod, head, body, consumer_secret, oauth_token_secret)
    };
};

Auth.prototype.createSignature = function(signatureMethod, head, body, consumer_secret, oauth_token_secret) {
    var base = head.join('&') + '&' + this.escape(body.join('&'));
    if(signatureMethod.toUpperCase() == 'HMAC-SHA1') {
        if(oauth_token_secret) return (sha1.HMACSHA1(consumer_secret + '&' + oauth_token_secret, base));
        return sha1.HMACSHA1(consumer_secret + '&', base);
    } else if(signatureMethod.toUpperCase() == 'PLAINTEXT') {
        if(oauth_token_secret) return (consumer_secret + '&' + oauth_token_secret);
        return (consumer_secret + '&');
    }
};

Auth.prototype.createBody = function() {
    var parts = [];
    for(var i = 0, l = this.parts.length; i < l; i++) {
        parts.push(this.parts[i][0] + '=' + this.parts[i][1]);
    }

    return parts;
};

Auth.prototype.createHead = function(method, endpoint) {
    return [method.toUpperCase(), this.escape(endpoint)];
};

// http://oauth.net/core/1.0/ Section 9.1.1:
// "Parameters are sorted by name, using lexicographical byte value ordering. If two or more parameters share the same name, they are sorted by their value."
Auth.prototype.sort = function(a,b) {
    if(a[0] < b[0]) return -1;
    if(a[0] > b[0]) return  1;
    if(a[0] == b[0]) {
        if(a[1] < b[1]) return -1;
        if(a[1] > b[1]) return 1;
    }
};

Auth.prototype.getTimestamp = function() {
    return Math.floor(new Date().getTime()/1000);
};

Auth.prototype.getNonce = function(size) {
    var size  = size || 14,
        nonce = '';
    
    for(var i = 0; i < size; i++) {
        nonce += String.fromCharCode(Math.floor(Math.random() * 10) + 48);
    }

    return nonce;
};

Auth.prototype.escape = function(str) {
    var str = str + '';
    return encodeURIComponent(str)
                .replace("!","%21","g")
                .replace("*","%2A","g")
                .replace("'","%27","g")
                .replace("(","%28","g")
                .replace(")","%29","g")
                .replace("@","%40","g")
                .replace(",","%2C","g")
                .replace(":","%3A","g")
                .replace("/","%2F","g");
};

var Request = function(auth, method, host, path, params) {
    this.auth   = auth;
    this.method = method;
    this.host   = host;
    this.path   = path;
    this.params = params;

    // JSON output
    this.params.output = 'json';

    EventEmitter.call(this);
}

util.inherits(Request, EventEmitter);

Request.prototype.end = function(callback) {
    this.request = this.performRequest(callback);
    this.request.end();

    return this;
};

Request.prototype.performRequest = function(callback) {
    var action = this.method.toLowerCase();

    switch(action) {
        case 'get':
            return http.request({
                    host: this.host,
                    port: this.auth.config.protocol == 'http' ? 80 : 443,
                    path: this.auth.getPath({
                        method: this.method,
                        host: this.host,
                        endpoint: this.path,
                        params: this.params
                    }),
                    method: this.method.toUpperCase()
                }, this.processResponse(callback)
            );
        break;

        case 'post':
            return http.request({
                    host: this.host,
                    port: this.auth.config.protocol == 'http' ? 80 : 443,
                    path: this.auth.getPath({
                        method: this.method,
                        host: this.host,
                        endpoint: this.path,
                        params: this.params
                    }),
                    method: this.method.toUpperCase()
                }, this.processResponse(callback)
            );
        break;

        case 'put':
            return http.request({
                    host: this.host,
                    port: this.auth.config.protocol == 'http' ? 80 : 443,
                    path: this.auth.getPath({
                        method: this.method,
                        host: this.host,
                        endpoint: this.path,
                        params: this.params
                    }),
                    method: this.method.toUpperCase()
                }, this.processResponse(callback)
            );
        break;

        case 'delete':
            return http.request({
                    host: this.host,
                    port: this.auth.config.protocol == 'http' ? 80 : 443,
                    path: this.auth.getPath({
                        method: this.method,
                        host: this.host,
                        endpoint: this.path,
                        params: this.params
                    }),
                    method: this.method.toUpperCase()
                }, this.processResponse(callback)
            );
        break;

        default:
            throw new Error('Method: ' + this.method + ' not supported');
    }
};

Request.prototype.processResponse = function(callback) {
    var self = this;

    return function(response) {
        response.setEncoding('utf8');
        var data = '';
        response.on('data', function(part) {
            data += part;
        });
        response.on('end', function() {
            this.response = new Response(data, response);
            callback.call(this.response, data, this);
        });
    };
};

module.exports = { Request: Request, Auth: Auth };
