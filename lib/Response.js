var Response = function(data, response) {
    this.data = JSON.parse(data);
    this.response = response;
    
};

Response.prototype.toString = function() {
    return this.data;
};

Response.prototype.toJSON = function() {
    return this.data;
};

module.exports = Response;
