const Path = require('path')
const Watchr = require('watchr')
const Argv = require('./argv')
const MockHttp = require('./mock')
const util = require('./util')

class Main {

  constructor() {
    //命令行配置
    this.argv = new Argv

    //配置文件
    this.cfgFile = ''
    this.cfg = {}
    this.setCfgJSON()

    this.execPlugin()

    this.mock = new MockHttp(this.cfg)

    this.watch()


  }

  setCfgJSON() {
    let cmd = this.argv.cmd
    let file = cmd._.length > 0 ? cmd._[0] : __dirname + '/config/default.js'
    util.debug(file)

    this.cfgFile = Path.resolve(file)
    this.cfg = require(this.cfgFile)
    util.info('reload config: ' + this.cfgFile, ' WATCH ')
    // console.log(this.cfgJSON)
  }

  /**
   * [配置重启]
   */
  watch() {
    let me = this
    Watchr.watch({
      paths: [me.cfgFile],
      listeners: {
        error: function (err) {
          util.error('[watch] ', err)
        },
        change: function () {
          delete require.cache[me.cfgFile]
          me.cfg = require(me.cfgFile)
          me.mock.setMap(me.cfg.map)
          util.info('reload config: ' + me.cfgFile, ' WATCH ')
        }
      }
    })
  }

  /**
   * [插件]
   */
  execPlugin() {
    let root = __dirname
    root = root + '/../plugin'
    try {
      this.cfg.execPlugin(root)
    } catch (e) { }

  }

}

module.exports = Main
