const wikitools=require('../wikitools')
const utils=require('../utils')
module.exports = function(param,mqttSubscriptionManager,siteId,tracker) {
	return new Promise(function(resolve,reject) {
		const patterns = ["what is the * of [*]"]
					
		let searchFor = param && param.topic && param.topic.length > 0 ? param.topic : utils.from_text_nlp_patterns(tracker,patterns)
		
		if (searchFor && searchFor.length > 0 && param.attribute && param.attribute.length > 0) {
			let slotSet={"event": "slot", "name": "topic", "value": searchFor}
				
			wikitools.wikipediaLookupInfo(searchFor).then(function(response) {
					console.log(response);
					if (response) {
						let attributes = response.data
						let attributeKey = utils.toSnakeCase(param.attribute);
						console.log('ATT');
						let attributeValue = attributes && attributes.get && attributes.get(attributeKey) ? attributes.get(attributeKey).text() : '';
						console.log(attributeKey);
						console.log(attributeValue);
						
						if (attributeValue && attributeValue.length > 0 ) {
							resolve(utils.textResponse('The '+param.attribute+' of '+searchFor+' is ' +attributeValue,[slotSet]))
						} else {
							resolve(utils.textResponse("I don't know the "+param.attribute+" of "+searchFor,[slotSet])) 
						}
					} else {
						resolve(utils.textResponse("I don't know the "+param.attribute+" of "+searchFor,[slotSet])) 
					}
				})
		} else {
			resolve(utils.textResponse("I'm not sure what we're talking about. what do you want to know more about")) 
		}
	}) 
}
