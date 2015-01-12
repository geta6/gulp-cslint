'use strict'

stream = require 'map-stream'
through = require 'through2'
{PluginError} = util = require 'gulp-util'

path = require 'path'
coffee = require 'coffee-script'
{CLIEngine} = require 'eslint'



module.exports = cslint = (options = {}) ->

  linter = new CLIEngine migrated options
  verified = (filePath, contents) ->
    compiled = coffee.compile contents, bare: true, sourceMap: true
    result = linter.executeOnText(compiled.js).results[0]
    {filePath, sourceMap: compiled.sourceMap, messages: result?.messages or []}

  stream (file, output) ->
    if linter.isPathIgnored(file.path) or file.isNull()
      output null, file

    else if file.isStream()
      file.contents = file.contents.pipe ->
        content = new Buffer []

        transform = (data) ->
          content = Buffer.concat [content, data]
          @queue data

        flush = ->
          file.eslint = verified file.path, content.toString()
          output null, file
          @emit 'end'

        return through transform, flush

    else
      file.eslint = verified file.path, file.contents.toString 'utf-8'
      output null, file


cslint.format = (formatter, writer) ->
  results = []
  formatter = formattable(formatter)
  writer = writable(writer)

  stream (file, output) ->
    if file?.eslint?
      file.eslint.messages = file.eslint.messages.map (message) ->
        locations = file.eslint.sourceMap.sourceLocation [message.line - 1, message.column - 1]
        locations = unless locations then [0, 0] else [locations[0] + 1, locations[1] + 1]
        message.line = locations[0]
        message.column = locations[1]
        return message
      results.push file.eslint
    output null, file
  .once 'end', ->
    report results, formatter, writer if results.length
    results = []


cslint.failOnError = ->
  stream (file, output) ->
    messages = file?.eslint?.messages or []
    error = null

    messages.some (message) ->
      level = if message.fatal then 2 else message.severity
      level = level[0] if Array.isArray level

      if level > 1
        error = new PluginError 'gulp-cslint',
          name: 'ESLintError'
          fileName: file.path
          message: message.message
          lineNumber: message.line
        return true

    return output error, file


# private api


ifthere = (name) ->
  try return require name
  return null


formattable = (formatter = 'stylish') ->
  if typeof formatter is 'string'
    formatter = ifthere(formatter) or
      ifthere(path.resolve process.cwd(), formatter) or
      ifthere "eslint/lib/formatters/#{formatter}"
    formatter = ifthere formatter if typeof f is 'string'
  if typeof formatter isnt 'function'
    return if arguments[0]? then formattable 'compact' else throw new TypeError 'Invalid Formatter'
  return formatter


writable = (writer) ->
  if !writer
    writer = util.log
  else if typeof writer.write is 'function'
    writer = writer.write.bind writer
  return writer


report = (results = [], formatter, writer) ->
  config = undefined
  results.some (result) ->
    config = result?.config
  message = formatter results, config or {}
  writer message if writable and message isnt null and message isnt ''


migrated = (from, to = {}) ->
  from = configFile: from if typeof from is 'string'
  to[ckey] = from[ckey] for own ckey of from
  if (globals = to.globals or to.global) is null
    if Array.isArray globals
      to.globals = globals
    else
      to.globals = Object.keys(globals).map (key) ->
        return if globals[key] then key + ':true' else key
  if (envs = to.envs or to.env)
    if Array.isArray envs
      to.envs = envs
    else
      to.envs = Object.keys(envs).filter (key) ->
        return envs[key]
  if to.config?
    to.configFile = to.config
  if to.eslintrc?
    to.useEslintrc = to.eslintrc
  return to

