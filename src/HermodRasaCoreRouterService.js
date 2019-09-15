var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');
//const yaml = require('js-yaml')

class HermodRasaCoreRouterService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        this.recursionDepth={};
        let eventFunctions = {
            'hermod/+/intent' : this.sendRequest.bind(this),
            'hermod/+/dialog/started' : this.resetTracker.bind(this)
        }
        //this.domain = null;
        //try {
		  //let doc = yaml.safeLoad(fs.readFileSync(props.domainFile, 'utf8'));
		  //this.domain = doc;
		//} catch (e) {
		  //console.log(e);
		//}
        this.manager = this.connectToManager('CORE',props.manager,eventFunctions);
    }
 
	resetTracker(topic,siteId,payload) {
		//console.log('RESTART TRACKER');
		let that =this;
		//that.sendMqtt('hermod/'+siteId+'/core/reset',{id:payload.id});
		//console.log('RESTART')	  
		axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{
			"event": "restart",
			})
			.then(response => {
				axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{"event": "action", "name":'action_listen'}).then(function(response) {
								
				})
			}).catch(error => {
			  console.log('RESTART fail')
			  console.log(error);
   		  });
 	}
	
	// recursively call predict until action_listen or action_stop_listening
	predictAndRun (siteId,payload)  {
		//console.log(['PREDICT AND RUN'])
		let that = this;
		return new Promise(function(resolve,reject) {
			// what to run ?
			axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
			.then(response => {
				//console.log(['INITIAL PREDICT',JSON.stringify(response.data.scores)])
				
				if (response.data.scores && response.data.scores.length > 0 && response.data.scores[0].action  && response.data.scores[0].action.length > 0) {
					let scores = response.data.scores;
					scores.sort(function(a,b) {
						if (a.score > b.score) return -1
						else return 1;
					});
					let action =  scores[0].action;
					let confidence = scores[0].action.score;
				  // console.log(['FROM SCORES PREDICT FOUND',action,confidence])
					//that.sendMqtt('hermod/'+siteId+'/core/predicted',{id:payload.id,action:action});
			  
					// execute action via rasa	
					axios.post(that.props.coreServer+"/conversations/"+siteId+"/execute",{name:action,confidence:confidence})
					.then(executeResponse => {
							//that.sendMqtt('hermod/'+siteId+'/core/exec',{id:payload.id,action:action,messages:executeResponse.data.messages});
							that.sendMqtt('hermod/'+siteId+'/core/tracker',{id:payload.id,tracker:executeResponse.data.tracker});
							//console.log(['EXECed '+action,executeResponse.data.messages])
							// speak array of messages sequentially
							if (executeResponse && executeResponse.data && executeResponse.data.messages && executeResponse.data.messages.length > 0) {
								
								let messages = executeResponse.data.messages; 
								//[]
								//executeResponse.data.messages.map(function(message) { if (message.text) messages.push(message.text)})
								//messages=['hi','there']
								//console.log(messages);				
								let callbacks = {}
								
								function getCallbackFunction(messages) {
									// if message queue is exhausted, predict and run the next action
									if (messages.length === 0) {
										return function() {
										//	console.log(['ALL MESSAGES SPOKEN'])
		
											// messages all spoken, now next action
											axios.post(that.props.coreServer+"/conversations/"+siteId+"/predict",{})
											.then(nextResponse => {
												//that.sendMqtt('hermod/'+siteId+'/core/predictednext',{id:payload.id,action:nextResponse.data.scores[0]});
			  
											//	console.log(['PREDICT NEXT']) //,JSON.stringify(nextResponse.data.scores)
												let scores = nextResponse.data.scores;
												if (scores.length > 0) {
													scores.sort(function(a,b) {
														if (a.score > b.score) return -1
														else return 1;
													});	
													//console.log(scores[0]);
													// end of story		
													if (scores[0].action === "action_listen"|| scores[0].action === "action_stop_listening") {
														console.log(['END OF STORY'])
														//that.sendMqtt('hermod/'+siteId+'/core/complete',{id:payload.id,action:scores[0].action});
														resolve(scores[0].action);
													// recursively run the next action in the story
													} else {
													//	console.log(['NEXT STORY STEP',])
														that.recursionDepth[siteId]++;
														// avoid infinite recursion if getting garbage from core
														if (that.recursionDepth[siteId] > 15) {
															resolve("action_stop_listening");
														} else {
															that.predictAndRun(siteId,payload).then(function(action) {
																resolve(action);
															});
														}
													}						
												} else {
													resolve("action_stop_listening");
												}
											}).catch(error => {
												  console.log(error);
												  resolve("action_stop_listening");
											});
										}
									// hook up the next callback and send a say message for the next message in the queue
									} else {
										return function() {
											//console.log('saynext ' + messages[0] )
											callbacks['hermod/'+siteId+'/speaker/finished'] = getCallbackFunction(messages.slice(1))
											that.manager.addCallbacks('TTS',callbacks,true)
											//axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{"event": "bot", "text": messages[0], "data": {}}).then(function(response) {
												//console.log('POSTING MESSAGE')
												//console.log(response)
												that.sendMqtt('hermod/'+siteId+'/tts/say',{id:payload.id,text:messages[0].text})
												console.log('DISPLAY MESSAGES')
												console.log(messages[0])
												if (messages[0].image) that.manager.sendMqtt("hermod/"+siteId+"/display/image",{id:payload.id,image:messages[0].image});
									
												if (messages[0].buttons) that.manager.sendMqtt("hermod/"+siteId+"/display/buttons",{id:payload.id,image:messages[0].buttons});
												if (messages[0].attachement) that.manager.sendMqtt("hermod/"+siteId+"/display/attachement",{id:payload.id,image:messages[0].attachement});
												
											//}).catch(function(e) {
												//console.log('ERROR POSTING MESSAGE')
												//console.log(e);
											//})
										}
									}
								}
								// add initial callback
								callbacks['hermod/'+siteId+'/speaker/finished'] = getCallbackFunction(messages.slice(1))
								
								// automatic cleanup after single message with true parameter
								that.manager.addCallbacks('TTS',callbacks,true)
								
								// start it all by sending the say message
								
								that.sendMqtt('hermod/'+siteId+'/tts/started',{id:payload.id})
								//axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{"event": "bot", "text": messages[0], "data": {}}).then(function(response) {
									//console.log('POSTING INIT MESSAGE')
									//console.log(response)
									that.manager.sendMqtt("hermod/"+siteId+"/tts/say",{id:payload.id,text:messages[0].text});
									console.log('DISPLAY MESSAGES')
									console.log(messages[0])
									if (messages[0].image) that.manager.sendMqtt("hermod/"+siteId+"/display/image",{id:payload.id,image:messages[0].image});
									
									if (messages[0].buttons) that.manager.sendMqtt("hermod/"+siteId+"/display/image",{id:payload.id,image:messages[0].buttons});
									if (messages[0].attachement) that.manager.sendMqtt("hermod/"+siteId+"/display/image",{id:payload.id,image:messages[0].attachement});
									 
								//}).catch(function(e) {
									//console.log('ERROR POSTING INIT MESSAGE')
									
									//console.log(e);
								//})
							}
							
							
							
							// resolve next action 
							
					
					  }).catch(error => {
						  console.log(error);
						  resolve('action_stop_listening');
					  });						  
							
					
				}	else {
					resolve('action_stop_listening')
				}	
			}).catch(error => {
				console.log(error);
				resolve();
			});;
			
		}).catch(error => {
			  console.log(error);
			  resolve();
		});
	}
 
    sendRequest(topic,siteId,payload) {
		let that = this;
		this.recursionDepth[siteId] = 0;
		//console.log(['CORE STARTED',payload,{parse_data:payload.intent_ranking[0]}])
		//that.sendMqtt('hermod/'+siteId+'/core/started',{dialogId:payload.dialogId});				
		axios.post(this.props.coreServer+"/conversations/"+siteId+"/messages",{text:payload.text,sender:"user",parse_data:{intent:payload.intent,entities:payload.entities}})
		  .then(function(response) {
			  //console.log(['MESSAGE RESPOSE',JSON.stringify(response.data.events),response.data.latest_action_name])
			  //that.sendMqtt('hermod/'+siteId+'/core/messages',{id:payload.id,message:payload.text,nlu:payload});
			  that.predictAndRun(siteId,payload).then(function(action) {
				if (action === 'action_stop_listening') {
					that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id});
				//} else if (action.indexOf('utter_')>=0) {
					//if (this.domain && this.domain.templates && this.domain.templates.hasOwnProperty(action)) {
						//if (this.domain.templates[action].length > 0) {
							//// replace slot values in utterance template
							//let utterances = this.domain.templates[action];
							//let randomUtterance = parseInt(Math.random() * utterances.length,10);
							//let utterance = utterances[randomUtterance];
							//if (utterance) utterance = utterance.text;
							//for (var slot in payload.slots) {
								//utterance = utterance.replace('{'+slot+'}',payload.slots[slot]);
							//}
							//let callbacks = {}
							//callbacks['hermod/'+siteId+'/tts/finished'] = function() {
								//that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action})
							//}
							//// automatic cleanup after single message with true parameter
							//this.manager.addCallbacks('ACTION',callbacks,true,false,siteId)
							
							////that.sendMqtt('hermod/'+siteId+'/action/started',{})
							//that.sendMqtt('hermod/'+siteId+'/tts/say',{text:utterance});
						//} else {
							//that.sendMqtt('hermod/'+siteId+'/action/finished',{id:payload.id,action:action,error:'no matching template for utter_ action'})
						//}
					//} 
				} else {
					axios.post(that.props.coreServer+"/conversations/"+siteId+"/tracker/events",{"event": "action", "name":'action_listen'}).then(function(response) {
						that.sendMqtt('hermod/'+siteId+'/dialog/continue',{id:payload.id});	
					})
				}
			  }).catch(error => {				  
				  console.log(error);
			  });;
		})
		.catch(error => {
			console.log(error);
		});
	}
    
}     
module.exports=HermodRasaCoreRouterService
 
 
