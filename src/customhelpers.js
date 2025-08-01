const path = require("path");
const partialsPath = path.join(__dirname, "./templates/partials");
const hbs = require("hbs");
hbs.registerPartials(partialsPath);
const moment = require('moment');

hbs.registerHelper("equal", require("handlebars-helper-equal"));
hbs.registerHelper("dateFormat", require("handlebars-dateformat"));

hbs.registerHelper("check", function (value, comparator) {
  return value === comparator ? "" : value;
});

hbs.registerHelper("displayStatus", function (status) {
    return status == "Y" ? "Active" : "Inactive";
  });

hbs.registerHelper("toUpperCase", function (str) {
  return str.toUpperCase();
});

hbs.registerHelper('incremented', function (index) {
  index++;
  return index;
});

hbs.registerHelper("replace", function (find, replace, options) {
  var string = options.fn(this);
  return string.replace(find, replace);
});

hbs.registerHelper("if_eq", function (a, b, opts) {
  if (a == b) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
});

hbs.registerHelper("formatNumber", function (distance) {
  return distance.toFixed(2);
});

hbs.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper("multiply", function (a, b) {
  return (a * b).toFixed(2);
});
hbs.registerHelper("divide", function (a, b) {
  return (a / b).toFixed(2);
});
hbs.registerHelper("substract", function (a, b) {
  return (a - b).toFixed(2);
});
hbs.registerHelper("sum", function (a, b) {
  return parseFloat(a) + parseFloat(b);
});
hbs.registerHelper("equalnumbers", function (arg1, arg2, options) {
  return parseFloat(arg1) == parseFloat(arg2) ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper('gt', function( a, b ){
	var next =  arguments[arguments.length-1];
	return (a > b) ? next.fn(this) : next.inverse(this);
});
hbs.registerHelper("trimString", function (passedString) {
  var theString = passedString.substring(0, 35) + "...";
  return new hbs.SafeString(theString);
});
hbs.registerHelper("select", function (selected, options) {
  return options
    .fn(this)
    .replace(new RegExp(' value="' + selected + '"'), '$& selected="selected"');
});
hbs.registerHelper("selectHelper", function (selected, options) {
  var html = options.fn(this);
  if (selected) {
    var values = selected.split(",");
    var length = values.length;

    for (var i = 0; i < length; i++) {
      html = html.replace(
        new RegExp(' value="' + values[i] + '"'),
        '$& selected="selected"'
      );
    }
  }
  return html;
});

hbs.registerHelper('splitString', function(str, delimiter, options) {
  return str.split(delimiter).map(function(item) {
    return options.fn(item);
  }).join('');
});

hbs.registerHelper("userFriendlyTitle", function (path) {
  console.log("path",path);
  if(path == '/'){
    return "Dashboard";
  } else {
    return path
      .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
      .replace(/[-_]/g, ' ')   // Replace dashes and underscores with spaces
      .split(' ')              // Split into words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize
      .join(' '); 
  }
  
});
