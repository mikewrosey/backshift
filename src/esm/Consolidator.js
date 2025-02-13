/**
 * References:
 *   http://oss.oetiker.ch/rrdtool/doc/rrdgraph_data.en.html
 *   http://oss.oetiker.ch/rrdtool/doc/rrdgraph_rpn.en.html
 *
 * > Note that currently only aggregation functions work in VDEF rpn expressions.
 *
 * RRDtool currently supports a very limited subset of expressions - they must have the following form:
 * 'SERIES,[PARAMETER,]FUNCTION' whereas SERIES is a existing series and PARAMETER is a value.
 *
 * @author fooker
 */
const Consolidator = function() {
  var functions = {};

  var clazz = {
    initialize: function () {
    },

    parse: function(tokens) {
      // Split tokens if a single expression is passed
      if (typeof tokens === 'string') {
        tokens = tokens.split(",");
      }

      var metricName = tokens.shift();

      var functionName = tokens.pop().toLowerCase();
      if (!(functionName in functions)) {
        const msg = 'Unknown correlation function: ' + functionName
        console.log("Error: " + msg);
        throw "Error: " + msg;
      }

      if (tokens.length > 1) {
        const msg = 'Too many input values in RPN express. RPN: ' + tokens
        console.log("Error: " + msg);
        throw "Error: " + msg;
      }

      var argument = parseFloat(tokens[0]); // The remaining token is used as parameter

      return functions[functionName](metricName, argument);
    },
  };

  function valid(value) {
    return !isNaN(value) && isFinite(value);
  }

  function forEach(timestamps, values, cb) {
    var validCount = 0;
    for (var i = 0; i < timestamps.length; i++) {
      if (!valid(values[i])) {
        continue;
      }

      validCount++;

      cb(timestamps[i], values[i]);
    }

    return validCount;
  }


  function parseResponse(json) {
    var k, columns, columnNames, columnNameToIndex, constants, parts,
        numMetrics = json.labels.length;

    columns = new Array(1 + numMetrics);
    columnNames = new Array(1 + numMetrics);
    columnNameToIndex = {};

    columns[0] = json.timestamps;
    columnNames[0] = 'timestamp';
    columnNameToIndex['timestamp'] = 0;

    for (k = 0; k < numMetrics; k++) {
      columns[1 + k] = json.columns[k].values;
      columnNames[1 + k] = json.labels[k];
      columnNameToIndex[columnNames[1 + k]] = 1 + k;
    }

    if (json.constants) {
      constants = {};
      for (var c=0, len=json.constants.length, key, value, label; c < len; c++) {
        key = json.constants[c].key;
        value = json.constants[c].value;

        // All of the constants are prefixed with the label of the associated source, but
        // the graph definitions don't support this prefix, so we just cut the prefix
        // off the constant name
        parts = key.split('.');
        if (parts.length > 1) {
          key = parts[1];
          constants[key] = (value === undefined? null: value);
        }
      }
    }

    return {
      columns: columns,
      columnNames: columnNames,
      columnNameToIndex: columnNameToIndex,
      constants: constants
    };
  }

  function wrap(func) {
    return function (metricName, argument) {
      return {
        metricName: metricName,
        functionName: func.name,
        argument: argument,

        consolidate: function (measurementResponse) {
          const data = parseResponse(measurementResponse)

          return func(data.columns[data.columnNameToIndex["timestamp"]],
                      data.columns[data.columnNameToIndex[metricName]],
                      argument);
        },
      };
    };
  }

  clazz['minimum'] = functions['minimum'] = wrap(function minimum(timestamps, values) {
    var minimumTimestamp = undefined;
    var minimumValue = NaN;

    forEach(timestamps, values, function(timestamp, value) {
      if (isNaN(minimumValue) || value < minimumValue) {
        minimumTimestamp = timestamp;
        minimumValue = value;
      }
    });

    return [minimumTimestamp, minimumValue];
  });

  clazz['maximum'] = functions['maximum'] = wrap(function maximum(timestamps, values) {
    var maximumTimestamp = undefined;
    var maximumValue = NaN;

    forEach(timestamps, values, function(timestamp, value) {
      if (isNaN(maximumValue) || value > maximumValue) {
        maximumTimestamp = timestamp;
        maximumValue = value;
      }
    });

    return [maximumTimestamp, maximumValue];
  });

  clazz['average'] = functions['average'] = wrap(function average(timestamps, values) {
    var sum = 0.0;

    var cnt = forEach(timestamps, values, function(timestamp, value) {
      sum += value;
    });

    return [undefined, (sum / cnt)];
  });

  clazz['stdev'] = functions['stdev'] = wrap(function stdev(timestamps, values) {
    var sum = 0.0;

    var cnt = forEach(timestamps, values, function(timestamp, value) {
      sum += value;
    });

    var avg = (sum / cnt);

    var dev = 0.0;
    forEach(timestamps, values, function(timestamp, value) {
      dev += Math.pow((value - avg), 2.0);
    });

    return [undefined, Math.sqrt(dev / cnt)];
  });

  clazz['last'] = functions['last'] = wrap(function last(timestamps, values) {
    for (var i = timestamps.length - 1; i >= 0; i--) {
      if (valid(values[i])) {
        return [timestamps[i], values[i]];
      }
    }

    return [undefined, NaN];
  });

  clazz['first'] = functions['first'] = wrap(function first(timestamps, values) {
    for (var i = 0; i < timestamps.length; i++) {
      if (valid(values[i])) {
        return [timestamps[i], values[i]];
      }
    }

    return [undefined, NaN];
  });

  clazz['total'] = functions['total'] = wrap(function total(timestamps, values) {
    var sum = 0.0;
    var cnt = 0;

    // As we don't have a fixed step size, we can't include the first sample as RRDTool does
    for (var i = 1; i < timestamps.length; i++) {
      if (valid(values[i])) {
        sum += values[i] * (timestamps[i] - timestamps[i - 1]) / 1000.0;
        cnt += 1;
      }
    }

    if (cnt > 0) {
      return [undefined, sum];
    } else {
      return [undefined, NaN];
    }
  });

  clazz['percent'] = functions['percent'] = wrap(function percent(timestamps, values, argument) {
    var sortedValues = Array();
    for (var i = 0; i < timestamps.length; i++) {
      sortedValues.push(values[i]);
    }

    sortedValues.sort(function (a, b) {
      if (isNaN(a))
        return -1;
      if (isNaN(b))
        return 1;

      if (a == Number.POSITIVE_INFINITY)
          return 1;
      if (a == Number.NEGATIVE_INFINITY)
          return -1;
      if (b == Number.POSITIVE_INFINITY)
        return -1;
      if (b == Number.NEGATIVE_INFINITY)
        return 1;

      if (a < b)
        return -1;
      else
        return 1;
    });

    return [undefined, sortedValues[Math.round(argument * (sortedValues.length - 1) / 100.0)]];
  });

  clazz['percentnan'] = functions['percentnan'] = wrap(function percentnan(timestamps, values, argument) {
    var sortedValues = Array();
    forEach(timestamps, values, function(timestamp, value) {
      sortedValues.push(value);
    });

    sortedValues.sort();

    return [undefined, sortedValues[Math.round(argument * (sortedValues.length - 1) / 100.0)]];
  });

  // For backward compatibility with deprecated (G)PRINT syntax:
  functions['min'] = functions['minimum'];
  functions['max'] = functions['maximum'];

  return clazz;
};

export default Consolidator
