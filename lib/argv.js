const Optimist = require('optimist')
const Fs = require('fs')
const util = require('./util.js')

class Argv {

  constructor() {
    this.opt = Optimist
    this.cmd = this.opt.usage([
      'Usage: mockhs /path/to/config.js --port=[number]\n\n',
      'Examples:\n',
      'mockhs ./config/my.js\n',
      'mockhs ./config/my.js --port=8080'
    ].join('')).argv
    this.showHelp()
    this.showVersion()
  }

  showHelp() {
    let argv = this.cmd
    if (argv.help || argv.h) {
      this.opt.showHelp()
      process.exit()
    }
  }

  showVersion() {
    let argv = this.cmd
    if (argv.version || argv.v) {
      var packageInfo = JSON.parse(Fs.readFileSync(__dirname + '/../package.json', 'utf-8'))
      util.log(packageInfo.version)
      process.exit()
    }
  }

}

module.exports = Argv