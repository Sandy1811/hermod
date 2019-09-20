const wikitools=require('../wikitools')
const utils=require('../utils')

module.exports = function(param,mqttSubscriptionManager,siteId,tracker) {return new Promise(function(resolve,reject) {
	// keep this up to date with nlu.md
	const patterns = ["define [. .?]",
				"what is the definition of [*]",
				"what does [*] mean",
				"what is the meaning of [*]",
				"dictionary lookup [*]",
				"look in the dictionary for the word [*]",
				"find [*] in the dictionary"]
				
	let searchFor = param && param.word && param.word.length > 0 ? param.word : utils.from_text_nlp_patterns(tracker,patterns)
	console.log(['define',searchFor])
	if (searchFor && searchFor.length > 0)  {
		wikitools.wiktionaryLookupNoun(searchFor).then(function(response) {
			console.log(['DICT RESPONSE',response])
			if (response) {
				console.log(['DICT RESPONSE J',JSON.stringify(response)])
			
				let page = response.page;
				if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
				let definition = response.data;
				if (definition && definition.length > 0) {
					resolve(utils.textResponse(definition))
				} else {
					resolve(utils.textResponse("I couldn't find a definition for "+searchFor))
					
				}
			} else {
				resolve(utils.textResponse("I couldn't find a definition for "+searchFor))
			}
		})
	} else {
		resolve(utils.textResponse("What word did you want me to look up?",[{event:'followup',name:'action_define'}]))
	}
})}
