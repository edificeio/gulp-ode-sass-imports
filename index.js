const through = require('through2');
const gutil = require('gulp-util');
const fs = require('fs');
const glob = require('glob');
const PluginError = gutil.PluginError;
const os = require('os');

function memoize(func) {
    const memoized = function () {
        const args = arguments,
            key = args[0],
            cache = memoized.cache;

        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = func.apply(this, args);
        memoized.cache = cache.set(key, result) || cache;
        return result;
    };
    memoized.cache = new Map();
    return memoized;
}

function generateImportForBaseTheme(baseTheme) {
    const files = glob.sync('./mods/**/public/sass/@(global|' + baseTheme + ')/*.scss');
    return files.map(file => {
        let rfile = file.split('.scss')[0].split('_')[0] + file.split('.scss')[0].split('_')[1];
        rfile = '../../../../../' + rfile;
        return '@import "' + rfile + '";';
    }).join(os.EOL);
}

const memoizedGenerateImportForBaseTheme = memoize(generateImportForBaseTheme);


function appendVersion(contents) {
    return contents.split('</body>').slice(0, 1).join('') +
        '<script>' + os.EOL + 'var springboardBuildDate="' + new Date().toISOString() + '"' + os.EOL + '</script>' + os.EOL +
        '</body></html>';
}

function stringToStream(text) {
    const stream = through();
    stream.write(text);
    return stream;
}

// Plugin level function(dealing with files)
function gulpSassImports(baseTheme) {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }
        if (file.path.indexOf('.html') !== -1) {
            const newFileContents = appendVersion(file.contents.toString());
            if (file.isBuffer()) {
                file.contents = Buffer.from(newFileContents, 'utf8');
            }
            if (file.isStream()) {
                file.contents = stringToStream(newFileContents);
            }

            return cb(null, file);
        } else {
            const generatedImports = new Buffer(memoizedGenerateImportForBaseTheme(baseTheme));
            if (file.isBuffer()) {
                file.contents = Buffer.concat([file.contents, generatedImports]);
            }
            if (file.isStream()) {
                file.contents = file.contents.pipe(stringToStream(generatedImports));
            }

            return cb(null, file);
        }
    });
}

module.exports = gulpSassImports;

