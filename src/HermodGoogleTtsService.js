
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
var HermodService = require('./HermodService')

class HermodGoogleTtsService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.audioCache={};
        let eventFunctions = {
            'hermod/+/tts/say' : function(topic,siteId,payload) {
				if (payload.text && payload.text.length > 0 ) {
					that.say(payload.text,siteId,payload)
				}
            }
        }
        this.say = this.say.bind(this)
        this.manager = this.connectToManager('TTS',props.manager,eventFunctions);
    }  
        
  
  
  //function sendLongTTSRecursive(messageParts,siteId,manager) {
	//return new Promise(function(resolve,reject) {
		//if (messageParts.length > 0) {
			//let nextMessage = messageParts.shift()
			//let callbacks = {}
			//callbacks['hermod/'+siteId+'/tts/finished'] = function() {
				//if (messageParts.length === 0) {
					//resolve(textResponse(nextMessage)) 
				//} else {
					//sendLongTTSRecursive(messageParts,siteId,manager)
				//}
			//}
			//// automatic cleanup after single message with true parameter
			//manager.addCallbacks('TTS',callbacks,true)	
			//manager.sendMqtt('hermod/'+siteId+'/tts/say',{text:nextMessage})
		//}
	//})
//}
  

   /**
     * Synthesise speech from text and send to to audio output
     */ 
    async say(text,siteId,payload) {
		let that = this;
		const client = new textToSpeech.TextToSpeechClient();
		// hack forcibly limit inside google limits (5000)
		const ssml = text.slice(0,2400); //'<speak>'+text+'</speak>';
		let audioContent= null;
		
		
		if (this.audioCache.hasOwnProperty(text)) {
			audioContent = this.audioCache[text]
			// notify tts finished when speaker finishes playing
			let callbacks = {}
			callbacks['hermod/'+siteId+'/speaker/finished'] = function() {
				that.sendMqtt('hermod/'+siteId+'/tts/finished',{id:payload.id})
			}
			that.manager.addCallbacks('TTS',callbacks,true)
			that.sendMqtt('hermod/'+siteId+'/tts/started',{id:payload.id})
			that.manager.sendAudioMqtt("hermod/"+siteId+"/speaker/play",Buffer.from(audioContent));
			
		} else {
			const request = {
			  input: {ssml: ssml},
			  voice: this.props.voice ? this.props.voice : {languageCode: 'en-US', ssmlGender: 'FEMALE'},
			  audioConfig: this.props.audioConfig ? this.props.audioConfig :  {audioEncoding: 'MP3'},
			};
		 
			const [response] = await client.synthesizeSpeech(request);
			// notify tts finished when speaker finishes playing
			this.audioCache[text] = response.audioContent;
			let callbacks = {}
			callbacks['hermod/'+siteId+'/speaker/finished'] = function() {
				that.sendMqtt('hermod/'+siteId+'/tts/finished',{id:payload.id})
			}
			that.manager.addCallbacks('TTS',callbacks,true)
			that.sendMqtt('hermod/'+siteId+'/tts/started',{id:payload.id})
			that.manager.sendAudioMqtt("hermod/"+siteId+"/speaker/play",Buffer.from(response.audioContent));
			
		}
		
			
    }	
}     
module.exports=HermodGoogleTtsService
 


