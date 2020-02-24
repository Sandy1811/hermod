var HermodService = require('./HermodService')
var HermodSubscriptionManager = require('./HermodSubscriptionManager')
var stream = require('stream') 
var VAD= require('node-vad')
var Wav = require('wav')
const Ds = require('deepspeech');
var Readable = stream.Readable;
var Writable = stream.Writable;

class HermodDeepSpeechAsrService extends HermodService  {
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
				
		this.asrModel = null;
		
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
		//console.log('start asr listen1')
		
		let detector = this.getDetector(siteId);
		// mqtt to stream - pushed to when audio packet arrives
			
		this.mqttStreams[siteId] =  new Wav.Writer();
	    this.mqttStreams[siteId].pipe(detector)
	    this.setupTimeout(siteId)
    }
	
	stopMqttListener(siteId) {
		//console.log('stop asr listen1')
		let that = this;
		if (this.callbackIds.hasOwnProperty(siteId)) {
			this.callbackIds[siteId].map(function(callbackId) {
				if (callbackId) that.manager.removeCallbackById(callbackId);
			})
		} 
	}
	
	onAudioMessage(topic,siteId,buffer) {
		//console.log('on audio')
		let that = this;
		if (this.mqttStreams.hasOwnProperty(siteId)) {
			// push into stream buffers for the first time (and start timeout)
			function pushBuffers(siteId,buffer) {
				that.mqttStreams[siteId].push(buffer)
			}
			
			this.VAD.processAudio(buffer, 16000).then(res => {
				switch (res) {
					case VAD.Event.ERROR:
						break;
					case VAD.Event.SILENCE:
						if (that.isStarted) pushBuffers(siteId,buffer)
						break;
					case VAD.Event.NOISE:
						if (that.isStarted) pushBuffers(siteId,buffer)
						break;
					case VAD.Event.VOICE:
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
		},this.props.timeout);
	}
	
	
	totalTime(hrtimeValue) {
		return (hrtimeValue[0] + hrtimeValue[1] / 1000000000).toPrecision(4);
	}

	
	speechCallback(transcript,siteId)  {
		let that = this;
		console.log(['speech callback',transcript])
		if (that.asrTimeouts[siteId]) clearTimeout(that.asrTimeouts[siteId] )
							
		if (transcript && transcript.length > 0)  {
			// don't forward text if already stopped
			if (that.mqttStreams[siteId]) {
				that.sendMqtt('hermod/'+siteId+'/asr/text',{id:that.dialogIds[siteId],text:transcript});
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
	
		
	//getDetector(siteId) {
		
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
	//}
	
	getAsrModel() {
		//if (this.asrModel) {
			//console.log('CACHED ASR MODEL')
			//return this.asrModel;
		//}
		
		const BEAM_WIDTH = this.props.BEAM_WIDTH;
		const LM_ALPHA = this.props.LM_ALPHA;
		const LM_BETA = this.props.LM_BETA;
		const N_FEATURES = this.props.N_FEATURES;
		const N_CONTEXT = this.props.N_CONTEXT;
		var args = this.props.files;
		
		console.error('Loading model from file %s', args['model']);
		const model_load_start = process.hrtime();
		let model = new Ds.Model(args['model'], N_FEATURES, N_CONTEXT, args['alphabet'], BEAM_WIDTH);
		const model_load_end = process.hrtime(model_load_start);
		console.error('Loaded model in %ds.', this.totalTime(model_load_end));

		if (args['lm'] && args['trie']) {
			console.error('Loading language model from files %s %s', args['lm'], args['trie']);
			const lm_load_start = process.hrtime();
			model.enableDecoderWithLM(args['alphabet'], args['lm'], args['trie'],
				LM_ALPHA, LM_BETA);
			const lm_load_end = process.hrtime(lm_load_start);
			console.error('Loaded language model in %ds.', this.totalTime(lm_load_end));
		}
		
		return model;
	}

	finishStream(siteId) {
		console.log(['FINISH STREAM'])
		let that = this;
		let model = this.models[siteId]
		let sctx = this.sctx[siteId]
		if (that.startTimeout) clearTimeout(that.startTimeout);
		try {
			const model_load_start = process.hrtime();
			let transcription = model.finishStream(sctx);
			this.sctx[siteId] = this.models[siteId].setupStream(150, 16000);
			console.log('transcription:'+ transcription);
			this.speechCallback(transcription,siteId)
			const model_load_end = process.hrtime(model_load_start);
			console.error('Inference took %ds.', that.totalTime(model_load_end));
			//that.stopMqttListener(siteId);
		} catch (e) {
			console.log(['FINISH STREAM ERROR',e])
		}
	}
	
	getDetector(siteId) {
		//if (this.models[siteId]) {
			//console.log('CACHED ASR MODEL')
			//return this.models[siteId];
		//}
				console.log(['GET DETECTOR'])

		//if (!this.models[siteId]) 
		this.models[siteId] = this.getAsrModel();
		// secondary VAD to trigger transcript events
		const vad = new VAD(VAD.Mode.NORMAL);
		let that = this;
		const voice = {START: true, STOP: false};
		this.sctx[siteId] = this.models[siteId].setupStream(150, 16000);
		let state = voice.START;
		
		let detector = new Writable();
		var silenceCount = 0;
		detector._write = function(chunk,encoding,cb) {
			try {
				console.log('audio in')
				vad.processAudio(chunk, 16000).then(res => {
					switch (res) {
						case VAD.Event.ERROR:
							console.log('audio in error')
							break;
							
						case VAD.Event.SILENCE:
							silenceCount++;
							if (state === voice.START && silenceCount > 40) { //30
								state = voice.STOP;
								silenceCount = 0;
								that.finishStream(siteId,that.models[siteId],that.sctx[siteId]);
							} else {
								that.models[siteId].feedAudioContent(that.sctx[siteId], chunk.slice(0, chunk.length / 2));
							}
							console.log('audio in silent')
							break;
						case VAD.Event.VOICE:
						case VAD.Event.NOISE:
							// restart mic
							silenceCount = 0;
							state = voice.START;
							that.models[siteId].feedAudioContent(that.sctx[siteId], chunk.slice(0, chunk.length / 2));
							console.log('audio in voice')
							break;
					}
				});
				cb()
			} catch (e) {
				console.log(['STREAM ERROR',e])
			}
		}
		return detector;
	}
	
	

}     

module.exports = HermodDeepSpeechAsrService 
