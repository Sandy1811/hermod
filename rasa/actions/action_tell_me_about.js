const helpMessages=require('../helpMessages')
const wikitools=require('../wikitools')
const utils=require('../utils')


					
module.exports = function(param,mqttSubscriptionManager,siteId,tracker) {
		//console.log(['tellmeabout',param])
		return new Promise(function(resolve,reject) {
			// help topics
			if (param && param.helptopic && param.helptopic.length > 0) {
				if (helpMessages.hasOwnProperty(param.helptopic)) {
					resolve( utils.textResponse(helpMessages[param.helptopic])) //{responses:[{text:helpMessages[param.mnemotopic]}]}
				} else {
					resolve(utils.textResponse("Sorry I don't know about "+param.mnemotopic))
				}
			// query wikipedia
			} else {
				// keep this up to date with nlu.md
				//const patterns = ["who is [*]",
			//"what is [*]",
			//"what are [*]",
			//"why use [*]",
			//"tell me about [*]"]
							
				let searchFor = param && param.topic && param.topic.length > 0 ? param.topic : '' //utils.from_text_nlp_patterns(tracker,patterns)
				let slotSet={"event": "slot", "name": "topic", "value": searchFor}
				if (searchFor && searchFor.length > 0)  {
					wikitools.wikipediaLookup(searchFor).then(function(response) {
						//console.log(['QW',response.data])
						if (response) {
							let definition = response.data;
							let page = response.page;
							if (definition && definition.length > 0) {
								if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
								resolve(utils.textResponse(definition,[slotSet]))
							} else {
								// fallback to wiktionary
								wikitools.wiktionaryLookupNoun(searchFor).then(function(response) {
									let definition = response.data;
									if (definition && definition.length > 0) {
										if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
										resolve(utils.textResponse('The definition of '+searchFor+' is '+definition,[slotSet]))
									} else {
										// TODO fallback to google knowledge graph
											fetch('https://kgsearch.googleapis.com/v1/entities:search?limit=1&key=AIzaSyDj5IgbuLmaoSrcNwBadk7ayEw2kfrNWaA&query='+searchFor)
											.then(function(response) {
												return response.json()
											}).then(function(json) {
												if (json.error) {
													isError = true
												}
												console.log(json)
												//if (json && json && json.itemListElement && json.itemListElement.length > 0) {
													//resolve({key:'google',value:json.itemListElement})
												//} else {
													//resolve({key:'google',value:null})
												//}
												resolve(utils.textResponse("I couldn't find any information about "+searchFor,[slotSet]))
											})
										//}))
										
									}
								})
							}
						} else {
							resolve(utils.textResponse("I couldn't find any information about "+searchFor,[slotSet]))
						}
					})
				} else {
					// force this action again to parse free text response
					resolve(utils.textResponse("What did you want me to tell you about",[{"event":"followup","name":"action_tell_me_about"}])) 
				}
			}
		})
	}
