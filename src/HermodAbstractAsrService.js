/* global window */


var HermodService = require('./HermodService')
var HermodSubscriptionManager = require('./HermodSubscriptionManager')
//const speech = require('@google-cloud/speech');

var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;
//var PassThrough = stream.PassThrough;
//var WaveFile = require('wavefile')
var VAD= require('node-vad')

//const argparse = require('argparse');
const config = require('./config');
//const MemoryStream = require('memory-stream');
//const Duplex = require('stream').Duplex;
const util = require('util');
var Wav = require('wav')


//let mqttStreams = {};
//let audioDump = {};
        				
//var speaker = require('speaker')
//var WaveFile = require('wavefile')



class HermodAbstractAsrService extends HermodService  {
    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		this.messageCount = 0;
		
		this.mqttStreams = {};
		this.silenceStreams = {};
		this.wordBreakStreams = {};
		this.asrStreams = {};
		this.asrBuffers = {};
		this.vadSilent = {};
		this.inWordBreak = {};
		this.processes = {};
		this.dialogIds={};
		this.failCounts={};
		
		
		this.asrTimeouts={}
		this.startTimeouts={}
		this.sctx = {}
		this.models = {}
		this.isStarted = false;
		
		this.audioBuffers = {};
		
		this.getDetector = this.getDetector.bind(this)
		this.startAsr = this.startAsr.bind(this)
		this.stopAsr = this.stopAsr.bind(this)
		this.startMqttListener = this.startMqttListener.bind(this)
		this.stopMqttListener = this.stopMqttListener.bind(this)
		this.onAudioMessage = this.onAudioMessage.bind(this)
		//this.finishStream = this.finishStream.bind(this)
		this.speechCallback = this.speechCallback.bind(this)
		this.setupTimeout = this.setupTimeout.bind(this)
		this.VAD = new VAD(VAD.Mode.NORMAL);
				
		
		
