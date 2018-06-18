const Argv = require('./argv')
const Http = require('http')
const Path = require('path')
const Url = require('url')
const Request = require('request')
const Mock = require('mockjs')
const HttpProxy = require('http-proxy')
const util = require('./util')
const _ = require('lodash')
const Querystring = require('querystring')

class MockHttp {

  constructor(cfg) {
    this.argv = new Argv
    //调试模式
    this.isDebug = util.undef(this.argv.cmd.debug, false)
    this.port = util.undef(this.argv.cmd.port, 2222)
    this.cfg = cfg
    this.map = cfg.map || []

    //代理
    this.proxy = null
    this.initProxy()

    this.startServer()

  }

  setMap(map) {
    this.map = map
  }

  initProxy() {
    this.proxy = new HttpProxy.createProxyServer()
    this.proxy.on('error', function (err, req, res) {

    })

  }

  errorHandling(res, status, msg) {
    res.writeHead(status, {
      'Content-Type': 'text/plain'
    })

    res.end(msg)
  }

  startProxy(req, res, parsed) {
    this.proxy.web(req, res, {
      target: {
        host: parsed.hostname,
        port: 80,
      }
    })
  }

  startServer() {
    let me = this
    Http.createServer(function (request, response) {

      let paramData = ''
      let reqCustom = null //自定义request参数
      let method = request.method.toLowerCase()
      request.on('data', function (data) {
        if (method == 'post') {
          paramData += data
        }
      })
      request.on('end', function (data) {

        let url = request.url,
          from = url,
          parsed = Url.parse(url),
          to = ''
        if (method == 'get') {
          paramData = parsed.query
        }

        if (paramData) {
          reqCustom = {
            method: request.method,
            data: Querystring.parse(paramData)
          }
        }

        if (me.isDebug) {
          util.info('[get] ' + url)
        }

        let rewrite = util.rewrite(me.map, from)
        to = rewrite.url
        to = Path.join(me.cfg.baseRoot, rewrite.url)
        // rewrite
        if (from !== to) {
          util.info('[rewrite] ' + url + ' -> ' + to)

          // local file
          if (!/^https?:\/\//.test(to)) {
            me.mockAjax(response, to, reqCustom, function (isMock, data) {
              if (isMock) {
                util.setResponse(response, 'application/json', JSON.stringify(data), request.headers.origin)
              } else {
                response.setHeader('Access-Control-Allow-Origin', '*')
                // no rewrite
                me.startProxy(request, response, parsed)
              }

            })
            return
          }

          // remote URL
          request.pipe(Request(to)).pipe(response)
          return
        }

        // no rewrite
        me.startProxy(request, response, parsed)
      })

    }).listen(me.port)

    util.info('Rewrite Server runing at port: ' + me.port)
  }

  mockAjax(res, to, reqCustom, fn) {
    try {
      let pwd = Path.resolve(to)
      delete require.cache[require.resolve(pwd)]
      let data = require(pwd)

      let result = data
      if (_.isArray(data)) {
        let index = 0

        data.forEach(function (o, i) {
          if (o.request.method.toLowerCase() == reqCustom.method.toLowerCase() && _.isMatch(reqCustom.data, o.request.data)) {
            index = i
          }
        })
        result = data[index]
      }
      result = Mock.mock(result)
      let status = result.status
      let isMock = result.isMock
      if (/^(4|5|6)\d{2}$/.test(status)) {
        this.errorHandling(res, status, status + 'error')
        return
      }

      //2xx, 3xx
      fn(isMock, Object.assign({
        isMock: 1
      }, result.json))

    } catch (e) {
      this.errorHandling(res, '404', '')
    }

  }
}

module.exports = MockHttp
