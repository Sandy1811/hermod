var nlp = require('compromise');

const utils = {
	//https://ourcodeworld.com/articles/read/608/how-to-camelize-and-decamelize-strings-in-javascript
	/**
	 * Decamelizes a string with/without a custom separator (underscore by default).
	 * 
	 * @param str String in camelcase
	 * @param separator Separator for the new decamelized string.
	 */
	decamelize: function(str, separator){
		separator = typeof separator === 'undefined' ? '_' : separator;

		return str
			.replace(/([a-z\d])([A-Z])/g, '$1' + separator + '$2')
			.replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + separator + '$2')
			.toLowerCase();
	},
	/**
	 * Camelize a string, cutting the string by multiple separators like
	 * hyphens, underscores and spaces.
	 * 
	 * @param {text} string Text to camelize
	 * @return string Camelized text
	 */
	camelize: function(text) {
		return text.replace(/^([A-Z])|[\s-_]+(\w)/g, function(match, p1, p2, offset) {
			if (p2) return p2.toUpperCase();
			return p1.toLowerCase();        
		});
	},

	last_user_utterance: function(tracker) {
		//console.log(['lu',tracker.events])
		if (tracker && tracker.events) {
			let utterances = []
			tracker.events.map(function(event) {
				if (event.event === 'user') {utterances.push(event.text); return}
			});
			//console.log(utterances)
			if (utterances.length > 0) return utterances[utterances.length - 1].trim();
		}
		return ''
	},

	from_text: function(tracker) {
		return utils.last_user_utterance(tracker);
	},

	from_text_filtered: function(tracker,removeTexts) {
		let message = utils.last_user_utterance(tracker)
		if (message && removeTexts) {
			removeTexts.map(function(text) {
				message = message.replace(text,'');
			})
		}
		return message;
	},
	
	from_text_nlp_patterns: function(tracker,patterns) {
		var nlp = require('compromise');
		
		const plugin={patterns:{}}
		if (patterns) patterns.map(function(pattern) {
			plugin.patterns[pattern] = "Word"
		})
	
		let message = utils.last_user_utterance(tracker)
		nlp.plugin(plugin);
		let doc = nlp(message);
		let res = doc.match('#Word').out('text')
		// fallback to full message
		return res && res.length > 0 ? res : message;
	},
	
	toSnakeCase: function(message) {
		return message.toLowerCase().replace(/ /g, "_");;
	},
	
	fromSnakeCase: function(message) {
		return message.toLowerCase().replace(/_/g, " ");;
	},
	
	textResponse: function(text,events) {
		return {responses:[{text:text}],events:events ? events : []}
	} 
}
module.exports = utils
