Nodeflix
===============
A simple Netflix API client for node.js.

__Netflix has shutdown their API, I'll leave this code up for anyone interested or if they can use any of the oauth stuff, but meh. I guess if you have an API you have a right to shut it down. Maybe they will come out with a better API in the future, who knows.__

Installing
---------------

    npm install nodeflix

Usage Examples
---------------

    var nodeflix = require('./nodeflix');

    var n = new nodeflix({
        consumer_key:       '',
        consumer_secret:    '',
        oauth_token:        '',     // optional, for signed user requests
        oauth_token_secret: '',     // optional, for signed user requests
        user_id:            ''      // optional, for signed user requests
    });

    // get user information (colon prefixed strings will be replaced with matching config option(s) for convenience e.g. ':user_id')
    n.get('/users/:user_id', function() {
        console.log(this.toJSON());
    });

    // lookup something from the people catalog
    n.get('/catalog/people', { term: 'DeNiro' }, function(data) {
        console.log(data);
    });

    // delete something from a user's instant queue
    n.delete('/users/:user_id/queues/instant/saved/60022048', function(data) {
        if(data.status && data.status.status_code == 200) {
            console.log('Item successfully deleted!');
        }
    });

    // add something to a user's instant queue
    n.post('/users/:user_id/queues/instant', { title_ref: '/catalog/titles/series/70158331'}, function(data) {
        if(data.status && data.status.message == 'success') {
            console.log('Item successfully added to instant queue!')
        }
    });

    // also supports simple "deferred-like" (not a true deferred right now) syntax
    n.get('/catalog/people', { term: 'Brad Pitt'}).end(function() {
        console.log(this.toJSON());
    });

    // chaining is all the rage these days
    n.get('/catalog/people', { term: 'Bruce Willis' }).end(function() {
        console.log(this.toJSON());
    }).get('/catalog/titles', { term: 'Voyager'}).end(function() {
        console.log(this.toJSON());
    });

Notes
---------------

This is an unofficial Netflix client. I take no responsibility for how you use it or if it does something bad. 
Please see the complete Netflix API Reference at http://developer.netflix.com/docs/REST_API_Reference. All methods are supported.
Also note you'll need to sign up to Netflix's developer program to get your own consumer_key and consumer_secret to use the API.

To make signed user requests (to manage a user's queue, for instance), you'll also need to provide a valid oauth_token, oauth_token_secret and an encrypted Netflix user_id. More details can be found at Netflix's Authentication documentation and walk-through at:

http://developer.netflix.com/docs/read/Security and http://developer.netflix.com/walkthrough

TODO
----------------

* Built-in pagination in response object (this.next() this.previous(), this.total() etc)
* Better handling of HTTP status codes
* Support oauth token request process for user tokens
* Automatic/On-Demand Object hydration of Netflix-style resource URLs
* Don't sign request for autocomplete style requests/allow it to be turned off

License
----------------
(The MIT License)

Copyright (c) 2012 Johnathan Leppert <johnathan.leppert@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
