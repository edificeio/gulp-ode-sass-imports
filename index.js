// through2 is a thin wrapper around node transform streams
var through = require('through2');
var gutil = require('gulp-util');
var fs = require('fs');
var glob = require("glob");
var PluginError = gutil.PluginError;
var os = require('os');

var baseTheme = '';

function sassImports(cb){
    var psText = '';
    let n = 2;
    function addFiles(err, files){
        files.forEach(file => {
            file = file .split('.scss')[0].split('_')[0] + file.split('.scss')[0].split('_')[1];
            file = '../../../../../' + file;
            psText += '@import "' + file + '";' + os.EOL;
        });

        n--;
        if(n === 0){
            cb(new Buffer(psText));
        }
    }
    
    glob('./mods/**/public/sass/global/*.scss', addFiles);
    glob('./mods/**/public/sass/' + baseTheme + '/*.scss', addFiles);
}

function stringToStream(text) {
  var stream = through();
  stream.write(text);
  return stream;
}

// Plugin level function(dealing with files)
function gulpSassImports(bt) {
    baseTheme = bt;
    return through.obj(function(file, enc, cb) {
        sassImports(function(generatedImports){
            if (file.isNull()) {
                // return empty file
                return cb(null, file);
            }
            if (file.isBuffer()) {
                file.contents = Buffer.concat([file.contents, generatedImports]);
            }
            if (file.isStream()) {
                file.contents = file.contents.pipe(stringToStream(generatedImports));
            }

            cb(null, file);
        });
    });
}

// Exporting the plugin main function
module.exports = gulpSassImports;