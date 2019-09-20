var config = {}
var ObjectId = require('mongodb').ObjectID;
const get = require('simple-get');
const wikitools = require('./wikitools')
const utils = require('./utils')

// mongo
const mongoString = process.env.MONGODB ; 
const mongoose = require('mongoose');
const Promise = require('bluebird');
mongoose.Promise = Promise;
const validator = require('validator');

const MongoClient = require('mongodb').MongoClient

// DATABASE SUPPORT FUNCTIONS

const dbExecute = (db, fn) => db.then(fn).finally(() => mongoose.disconnect())

function dbConnectAndExecute(dbUrl, fn) {
	//console.log([' CONNEX',dbUrl])
  return dbExecute(mongoose.connect(dbUrl,{}), fn);
}

var databaseConnection = null;

function initdb() {
	return new Promise(function(resolve,reject) {
		//console.log([databaseConnection])
		if (databaseConnection !== null && databaseConnection.serverConfig.isConnected()) {
			//console.log('ALREADY CONNECTED')
			resolve(databaseConnection)
		} else {
			//console.log([' CONNEXM',mongoString])
			MongoClient.connect(mongoString, (err, client) => {
			  if (err) {
				  console.log(err)
				  return //
			  }
			  databaseConnection = client.db() 
			  resolve(databaseConnection);
			})
		}
	})
	.finally(function() {
		//console.log('FINALLY DB DONE')
		if (databaseConnection) {
			//console.log('FINALLY DB closed')
			if (databaseConnection && databaseConnection.close) databaseConnection.close()
		}
	});
}


const actions = require('require-all')(__dirname + '/actions');
//console.log(['ACTIONS',actions])

module.exports = actions;


// DO NOT DELETE, CODE EXPERIMENTS BELOW FOR REFERENCE

