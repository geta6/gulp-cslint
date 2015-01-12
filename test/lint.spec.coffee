'use strict'

path = require 'path'

describe 'module', ->
  it 'should require-able', ->
    require path.resolve '.'

