const wikitools=require('../wikitools')
const utils=require('../utils')
module.exports = function(param,mqttSubscriptionManager,siteId,tracker) {
	return new Promise(function(resolve,reject) {
		const patterns = ["what facts do you know about [*]","what attributes do you know about [*]","what properties do you know about [*]"]
					
		let searchFor = param && param.topic && param.topic.length > 0 ? param.topic : utils.from_text_nlp_patterns(tracker,patterns)
		if (searchFor && searchFor.length > 0) {
			wikitools.wikipediaLookupInfo(searchFor).then(function(response) {
					if (response) {
						let page = response.page;
						if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
						let info = response.data;
						let keys = Object.keys(info).map(function(infoKey) {
							return utils.fromSnakeCase(infoKey)
						})
						//console.log([keys,info])
						if (keys.length > 0) {
							resolve(utils.textResponse("I don't know any facts about "+searchFor)) 							
						} else {
							resolve(utils.textResponse("I know the following facts. "+keys.join(", "))) 
						}
					} else {
						resolve(utils.textResponse("I don't know any facts about "+searchFor)) 	
					}
				})
		} else {
			resolve(utils.textResponse("I'm not sure what we're talking about. what do you want to know more about")) 
		}
	})
}
