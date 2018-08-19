const fsm = require('./fsm');

// const filepath = process.argv.slice(2, 4);
// console.log(filepath);

const mover = new fsm.Engine('./src', './dest', true);
mover.proc(errors => {
  if (errors.length > 0) {
    errors.forEach(err => {
      console.log(err.message);
    });
  } else {
    console.log('Done');
  }
});
