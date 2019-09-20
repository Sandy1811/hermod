var nlp = require('compromise');
//const plugin={ patterns: {
		//"define [. .?]": "Word",
		//"what is the definition of [*]": "Word",
		//"what does [*] mean": "Word",
		//"what is the meaning of [*]": "Word",
		//"dictionary lookup [*]": "Word",
		//"look in the dictionary for the word [*]": "Word",
		//"find [*] in the dictionary": "Word"
//}}
////let message = 'define the word red Cat' //'what is the definition of anti freeze'
//let message = 'what does red Cat mean' //'what is the definition of anti freeze'

//nlp.plugin(plugin);
//now nlp will act properly-

let message = 'what about (not this) red things'.replace(/ *\([^)]*\) */g, " ").trim()
let doc = nlp(message);

//return these new tagged-results.
console.log(doc.match('*').out('text'))

