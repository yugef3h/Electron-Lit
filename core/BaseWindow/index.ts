const { remote } = require('electron');
const isRenderProcess: boolean = !!remote;
if (!!remote) {
    module.exports = require('./render');
} else {
    module.exports = require('./main');
}