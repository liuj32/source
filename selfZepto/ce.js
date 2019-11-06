var data = 'windows 88 is ok';
// data.match(/windows (?=\d+)/);  // ["windows "]
// data.match(/windows (?:\d+)/);  // ["windows 98"]
// data.match(/windows (\d+)/);    // ["windows 98", "98"]
console.log(data.match(/windows (\d)(\d)/))