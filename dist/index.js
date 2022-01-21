const Consolidator=function(){var o={},t={initialize:function(){},parse:function(t){var r=(t="string"==typeof t?t.split(","):t).shift(),n=t.pop().toLowerCase();if(!(n in o)){var e="Unknown correlation function: "+n;throw console.log("Error: "+e),"Error: "+e}if(1<t.length){e="Too many input values in RPN express. RPN: "+t;throw console.log("Error: "+e),"Error: "+e}t=parseFloat(t[0]);return o[n](r,t)}};function i(t){return!isNaN(t)&&isFinite(t)}function s(t,r,n){for(var e=0,o=0;o<t.length;o++)i(r[o])&&(e++,n(t[o],r[o]));return e}function r(e){return function(r,n){return{metricName:r,functionName:e.name,argument:n,consolidate:function(t){t=function(t){var r,n,e=t.labels.length,o=new Array(1+e),i=new Array(1+e),s={};for(o[0]=t.timestamps,i[0]="timestamp",r=s.timestamp=0;r<e;r++)o[1+r]=t.columns[r].values,i[1+r]=t.labels[r],s[i[1+r]]=1+r;if(t.constants)for(var a,h,p={},u=0,c=t.constants.length;u<c;u++)a=t.constants[u].key,h=t.constants[u].value,1<(n=a.split(".")).length&&(p[a=n[1]]=void 0===h?null:h);return{columns:o,columnNames:i,columnNameToIndex:s,constants:p}}(t);return e(t.columns[t.columnNameToIndex.timestamp],t.columns[t.columnNameToIndex[r]],n)}}}}return t.minimum=o.minimum=r(function(t,r){var n=void 0,e=NaN;return s(t,r,function(t,r){(isNaN(e)||r<e)&&(n=t,e=r)}),[n,e]}),t.maximum=o.maximum=r(function(t,r){var n=void 0,e=NaN;return s(t,r,function(t,r){(isNaN(e)||e<r)&&(n=t,e=r)}),[n,e]}),t.average=o.average=r(function(t,r){var n=0,r=s(t,r,function(t,r){n+=r});return[void 0,n/r]}),t.stdev=o.stdev=r(function(t,r){var n=0,e=s(t,r,function(t,r){n+=r}),o=n/e,i=0;return s(t,r,function(t,r){i+=Math.pow(r-o,2)}),[void 0,Math.sqrt(i/e)]}),t.last=o.last=r(function(t,r){for(var n=t.length-1;0<=n;n--)if(i(r[n]))return[t[n],r[n]];return[void 0,NaN]}),t.first=o.first=r(function(t,r){for(var n=0;n<t.length;n++)if(i(r[n]))return[t[n],r[n]];return[void 0,NaN]}),t.total=o.total=r(function(t,r){for(var n=0,e=0,o=1;o<t.length;o++)i(r[o])&&(n+=r[o]*(t[o]-t[o-1])/1e3,e+=1);return 0<e?[void 0,n]:[void 0,NaN]}),t.percent=o.percent=r(function(t,r,n){for(var e=Array(),o=0;o<t.length;o++)e.push(r[o]);return e.sort(function(t,r){return isNaN(t)||!isNaN(r)&&t!=Number.POSITIVE_INFINITY&&(t==Number.NEGATIVE_INFINITY||r==Number.POSITIVE_INFINITY||r!=Number.NEGATIVE_INFINITY&&t<r)?-1:1}),[void 0,e[Math.round(n*(e.length-1)/100)]]}),t.percentnan=o.percentnan=r(function(t,r,n){var e=Array();return s(t,r,function(t,r){e.push(r)}),e.sort(),[void 0,e[Math.round(n*(e.length-1)/100)]]}),o.min=o.minimum,o.max=o.maximum,t},RpnToJexlConverter={initialize:function(){this.operators={},this._buildOperators()},_buildOperators:function(){function t(n){return function(t){var r=t.pop();return"("+t.pop()+" "+n+" "+r+")"}}function r(e,o){return function(t){for(var r=e+"(",n=0;n<o;n++)r+=t.pop()+",";return r.substring(0,r.length-1)+")"}}function n(n){return function(t){var r=t.pop();return"("+t.pop()+" "+n+" "+r+" ? 1 : 0)"}}function e(n){return function(t){var r=t.pop(),t=t.pop();return"( ( "+t+" == NaN ) ? "+r+" : ( ( "+r+" == NaN ) ? "+t+" : ( "+n+"("+r+","+t+") ) ) )"}}this.operators["+"]=t("+"),this.operators["-"]=t("-"),this.operators["*"]=t("*"),this.operators["/"]=t("/"),this.operators["%"]=t("%"),this.operators.IF=function(t){var r=t.pop(),n=t.pop();return"("+t.pop()+" != 0 ? "+n+" : "+r+")"},this.operators.UN=function(t){return"( ("+t.pop()+" == NaN) ? 1 : 0)"},this.operators.LT=n("<"),this.operators.LE=n("<="),this.operators.GT=n(">"),this.operators.GE=n(">="),this.operators.EQ=n("=="),this.operators.NE=n("!="),this.operators.MIN=r("math:min",2),this.operators.MAX=r("math:max",2),this.operators.MINNAN=e("math:min"),this.operators.MAXNAN=e("math:max"),this.operators.ISINF=function(t){t=t.pop();return"( ("+t+" == __inf) || ("+t+" == __neg_inf) ? 1 : 0)"},this.operators.LIMIT=function(t){var r=t.pop(),n=t.pop(),t=t.pop();return"( ( ("+n+" == __inf) || ("+n+" == __neg_inf) || ("+r+" == __inf) || ("+r+" == __neg_inf) || ("+t+" == __inf) || ("+t+" == __neg_inf) || ("+t+" < "+n+") || ("+t+" > "+r+") ) ? NaN : "+t+" )"},this.operators.ADDNAN=function(t){var r=t.pop(),t=t.pop();return"( ( ( "+t+" == NaN ) && ( "+r+" == NaN ) ) ? NaN : ( ( "+t+" == NaN ) ? "+r+" : ( ( "+r+" == NaN ) ? "+t+" : ( "+t+" + "+r+" ) ) ) )"},this.operators.SIN=r("math:sin",1),this.operators.COS=r("math:cos",1),this.operators.LOG=r("math:log",1),this.operators.EXP=r("math:exp",1),this.operators.SQRT=r("math:sqrt",1),this.operators.ATAN=r("math:atan",1),this.operators.ATAN2=function(t){var r=t.pop();return"math:atan2("+t.pop()+","+r+")"},this.operators.FLOOR=r("math:floor",1),this.operators.CEIL=r("math:ceil",1),this.operators.RAD2DEG=r("math:toDegrees",1),this.operators.DEG2RAD=r("math:toRadians",1),this.operators.ABS=r("math:abs",1),this.operators.UNKN=function(){return"NaN"},this.operators.INF=function(){return"__inf"},this.operators.NEGINF=function(){return"__neg_inf"},this.operators["{diffTime}"]=function(){return"(__diff_time / 1000)"}},convert:function(t){this.initialize();for(var r,n=[],e=t.split(","),o=e.length,i=0;i<o;i++)r=e[i],this._isOperator(r)?n.push(this._toExpression(r,n)):n.push(r);if(1===n.length)return n.pop();t="Too many input values in RPN express. RPN: "+t+" Stack: "+JSON.stringify(n);throw console.log("Error: "+t),"Error: "+t},_isOperator:function(t){return t in this.operators},_toExpression:function(t,r){return this.operators[t](r)}},RrdGraphVisitor={initialize:function(t){this.onInit(t)},onInit:function(t){},_visit:function(t){for(var r,n,e,o,i,s,a,h,p,u,c,l,m,f={parse:function(t,r){for(var n=[],e=!1,o="",i=t.length,s=0;s<i;s++)" "!==t.charAt(s)||e?('"'===t.charAt(s)&&r&&(e=!e),o+=t.charAt(s)):(n.push(o),o="");return n.push(o),n}}.parse(t.command,!0),d=f.length,N=0;N<d;N++){if(0===f[N].indexOf("--")){if(null===(r=/--(.*)=(.*)/.exec(f[N])))continue;"title"===r[1]?this._onTitle(this.displayString(this._decodeString(r[2]))):"vertical-label"===r[1]&&this._onVerticalLabel(this.displayString(this._decodeString(r[2])))}null!==(r=f[N].match(/(\\.|[^:])+/g))&&("DEF"===(n=r[0])?(e=(a=r[1].split("="))[0],o=a[1],i=r[2],h=r[3],this._onDEF(e,o,i,h)):"CDEF"===n?(e=(a=r[1].split("="))[0],s=a[1],this._onCDEF(e,s)):"VDEF"===n?(e=(a=r[1].split("="))[0],s=a[1],this._onVDEF(e,s)):n.match(/LINE/)?(h=parseInt(/LINE(\d+)/.exec(n).toString()),p=(a=r[1].split("#"))[0],u=this._getColor(a[1]),c=this._decodeString(r[2]),this._onLine(p,u,c,h)):"AREA"===n?(p=(a=r[1].split("#"))[0],u=this._getColor(a[1]),c=this._decodeString(r[2]),this._onArea(p,u,c)):"STACK"===n?(p=(a=r[1].split("#"))[0],u=this._getColor(a[1]),c=this._decodeString(r[2]),this._onStack(p,u,c)):"GPRINT"===n?(m=3===r.length?(p=r[1],l=void 0,this._decodeString(r[2])):(p=r[1],l=r[2],this._decodeString(r[3])),this._onGPrint(p,l,m)):"COMMENT"===n&&(m=this._decodeString(r[1]),this._onComment(m)))}},_getColor:function(t){if(void 0!==t&&""!==t)return"#"+t},_onTitle:function(t){},_onVerticalLabel:function(t){},_onDEF:function(t,r,n,e){},_onCDEF:function(t,r){},_onVDEF:function(t,r){},_onLine:function(t,r,n,e){},_onArea:function(t,r,n){},_onStack:function(t,r,n){},_onGPrint:function(t,r,n){},_onComment:function(t){},_seriesName:function(t){},_decodeString:function(t){return void 0===t?t:t=(t=t.replace(/"/g,"")).replace("\\:",":")},displayString:function(t){return void 0===t?t:t=(t=t.replace("\\n","")).trim()}},RrdGraphConverter={getData:function(t){return this.onInit(t),this.model},onInit:function(t){var r;for(this.graphDef=t.graphDef,this.resourceId=t.resourceId,this.convertRpnToJexl=void 0===t.convertRpnToJexl||t.convertRpnToJexl,this.model={metrics:[],values:[],series:[],printStatements:[],properties:{}},this.consolidator=Consolidator(),a=0,h=this.graphDef.propertiesValues.length;a<h;a++)r=this.graphDef.propertiesValues[a],this.model.properties[r]=void 0;for(this._visit(this.graphDef),a=0,h=this.model.values.length;a<h;a++){var n=this.model.values[a].expression.metricName;if(void 0!==n){for(var e=!1,o=0,i=this.model.series.length;o<i;o++)if(n===this.model.series[o].metric){e=!0;break}e||this.model.series.push({metric:n,type:"hidden"})}}for(var s={},a=0,h=this.model.series.length;a<h;a++)s[this.model.series[a].metric]=1;for(a=0,h=this.model.metrics.length;a<h;a++)(n=this.model.metrics[a]).transient=!(n.name in s)},_onTitle:function(t){this.model.title=t},_onVerticalLabel:function(t){this.model.verticalLabel=t},_onDEF:function(t,r,n,e){r=parseInt(/\{rrd(\d+)}/.exec(r)[1])-1,r=this.graphDef.columns[r];this.prefix=t,this.model.metrics.push({name:t,attribute:r,resourceId:this.resourceId,datasource:n,aggregation:e})},_expressionRegexp:new RegExp("\\{([^}]*)}","g"),_onCDEF:function(t,r){var n=r;this.convertRpnToJexl&&(n=RpnToJexlConverter.convert(r)),this.prefix&&(n=n.replace(this._expressionRegexp,this.prefix+".$1")),this.model.metrics.push({name:t,expression:n})},_onVDEF:function(t,r){this.model.values.push({name:t,expression:this.consolidator.parse(r)})},_onLine:function(t,r,n,e){r={name:this.displayString(n),metric:t,type:"line",color:r};this.maybeAddPrintStatementForSeries(t,n),this.model.series.push(r)},_onArea:function(t,r,n){r={name:this.displayString(n),metric:t,type:"area",color:r};this.maybeAddPrintStatementForSeries(t,n),this.model.series.push(r)},_onStack:function(t,r,n){r={name:this.displayString(n),metric:t,type:"stack",color:r,legend:n};this.maybeAddPrintStatementForSeries(t,n),this.model.series.push(r)},_onGPrint:function(t,r,n){var e;void 0===r?this.model.printStatements.push({metric:t,format:n}):(e=t+"_"+r+"_"+Math.random().toString(36).substring(2),this.model.values.push({name:e,expression:this.consolidator.parse([t,r])}),this.model.printStatements.push({metric:e,format:n}))},_onComment:function(t){this.model.printStatements.push({format:t})},maybeAddPrintStatementForSeries:function(t,r){null!=r&&""!==r&&this.model.printStatements.push({metric:t,value:NaN,format:"%g "+r})}};var RrdGraphConverter$1=Object.assign(RrdGraphVisitor,RrdGraphConverter);export{RrdGraphConverter$1 as RrdGraphConverter};
