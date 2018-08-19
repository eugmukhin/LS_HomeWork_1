/* File sort mover */
const fs = require('fs');
const path = require('path');
const { COPYFILE_EXCL } = fs.constants;

class Unit {
  constructor (src, dest, unlink) {
    this.src = src;
    this.dest = dest;
    this.unlink = unlink;
  }

  _handlerr (err, callback) {
    callback(err);
  }

  _doreplace (callback) {
    fs.copyFile(this.src, this.dest, COPYFILE_EXCL, err => {
      if (err) {
        this._handlerr(err, callback);
      } else if (this.unlink) {
        fs.unlink(this.src, err => {
          if (err) {
            this._handlerr(err, callback);
          } else {
            callback();
          }
        });
      } else {
        callback();
      }
    });
  }

  replace (callback) {
    const parsedest = path.parse(this.dest);
    // const parsesrc = path.parse(this.src);

    fs.exists(parsedest.dir, exists => {
      if (!exists) {
        fs.mkdir(parsedest.dir, err => {
          if (err && err.code !== 'EEXIST') {
            this._handlerr(err, callback);
          } else {
            this._doreplace(callback);
          }
        });
      } else {
        this._doreplace(callback);
      }
    });
  }
}

class Engine {
  constructor (src, dest, unlink) {
    this.filesq = [];
    this.dirdelsq = [];
    this.filesqlength = 0;
    this.src = src;
    this.dest = dest;
    this.unlink = unlink;
    this.readstack = [];
    this.errors = [];
  }
  _readdir (dir, callback) {
    this.dirdelsq.unshift(dir);
    this.readstack.push(1);
    fs.readdir(dir, (err, files) => {
      if (err) {
        console.log(err.message);
      } else {
        files.forEach(file => {
          const filepath = path.join(dir, file);
          const stats = fs.statSync(filepath);
          if (stats.isDirectory()) {
            this._readdir(filepath, callback);
          } else {
            this.putfile(filepath, path.join('./dest', file[0].toUpperCase(), file));
          }
        });
      }
      this.readstack.pop();
      // console.log(`this.readstack.length = ${this.readstack.length}`);
      if (this.readstack.length === 0) callback();
    });
  }
  _rmfolders (callback) {
    if (this.errors.length > 0) {
      callback(this.errors);
    } else {
      let stacklength = [];
      this.dirdelsq.forEach(dir => {
        stacklength.push(1);
        fs.rmdir(dir, err => {
          if (err) this.errors.push(err);
          stacklength.pop();
          if (stacklength.length === 0) callback(this.errors);
        });
      });
    }
  }
  _onprocend (callback) {
    if (this.unlink) {
      this._rmfolders(callback);
    } else {
      callback(this.errors);
    }
  }
  proc (callback) {
    this._readdir(this.src, () => {
      let stacklength = [];
      this.filesq.forEach(unit => {
        stacklength.push(1);
        unit.replace(err => {
          if (err) {
            this.errors.push(err);
          } else {
            console.log(`file ${unit.src} copied to ${unit.dest}`);
          }
          stacklength.pop();
          if (stacklength.length === 0) this._onprocend(callback);
        });
      });
    });
  }
  putfile (srcfile, destfile) {
    const unit = new Unit(srcfile, destfile, this.unlink);
    this.filesq.push(unit);
    this.filesqlength++;
    // console.log(`put file src:${fileunit.src} dest:${fileunit.dest}`);
  }
}

module.exports.Engine = Engine;
