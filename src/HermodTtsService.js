var HermodService = require('./HermodService')
const lamejs = require('lamejs')
class HermodTtsService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        let eventFunctions = {
            'hermod/+/tts/say' : function(topic,siteId,payload) {
				if (payload.text && payload.text.length > 0 ) {
					that.say(payload.text,siteId,payload).then(function() {
					});
				}
            }
        }
        this.ttsBinary = props.ttsBinary ? props.ttsBinary : '/usr/bin/pico2wave' 
        this.ttsOutputDirectory = props.ttsOutputDirectory ? props.ttsOutputDirectory : '/tmp'
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
    say(text,siteId,payload) {
		let that = this;
		console.log('SAY');
		return new Promise(function(resolve,reject) {
			
			const randomFileName=that.ttsOutputDirectory + "/" + String(parseInt(Math.random() * 10000,10) ) + '.wav'
			const command = that.ttsBinary + " -w " + randomFileName + " " + '"' + text.split(' ').slice(0,200).join(' ') + '"';
			that.sendMqtt('hermod/'+siteId+'/tts/started',{id:payload.id})
			console.log('SAY started '+command);
						
			const exec = require("child_process").exec
			exec(command, (error, stdout, stderr) => {
				// stream the file
				console.log('SAY execed');

				var fs = require('fs');
				fs.readFile(randomFileName, function(err, wav) {
					if (err) console.log(err)
					
					//var mp3Data = [];

					//var mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128); //mono 44.1khz encode to 128kbps
					//var samples = new Int16Array(wav); //one second of silence replace that with your own samples
					//var mp3Tmp = mp3encoder.encodeBuffer(samples); //encode mp3

					////Push encode buffer to mp3Data variable
					//mp3Data.push(mp3Tmp);

					//// Get end part of mp3
					//mp3Tmp = mp3encoder.flush();

					//// Write last data to the output data, too
					//// mp3Data contains now the complete mp3Data
					//mp3Data.push(mp3Tmp);

					
					console.log('SAY read outfile');
					//console.log(mp3Data)
					let callbacks = {}
					callbacks['hermod/'+siteId+'/speaker/finished'] = function() {
						that.sendMqtt('hermod/'+siteId+'/tts/finished',{id:payload.id})
						fs.unlink(randomFileName,function() {})
						console.log('SAY delete outfile');
					}
					// automatic cleanup after single message with true parameter
					that.manager.addCallbacks('TTS',callbacks,true,true,siteId,3000)
					console.log('send play')
					that.manager.sendAudioMqtt("hermod/"+siteId+"/speaker/play",wav) //Buffer.from(mp3Data));
				});
			})
			resolve()
		})
    }
}
module.exports = HermodTtsService
