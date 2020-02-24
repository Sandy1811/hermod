const actions = require(process.env.ACTIONS_FILE ? process.env.ACTIONS_FILE :'../rasa/actions.js')
var config={
	// mqtt details
	username:process.env.MQTT_USER ? process.env.MQTT_USER: 'admin',
	password:process.env.MQTT_PASSWORD ? process.env.MQTT_PASSWORD: 'admin',
	mqttServer:process.env.MQTT_SERVER ? process.env.MQTT_SERVER: 'ws://mosquitto:9001',
	
	// siteId for local Speaker and Microphone services
	siteId:'default',
	enableBargeIn: true,
	enableServerHotword: false,
	// only respond to message from these sites
	allowedSites:process.env.ALLOWED_SITES ? process.env.ALLOWED_SITES :'default',
	actions: actions,
	services: {
		// server audio 
		// disabled in favor of web client audio server (see webexample)
		//HermodMicrophoneService: {
                
        //}
        //,
        //HermodSpeakerService: {
        //}
        //,
        
        
		//HermodRasaNluService: {
			//rasaServer: process.env.RASA_SERVER ? process.env.RASA_SERVER : 'http://rasa:5005',
			//minConfidence: 0.1,
			//slotMappingFile: '../rasa/slotMappings.yml'
		//}
		//,
		//HermodRasaCoreRouterService: {
			//coreServer:process.env.RASA_SERVER ? process.env.RASA_SERVER :'http://rasa:5005',
			//domainFile:'../rasa/domain.yml',
		//}
		//,
		HermodDialogManagerService: {
			// start audio streaming on load and restart to support server hotword
			enableHotword: false,
			welcomeMessage: 'Hi',
			welcomeSound: '../rasa/gday.wav',
			maxAsrFails:5,
			maxNluFails: 2,
			asrFailMessage:"Sorry, I couldn't hear that. Could you say it again.",
			nluFailMessage:"I can't understand that. Could you try again."
			//nluFallbackActions: ['action_nlufail'],
			//asrFallbackActions: ['action_asrfail']
		}
		,
		//HermodHotwordService: {
			//hotwords: {
				//'snowboy': {
					//asrModel:'default',
					//nluModel:'current',
				//},
				//'smart mirror': {
					//asrModel:'default',
					//nluModel:'current',
				//}
			//},
			//models: [{
				//file: './node_modules/snowboy/resources/models/snowboy.umdl',
				//sensitivity: '0.6',
				//hotwords : 'snowboy'
			//}
			//,
			//// jarvis universal model triggers license error
			////{
				////file: './node_modules/snowboy/resources/models/jarvis.umdl',
				////sensitivity: '0.5',
				////hotwords : 'jarvis'
			////}
			////,
			//{
				//file: './node_modules/snowboy/resources/models/smart_mirror.umdl',
				//sensitivity: '0.5',
				//hotwords : 'smart_mirror'
			//}],
			//detector: {
			  //resource: "./node_modules/snowboy/resources/common.res",
			  //audioGain: 2.0,
			  //applyFrontend: true
			//}
		//}
		//,
		
		
	}
}

console.log(['ENVIRONMENT',process.env])
const localASRandTTS = {
		// local service using pico2wav
        HermodTtsService: {
			ttsBinary: '/usr/bin/pico2wave',
			ttsOutputDirectory: '/tmp'
        }
        ,
        // ASR service
		HermodIbmWatsonAsrService: {
                 model: "default",
                 timeout: 2000,
                 iam_apikey: process.env.SPEECH_TO_TEXT_IAM_APIKEY,
                 url: process.env.SPEECH_TO_TEXT_URL
        },
        //HermodDeepSpeechAsrService: {
			//model: "default",
			//timeout: 2000,
			 ////These constants control the beam search decoder
			 ////These constants are tied to the shape of the graph used (changing them changes
			 ////the geometry of the first layer), so make sure you use the same constants that
			 ////were used during training
			//BEAM_WIDTH : 1024, //500, // Beam width used in the CTC decoder when building candidate transcriptions
			//LM_ALPHA : 0.75, // The alpha hyperparameter of the CTC decoder. Language Model weight
			//LM_BETA : 1.85, // The beta hyperparameter of the CTC decoder. Word insertion bonus.
			//N_FEATURES : 26, // Number of MFCC features to use
			//N_CONTEXT : 9, // Size of the context window used for producing timesteps in the input vector
			//files: {
					//model :"../deepspeech-model/models/output_graph.pbmm",
					//alphabet: "../deepspeech-model/models/alphabet.txt",
					//lm: "../deepspeech-model/models/lm.binary",
					//trie: "../deepspeech-model/models/trie"
			//},
			//maxProcesses: 2
       //}
       
       // NOT WORKING
       //,
       //HermodAWSTranscribeAsrService: {
			//accessKey: 'AKIAWXQHXP7SRPQYMF4E',
			//secret: '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',
			//languageCode: 'en-US', 
			//region: 'us-west-2',
			//timeout: 1000
	   //}
}


const googleASRandTTS = {
	// to use HermodGoogleAsrService and/or HermodGoogleTtsService
        // in google console (https://console.developers.google.com/apis/) ensure Speech and TTS API enabled.
		// create and download service account credentials 
        //// ensure export environment variable GOOGLE_APPLICATION_CREDENTIALS is path to downloaded credentials
        //// export GOOGLE_APPLICATION_CREDENTIALS=/home/stever/Downloads/hermod-d96c7d7c36f3.json
		HermodGoogleAsrService: {
			timeout: 1000,
			maxFails: 2
		}
		,
		HermodGoogleTtsService: {
			voice: {languageCode: 'en-AU', ssmlGender: 'MALE'},
			audioConfig: {audioEncoding: 'MP3'}
		}

}

// if google credentials exist, use google ASR and TTS
const fs = require('fs')
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
	config.services = Object.assign(config.services,googleASRandTTS);
// otherwise use local deepspeech ASR and picovoice TTS 
} else if (fs.existsSync('../deepspeech-model/models/lm.binary')) {
	config.services = Object.assign(config.services,localASRandTTS);	
} else {
	throw new Exception('You must install the deepspeech models (deepspeech-model/install.sh)  or provide GOOGLE_APPLICATION_CREDENTIALS as a path to your service credentials file (with ASR and TTS apis enabled)')
}


module.exports = config;
