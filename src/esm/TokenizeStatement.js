// From https://github.com/OpenNMS/flot-legend/blob/master/src/main.js

export default function tokenizeGprintStatement(value) {

  var stack = [], tokens = [], types = {}, lfRegex = /^%(\d*)(\.(\d+))?lf/;

  var accountForTokenType = function(type) {
      if (types.hasOwnProperty(type)) {
          types[type] += 1;
      } else {
          types[type] = 1;
      }
  };

  var numTokensWithType = function(type) {
      return types.hasOwnProperty(type) ? types[type] : 0;
  };

  var pushToken = function(token) {
      if (stack.length > 0) {
          tokens.push({
              type: TOKENS.Text,
              value: stack.join('')
          });
          stack = [];
          accountForTokenType(TOKENS.Text);
      }

      if (token !== undefined) {
          tokens.push(token);
          accountForTokenType(token.type);
      }
  };

  for (var i = 0, len = value.length; i < len; i++) {

      var c = value[i];
      // Grab the next character, bounded by the size of the string
      var nextc = value[Math.min(i+1, len - 1)];
      var match;

      if (c === '%' && nextc === 'g') {

          pushToken({
              type: TOKENS.Badge
          });

          i++;
      } else if (c === '%' && nextc === 's') {

          pushToken({
              type: TOKENS.Unit
          });

          i++;
      } else if (c === '%' && nextc === '%') {

          stack.push('%');

          i++;
      } else if (c == '\\' && nextc == 'n') {

          pushToken({
              type: TOKENS.Newline
          });

          i++;
      } else if (c == '\\' && nextc == 'l') {

          pushToken({
              type: TOKENS.Newline
          });

          i++;
      } else if (c == '\\' && nextc == 's') {

          pushToken({
              type: TOKENS.Newline
          });

          i++;
      } else if ( (match = lfRegex.exec(value.slice(i))) !== null) {
          var length = NaN;
          try {
              length = parseInt(match[1]);
          } catch(err) {
              // pass
          }
          var precision = NaN;
          try {
              precision = parseInt(match[3]);
          } catch(err) {
              // pass
          }

          pushToken({
              type: TOKENS.Lf,
              length: isNaN(length) ? null : length,
              precision: isNaN(precision) ? null : precision
          });

          i += match[0].length - 1;
      } else {
          stack.push(c);
      }
  }

  // Always add a space to the end of the statement if there was a badge printed
  if (numTokensWithType(TOKENS.Badge) > 0) {
      stack.push(" ");
  }

  // Add a space after the %lf statement if there is no unit
  if (numTokensWithType(TOKENS.Lf) > 0 && numTokensWithType(TOKENS.Unit) === 0 && tokens[tokens.length - 1].type === TOKENS.Lf) {
      stack.push(" ");
  }

  // Convert any remaining characters on the stack to a text token
  pushToken();

  return tokens;
}