//{
	
	
	
	//// question intent
	//action_tell_me_about:function(param,mqttSubscriptionManager,siteId,tracker) {
		//console.log(['tellmeabout',param])
		//const helpMessages=require('./helpMessages')
		//return new Promise(function(resolve,reject) {
			//// help topics
			//if (param && param.helptopic && param.helptopic.length > 0) {
				//if (helpMessages.hasOwnProperty(param.helptopic)) {
					//resolve( utils.textResponse(helpMessages[param.helptopic])) //{responses:[{text:helpMessages[param.mnemotopic]}]}
				//} else {
					//resolve(utils.textResponse("Sorry I don't know about "+param.mnemotopic))
				//}
			//// query wikipedia
			//} else {
				//if (param && param.topic && param.topic.length > 0)  {
					//wikitools.wikipediaLookup(param.topic).then(function(response) {
						//console.log(['QW',response.data])
						//let definition = response.data;
						//let page = response.page;
						//if (definition && definition.length > 0) {
							//if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
							//resolve(utils.textResponse(definition))
						//} else {
							//// fallback to wiktionary
							//wikitools.wiktionaryLookupNoun(param.topic).then(function(response) {
								//let definition = response.data;
								//if (definition && definition.length > 0) {
									//if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
									//resolve(utils.textResponse('The definition of '+param.word+' is '+definition))
								//} else {
									//resolve(utils.textResponse("I couldn't find any information about "+param.topic))
								//}
							//})
						//}
					//})
				//} else {
					//resolve(utils.textResponse("What did you want me to tell you about")) 
				//}
			//}
		//})
	//},

	//action_tell_me_more:function(param,mqttSubscriptionManager,siteId,tracker) {
		//return new Promise(function(resolve,reject) {
			//if (param && param.topic && param.topic.length > 0) {
				//wikitools.wikipediaLookupSummary(param.topic).then(function(response) {
						//let summary = response.data;
						//let page = response.page;
						//if (summary && summary.length > 0) {
							//if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})// summary is likely too long to be send to TTS in one chunk. Iterate sentences.
							//sendLongTTS(summary,siteId,mqttSubscriptionManager).then(function() {
								//resolve(utils.textResponse("All done"))
								////, [{event:'followup',name:'action_stop_listening'}]
							//})
						//}
					//})
			//} else {
				//resolve(utils.textResponse("I'm not sure what we're talking about. what do you want to know more about")) 
			//}
		//})
	//},
	
	//action_tell_attribute:function(param,mqttSubscriptionManager,siteId,tracker) {
		//return new Promise(function(resolve,reject) {
			//if (param && param.topic && param.topic.length > 0 && param.attribute && param.attribute.length > 0) {
				//wikitools.wikipediaLookupInfo(param.topic).then(function(response) {
						//let attributes = response.data
						//let page = response.page;
						//let attributeKey = utils.camelize(param.attribute);
						//if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
						//if (attributeKey && attributeKey.length > 0 && attributes.hasOwnProperty(attributeKey)) {
							//// summary is likely too long to be send to TTS in one chunk. Iterate sentences.
							////, [{event:'followup',name:'action_stop_listening'}]
							//resolve(utils.textResponse('The '+param.attribute+' of '+param.topic+' is ' +attributes[attributeKey]))
						//} else {
							//resolve(utils.textResponse("I don't know the "+param.attribute+" of "+param.topic)) 
						//}
					//})
			//} else {
				//resolve(utils.textResponse("I'm not sure what we're talking about. what do you want to know more about")) 
			//}
		//}) 
	//},
	
	//action_list_attributes:function(param,mqttSubscriptionManager,siteId,tracker) {
		//return new Promise(function(resolve,reject) {
			//if (param && param.topic && param.topic.length > 0) {
				//wikitools.wikipediaLookupInfo(param.topic).then(function(response) {
						//let page = response.page;
						//if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
						//let info = response.data;
						//let keys = Object.keys(info).map(function(infoKey) {
							//return utils.decamelize(infoKey)
						//})
						//console.log([keys,info])
						//if (keys.length > 0) {
							//resolve(utils.textResponse("I don't know any facts about "+param.topic)) 							
						//} else {
							//resolve(utils.textResponse("I know the following facts. "+keys.join(", "))) 
						//}
					//})
			//} else {
				//resolve(utils.textResponse("I'm not sure what we're talking about. what do you want to know more about")) 
			//}
		//})
	//},

 
	//// lookup word definition in wiktionary
	//action_define:function(param,mqttSubscriptionManager,siteId,tracker) {return new Promise(function(resolve,reject) {
		//let searchFor = param && param.word && param.word.length > 0 ? param.word : utils.from_text_filtered(tracker,['define the word','what is the meaning of the word','what is the meaning of','define','what does','mean'])
		//console.log(['define',searchFor])
		//if (searchFor && searchFor.length > 0)  {
			//wikitools.wiktionaryLookupNoun(searchFor).then(function(response) {
				//console.log(['DICT RESPONSE',response])
				//if (response) {
					//console.log(['DICT RESPONSE J',JSON.stringify(response)])
				
					//let page = response.page;
					//if (page && page.raw && page.raw.fullurl && page.raw.fullurl.length > 0) mqttSubscriptionManager.sendMqtt('hermod/'+siteId+'/display/iframe',{src:page.raw.fullurl})
					//let definition = response.data;
					//if (definition && definition.length > 0) {
						//resolve(utils.textResponse(definition))
					//} else {
						//resolve(utils.textResponse("I couldn't find a definition for "+searchFor))
						
					//}
				//} else {
					//resolve(utils.textResponse("I couldn't find a definition for "+searchFor))
					
				//}
			//})
		//} else {
			//resolve(utils.textResponse("What word did you want me to look up?"))
		//}
	//})},
		
	
	//action_show_me:function(param,mqttSubscriptionManager,siteId,tracker) {return new Promise(function(resolve,reject) {
		//resolve(utils.textResponse("I can't do that yet")) })},
	
	//===============================================================
	
	//action_discover:function() {return new Promise(function(resolve,reject) {
		//resolve(utils.textResponse("I can't do that yet")) })},
	
	//comment_form:function() {return new Promise(function(resolve,reject) {
		//resolve(utils.textResponse("Comment form",[
			//{
			  //"event": "action",
			  //"name": "action_deactivate_form"
			 //},
			 //{
				 //"event": "followup", 
				 //"name": "action_listen"
			  //}
		//]))
	//})},
	
	
	//action_review:function(params,manager,siteId) {return new Promise(function(resolve,reject) {
		//let callbacks = {}
		//callbacks['hermod/'+siteId+'/tts/finished'] = function() {
			//resolve(utils.textResponse("I can't do that yet")) 
		//}
		//// automatic cleanup after single message with true parameter
		//manager.addCallbacks('DM CLEANUP',callbacks,true)	
		//console.log('send nav review')
		//manager.sendMqtt('hermod/'+siteId+'/display/navigate',{to:'/review'})	
		//manager.sendMqtt('hermod/'+siteId+'/tts/say',{text:'review is tricky so'})
		
    //})},
	
	//action_what_can_i_say:function() {return new Promise(function(resolve,reject) {
		//resolve(utils.textResponse("I can answer questions, quiz you, or talk you through your review feed")) })},



	//action_tell_me_about:function(param) {
		//return new Promise(function(resolve,reject) {
			//console.log(JSON.stringify([param])) ;
			//if (param && param.mnemotopic && param.mnemotopic.length > 0) {
				//if (helpMessages.hasOwnProperty(param.mnemotopic)) {
					//resolve( utils.textResponse(helpMessages[param.mnemotopic])) //{responses:[{text:helpMessages[param.mnemotopic]}]}
				//} else {
					//resolve(utils.textResponse("Sorry I don't know about "+param.mnemotopic))
				//}
			//} else {
				//if (param && param.discoverytopic && param.discoverytopic.length > 0) {
					//return initdb().then(function(db) {
						//console.log(['QUERY QUESTIONS',param.discoverytopic])
						////name:{'$regex' : param.discoverytopic, '$options' : 'i'}
						
						//var criteria = [];
						//criteria.push({$text: {$search: param.discoverytopic.trim()}});
						
					  //// console.log(criteria);
					  //let limit = 1;
					  //let skip = 0;
						//db.collection('questions').find({$and:criteria}).limit(limit).skip(skip).project({score: {$meta: "textScore"}}).sort({score:{$meta:"textScore"}}).toArray(function(err, results) {
							//console.log('SEARCH RESULTS')
							//console.log(results)
							//if (results && results.length > 0) {
								//let question = results[0];
								//if (question && question.answer && question.answer.length > 0) {
									//resolve(utils.textResponse(question.answer))
								//} else {
									//resolve(utils.textResponse("Sorry I don't know about "+param.discoverytopic))
								//}
								//console.log(['QUERIED QUESTIONS',question])
							//} else {
								//resolve(utils.textResponse("Sorry I don't know about "+param.discoverytopic))
							//}
						//})
						
						
						
					//})
				//} else {
					//resolve(utils.textResponse("I didn't understand your question. Try say, tell me about, your topic"))
				//}

			//}
		//})
	//},
	

	
//}
