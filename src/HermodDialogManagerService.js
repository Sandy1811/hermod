var HermodService = require('./HermodService')

//const record = require('node-record-lpcm16');
//const Detector = require('snowboy').Detector;
//const Models = require('snowboy').Models;

var stream = require('stream') 
var Readable = stream.Readable;
var WaveFile = require('wavefile')

class HermodDialogManagerService extends HermodService  {

    constructor(props) {
		super(props);
        let that = this;
        this.callbackIds = [];
        this.dialogs = {};
        this.asrFails = {}
        this.nluFails = {}
		function startDialog(siteId,payload) {
				//Start a dialog 
				var dialogId = String(parseInt(Math.random()*100000000,10))
				that.dialogs[dialogId] = {asrModels:payload.asrModels ? payload.asrModels : 'default', nluModels:payload.nluModels ? payload.nluModels : 'default'};
				that.sendMqtt('hermod/'+siteId+'/hotword/stop')
				that.sendMqtt('hermod/'+siteId+'/dialog/started',{id:dialogId})
				//that.sendMqtt('hermod/'+siteId+'/hotword/stop',{})
				if (that.props.welcomeMessage) {
					let callbacks = {}
					callbacks['hermod/'+siteId+'/tts/finished'] = function() {
						that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
						that.sendMqtt('hermod/'+siteId+'/asr/start',{id:dialogId,models: that.dialogs[dialogId].asrModels})
					}
					// automatic cleanup after single message with true parameter
					that.callbackIds[siteId] = that.manager.addCallbacks('DM CLEANUP',callbacks,true)		
					that.sendMqtt('hermod/'+siteId+'/tts/say',{id:dialogId,text:that.props.welcomeMessage})
				} else { 
					that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
					that.sendMqtt('hermod/'+siteId+'/asr/start',{id:dialogId,models:that.dialogs[dialogId].asrModels})
				}
		}
		function startNlu(siteId,payload) {
				//Start a dialog 
				var dialogId = String(parseInt(Math.random()*100000000,10))
				that.dialogs[dialogId] = {asrModels:payload.asrModels ? payload.asrModels : 'default', nluModels:payload.nluModels ? payload.nluModels : 'default'};
				//that.sendMqtt('hermod/'+siteId+'/hotword/stop',{})
				that.sendMqtt('hermod/'+siteId+'/microphone/stop',{})
				that.sendMqtt('hermod/'+siteId+'/dialog/started',{id:dialogId})
				that.sendMqtt('hermod/'+siteId+'/asr/stop',{id:dialogId,models:that.dialogs[dialogId].asrModels})
				that.sendMqtt('hermod/'+siteId+'/nlu/parse',{id:dialogId,models:that.dialogs[dialogId].nluModels,text:payload.text,confidence:payload.confidence})
		}
		
        let eventFunctions = {
        // SESSION
            'hermod/+/hotword/detected' : function(topic,siteId,payload) {
				that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id})
				let callbacks={};
				callbacks['hermod/'+siteId+'/dialog/ended'] = function() {
					startDialog(siteId,payload)
				}
				// automatic cleanup after single message with true parameter
				that.callbackIds[siteId] = that.manager.addCallbacks('DM ENDED',callbacks,true)
			}
		    ,
		    'hermod/+/dialog/start' : function(topic,siteId,payload) {
				console.log('DSTART')
				// if text is sent with start message, jump straight to nlu
				if (payload.text && payload.text.length > 0) {
					startNlu(siteId,payload)
				} else {
					startDialog(siteId,payload)
				}
		    }
		    ,
		    'hermod/+/dialog/continue' : function(topic,siteId,payload) {			
				//Sent by an action to continue a dialog and seek user input.
				//text - text to speak before waiting for more user input
				//ASR Model - ASR model to request
				//NLU Model - NLU model to request
				//Intents - Allowed Intents
				//console.log(payload.id)
				//console.log(JSON.stringify(that.dialogs));
				
				if (that.dialogs.hasOwnProperty(payload.id)) {
					if (payload.nluModels)  that.dialogs[payload.id].nluModels = payload.nluModels  
					if (payload.asrModels)  that.dialogs[payload.id].asrModels = payload.asrModels 
					if (payload.text && payload.text.length > 0) {
						//that.sendMqtt('hermod/'+siteId+'/microphone/stop',{})
						that.sendMqtt('hermod/'+siteId+'/tts/say',{id:payload.id,text:payload.text})
						// After hermod/<siteId>/tts/finished, send message to restart conversation
						let callbacks = {}
						callbacks['hermod/'+siteId+'/tts/finished'] = function() {
							that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
							that.sendMqtt('hermod/'+siteId+'/asr/start',{id:payload.id,models: that.dialogs[payload.id].asrModels})
						}
						// automatic cleanup after single message with true parameter
						that.callbackIds[siteId] = that.manager.addCallbacks('DM CLEANUP',callbacks,true)						
					} else {
						that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
						that.sendMqtt('hermod/'+siteId+'/asr/start',{id:payload.id,models: that.dialogs[payload.id].asrModels})
					}
				} else {
					console.error('missing id in dialog continue')
				}
			}
		    ,
		    'hermod/+/asr/text' : function(topic,siteId,payload) {
				//Sent by asr service
			//	if (that.dialogs.hasOwnProperty(payload.id)) {
					//if (payload.text && payload.text.length > 0) {
						//that.dialogs[payload.id].text = payload.text
						that.sendMqtt('hermod/'+siteId+'/hotword/stop')
						that.sendMqtt('hermod/'+siteId+'/asr/stop')
						that.sendMqtt('hermod/'+siteId+'/microphone/stop')
						that.sendMqtt('hermod/'+siteId+'/nlu/parse',{id:payload.id,text:payload.text,confidence:payload.confidence})
					//} else {
						//console.error('empty asr text')
					//}
				//} else {
					//console.error('missing id in asr text')
				//}
		    }
		    ,
		    'hermod/+/asr/fail' : function(topic,siteId,payload) {
				if (!that.asrFails[siteId]) that.asrFails[siteId] = 0;
				that.asrFails[siteId]++;
				if (that.asrFails[siteId] <= props.maxAsrFails) {
					let callbacks = {}
					callbacks['hermod/'+siteId+'/tts/finished'] = function() {
						that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
						that.sendMqtt('hermod/'+siteId+'/asr/start',{id:payload.id,models: that.dialogs[payload.id] ? that.dialogs[payload.id].asrModels : null})
					}
					// automatic cleanup after single message with true parameter
					that.callbackIds[siteId] = that.manager.addCallbacks('DM CLEANUP',callbacks,true)		
					that.sendMqtt('hermod/'+siteId+'/tts/say',{id:payload.id,text:that.props.asrFailMessage})
				} else {
					// bail out	
					that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id})
				}
				
			}
			,
		    'hermod/+/nlu/intent' : function(topic,siteId,payload) {
				//Sent by nlu service
				if (that.dialogs.hasOwnProperty(payload.id)) {
					that.dialogs[payload.id].parse = payload
				}
				that.sendMqtt('hermod/'+siteId+'/intent',payload)
			}
		    ,
		    'hermod/+/nlu/fail' : function(topic,siteId,payload) {
				if (!that.nluFails[siteId]) that.nluFails[siteId] = 0;
				that.nluFails[siteId]++;
				if (that.nluFails[siteId] <= props.maxNluFails) {
					let callbacks = {}
					callbacks['hermod/'+siteId+'/tts/finished'] = function() {
						that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
						that.sendMqtt('hermod/'+siteId+'/asr/start',{id:dialogId,models:  that.dialogs[payload.id] ? that.dialogs[dialogId].asrModels : ''})
					}
					// automatic cleanup after single message with true parameter
					that.callbackIds[siteId] = that.manager.addCallbacks('DM CLEANUP',callbacks,true)		
					that.sendMqtt('hermod/'+siteId+'/tts/say',{id:payload.id,text:that.props.nluFailMessage})
				} else {
					// bail out	
					that.sendMqtt('hermod/'+siteId+'/dialog/end',{id:payload.id})
				}
				
			}
		    ,
		    'hermod/+/dialog/end' : function(topic,siteId,payload) {
				//The application that is listening for the intent, should sent => hermod/<siteId>/dialog/end when it's action is complete so the dialog manager can
				// Garbage collect dialog resources.
				// Respond with /dialog/ended and optionally restart server hotword streaming
				if (that.dialogs.hasOwnProperty(payload.id)) {
					delete that.dialogs[payload.id]
				}
				that.sendMqtt('hermod/'+siteId+'/dialog/ended',{id:payload.id})
				if (that.props.enableServerHotword) {
					that.sendMqtt('hermod/'+siteId+'/microphone/start',{})
				}
				that.sendMqtt('hermod/'+siteId+'/hotword/start',{})
		    }
		    
        }
        
        this.manager = this.connectToManager('DM',props.manager,eventFunctions);
		
		
    }
   

}     
module.exports=HermodDialogManagerService
 