        let eventFunctions = {
        // SESSION
            'hermod/+/asr/start' : function(topic,siteId,payload) {
				let selectModel = payload.model ? payload.model : 'default';
					that.dialogIds[siteId]= payload.id;
					that.listening[siteId] = true;
					that.startAsr(siteId)					
				
		    },
		    'hermod/+/asr/stop' : function(topic,siteId,payload) {
					that.listening[siteId] = false;
					that.stopAsr(siteId)
				
		    }
        }
        this.manager = this.connectToManager('ASR',props.manager,eventFunctions);
      
    }
    
    startAsr(siteId) {
		console.log('start asr ')
		let that = this;
		if (that.asrTimeouts[siteId]) clearTimeout(that.asrTimeouts[siteId]);
		var eventFunctions={}
		that.failCounts[siteId] = 0;
		eventFunctions['hermod/+/microphone/audio'] = that.onAudioMessage.bind(that)
		this.callbackIds[siteId] = that.manager.addCallbacks('ASR',eventFunctions,false,false,siteId)
		that.startMqttListener(siteId);
	}

	stopAsr(siteId) {
		let that = this;
		console.log('STOP ASR')
		if (that.asrTimeouts[siteId]) clearTimeout(that.asrTimeouts[siteId]);
		try {
			that.stopMqttListener(siteId);
			if (that.mqttStreams[siteId]) that.mqttStreams[siteId].push(null)
			delete that.mqttStreams[siteId]
		} catch (e) {
			console.log(['FINISH STREAM ERROR',e])
		}
	}
	   
    startMqttListener(siteId) {
		let that = this;
		console.log('START ASR LISTEN')
		
		const detector = this.getDetector(siteId)
		//.then(function(detector) {
			// mqtt to stream - pushed to when audio packet arrives
			console.log(['pipe to detector',detector]);
			that.mqttStreams[siteId] =  new Wav.Writer();
			that.mqttStreams[siteId].pipe(detector)
			that.setupTimeout(siteId)
		//})
    }
	
	stopMqttListener(siteId) {
		console.log('stop asr listen1')
		let that = this;
		if (this.callbackIds.hasOwnProperty(siteId)) {
			this.callbackIds[siteId].map(function(callbackId) {
				if (callbackId) that.manager.removeCallbackById(callbackId);
			})
		} 
	}
	
	onAudioMessage(topic,siteId,buffer) {
		console.log('on audio')
		let that = this;
		if (this.mqttStreams.hasOwnProperty(siteId)) {
			// push into stream buffers for the first time (and start timeout)
			function pushBuffers(siteId,buffer) {
				console.log('pushbuffer')
				that.mqttStreams[siteId].push(buffer)
			}
			
			this.VAD.processAudio(buffer, 16000).then(res => {
				switch (res) {
					case VAD.Event.ERROR:
						break;
					case VAD.Event.SILENCE:
						console.log('silence')
						//if (that.isStarted) 
						pushBuffers(siteId,buffer)
						break;
					case VAD.Event.NOISE:
						console.log('noise')
						//if (that.isStarted) 
						pushBuffers(siteId,buffer)
						break;
					case VAD.Event.VOICE:
						console.log('voice')
						that.isStarted = true;     
						pushBuffers(siteId,buffer)
						// timeout once voice starts
						that.setupTimeout(siteId)
						break;
				}
			})
		}
	}	
	
	setupTimeout(siteId) {
		let that = this;
		//console.log('CREATE TIMEOUT '+siteId)
		if (that.asrTimeouts[siteId]) clearTimeout(that.asrTimeouts[siteId] )
		that.asrTimeouts[siteId] = setTimeout(function() {
			console.log(['TIMEOUT FORCE END ']) //+siteId,that.failCounts[siteId]])
			//if (!that.failCounts.hasOwnProperty(siteId)) that.failCounts[siteId] = 0;
			//that.failCounts[siteId]++;
			//if (that.failCounts[siteId] <= that.props.maxFails) {
				//that.sendMqtt('hermod/'+siteId+'/asr/restarted',{id:that.dialogIds[siteId]});
				//// restart asr
				//that.stopMqttListener(siteId);
				//that.startMqttListener(siteId);
			//} else {
				// too many fails, bail out
				that.stopAsr(siteId)
				that.sendMqtt('hermod/'+siteId+'/asr/fail',{id:that.dialogIds[siteId]});
			//}
		},that.props.timeout);
	}
	
	
	totalTime(hrtimeValue) {
		return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
	}


	speechCallback(data,siteId)  {
		let that = this;
		//console.log(['speech callback',JSON.stringify(data.results)])
		if (that.asrTimeouts[siteId]) clearTimeout(that.asrTimeouts[siteId] )
							
		if (data.results[0] && data.results[0].alternatives[0] && data.results[0].alternatives[0].transcript.length > 0)  {
			// don't forward text if already stopped
			if (that.mqttStreams[siteId]) {
				that.sendMqtt('hermod/'+siteId+'/asr/text',{id:that.dialogIds[siteId],text:data.results[0].alternatives[0].transcript});
			}
			that.stopMqttListener(siteId)
			
		} else {
			// TODO RESTORE/FIX SEND FAILED ASR AND NLU AND CORE TO ACTION_FAIL_xxxx
			//that.sendMqtt('hermod/'+siteId+'/asr/notext',{id:that.dialogIds[siteId]});
			
			//if (!that.failCounts.hasOwnProperty(siteId)) that.failCounts[siteId] = 0;
			//that.failCounts[siteId]++;
			//if (that.failCounts[siteId] <= that.props.maxFails) {
				//// restart asr
				//that.sendMqtt('hermod/'+siteId+'/asr/restarted',{id:that.dialogIds[siteId]});
				//that.stopMqttListener(siteId);
				//that.startMqttListener(siteId);
			//} else {
				// too many fails, bail out
				//that.sendMqtt('hermod/'+siteId+'/asr/stopped',{id:that.dialogIds[siteId]});
				that.stopAsr(siteId)
				that.sendMqtt('hermod/'+siteId+'/asr/fail',{id:that.dialogIds[siteId]});
			//}
		}
	}
	
	
	// return nodejs stream	
	getDetector(siteId) {
		
		//// Google Speech Client
		//const client = new speech.SpeechClient();
		//const encoding = 'LINEAR16';
		//const sampleRateHertz = 16000;
		//const languageCode = 'en-AU';
		//const request = {
		  //config: {
			//encoding: encoding,
			//sampleRateHertz: sampleRateHertz,
			//languageCode: languageCode,
		  //},
		  //interimResults: false, // If you want interim results, set this to true
		//};	
		
		//// Stream the audio to the Google Cloud Speech API
		//var detector = client
		//.streamingRecognize(request)
		//.on('error', console.log)
		//.on('data', data => this.speechCallback(data,siteId));
		
		
		//return detector;
	}

}     

module.exports = HermodAbstractAsrService 
