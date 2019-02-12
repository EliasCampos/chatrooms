const assert = require('assert');
const classes = require('../server/sources/classes.js')
const funcs = require('../server/sources/functions.js');

/* Tests */

// htmlSpecialChars:
let htmlExamples = [
  "<a href='test'>Test</a>",
  "<style>body{color:red}</style>",
  "<script>alert(\"Cookies:\", document.cookie)</script>"
];
let htmlParseExpected = [
  "&lt;a href=&#039;test&#039;&gt;Test&lt;/a&gt;",
  "&lt;style&gt;body{color:red}&lt;/style&gt;",
  "&lt;script&gt;alert(&quot;Cookies:&quot;, document.cookie)&lt;/script&gt;"
];
testFunctionOutput(
  funcs.replaceHTMLSpecialChars,
  htmlExamples,
  htmlParseExpected,
  "replaceHTMLSpecialChars"
);
// cookie Parser:
let cookieExamples = [
  "name=value",
  "name=value; name2=value2; name3=value3",
  "PHPSESSID=298zf09hf012fh2; csrftoken=u32t4o3tb3gg43; _gat=1;"
]
let expectedCookieObjects = [
  Object.create(null),
  Object.create(null),
  Object.create(null)
]
expectedCookieObjects[0]["name"] = "value";
expectedCookieObjects[1]["name"] = "value";
expectedCookieObjects[1]["name2"] = "value2";
expectedCookieObjects[1]["name3"] = "value3";
expectedCookieObjects[2]["PHPSESSID"] = "298zf09hf012fh2";
expectedCookieObjects[2]["csrftoken"] = "u32t4o3tb3gg43";
expectedCookieObjects[2]["_gat"] = "1";
testFunctionOutput(
  classes.Cookie.parse,
  cookieExamples,
  expectedCookieObjects,
  'parseCookies'
);

/* Test Functions: */

function testFunctionOutput(func, examples, expected, funcName) {
  console.log(`Testing '${funcName}':` );
  try {
    assert.deepStrictEqual(examples.map(func), expected);
    console.log(" OK: Function has passed the test.");
  } catch(err) {
    if (err instanceof assert.AssertionError) {
      console.log(" Fail: Function has failed Test:");
      console.log(err.message);
    } else {
      console.error("Unpredictible Error:");
      console.error(err);
    }
  }
}
