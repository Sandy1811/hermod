const wikitools=require('../wikitools')
const utils=require('../utils')

module.exports = function(param,mqttSubscriptionManager,siteId,tracker) {
	return new Promise(function(resolve,reject) {
					
		let searchFor = param && param.topic && param.topic.length > 0 ? param.topic : null
		if (searchFor && searchFor.length > 0) {
			wikitools.wikipediaLookupSummary(searchFor).then(function(response) {
				if (response) {
					let summary = response.data;
					let page = response.page;
					if (summary && summary.length > 0) {
						if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
						// summary is likely too long to be send to TTS in one chunk. Iterate sentences.
						//sendLongTTS(summary,siteId,mqttSubscriptionManager).then(function() {
							resolve(utils.textResponse(summary))
							//, [{event:'followup',name:'action_stop_listening'}]
						//})
					} else {
						resolve(utils.textResponse("I couldn't find any more information about "+searchFor))
					}
				} else{
					resolve(utils.textResponse("I couldn't find any more information about "+searchFor))
				}
			})
		} else {
			resolve(utils.textResponse("I'm not sure what we're talking about. what do you want to know more about")) 
		}
	})
}
