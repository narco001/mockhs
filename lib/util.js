const Iconv = require('iconv-lite')
const Fs = require('fs')
const Url = require('url')
const chalk = require('chalk')
const padStart = require('string.prototype.padstart')
const format = (label, msg) => {
  return msg.split('\n').map((line, i) => {
    return i === 0
      ? `${label} ${line}`
      : padStart(line, chalk.reset(label).length)
  }).join('\n')
}

const chalkTag = msg => chalk.bgBlackBright.white.dim(` ${msg} `)

module.exports = {
  root: 'mockhs',
  host: {}, //移动 pc host
  htmlRoot: {}, //移动 pc html src dist目录
  info(msg, prefix = ' INFO ', tag = null) {
    console.log(format(chalk.bgBlue.black(prefix) + (tag ? chalkTag(tag) : ''), msg))
  },
  error(msg, prefix = ' ERROR ', tag = null) {
    console.error(format(chalk.bgRed(prefix) + (tag ? chalkTag(tag) : ''), chalk.red(msg)))
    if (msg instanceof Error) {
      console.error(msg.stack)
    }
  },
  log(msg = '', tag = null) {
    return tag ? console.log(format(chalkTag(tag), msg)) : console.log(msg)
  },
  debug(msg = '', tag = null) {
    console.log(format(chalk.bgYellow.black(' DEBUG ') + (tag ? chalkTag(tag) : ''), msg))
  },
  undef(before, after) {
    return before ? before : after
  },
  rewrite(map, url) {
    for (var i = 0; i < map.length; i++) {
      let val = map[i]

      let reg = new RegExp('^' + val + '(\\?[^\\?]+)?$', 'g')
      let parsed = Url.parse(url)
      let parsedFrom = Url.parse(val)
      let isEqual = parsed.pathname == parsedFrom.pathname
      //带端口号的请求parsed无host属性
      let isUrl = reg.test(url) || (parsed && isEqual)

      //url匹配
      if (isUrl) {
        return {
          url: val
        }
      }
    }
    return {
      url: url
    }
  },
  setResponse(response, contentType, buffer, origin = '*') {
    response.setHeader('Content-Type', contentType)
    response.setHeader('Access-Control-Allow-Origin', origin)
    response.setHeader('Access-Control-Allow-Credentials', true)
    response.write(buffer)
    response.end()
  },
  readFileSync(filePath, encoding) {
    var buffer = new Buffer('')

    try {
      buffer = Fs.readFileSync(filePath)
    } catch (e) {
    }

    if (!encoding) {
      return buffer
    }

    var fileStr = Iconv.fromEncoding(buffer, encoding)

    return fileStr
  },
}
