const audioUtils        = require('./audioUtils');  // for encoding audio data as PCM
const crypto            = require('crypto'); // tot sign our pre-signed URL
const v4                = require('./aws-signature-v4'); // to generate our pre-signed URL
const marshaller        = require("@aws-sdk/eventstream-marshaller"); // for converting binary event stream messages to and from JSON
const util_utf8_node    = require("@aws-sdk/util-utf8-node"); // utilities for encoding and decoding UTF8
const mic               = require('microphone-stream'); // collect microphone input as a stream of raw bytes
const WebSocket = require('ws');
const HermodAbstractASRService 		= require("./HermodAbstractAsrService")
//console.log(WebSocket)


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



class HermodAWSTranscribeAsrService extends HermodAbstractASRService  {
    constructor(props) {
        super(props);
        // our converter between binary event streams messages and JSON
		this.eventStreamMarshaller = new marshaller.EventStreamMarshaller(util_utf8_node.toUtf8, util_utf8_node.fromUtf8);
		this.sockets = {}
		this.openSockets = {};
    }
    
	getDetector(siteId) {
		let that = this;
		//return new Promise(function(resolve,reject) {
			
			 //Pre-signed URLs are a way to authenticate a request (or WebSocket connection, in this case)
			 //via Query Parameters. Learn more: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
			let url = that.createPresignedUrl();
			//open up our WebSocket connection
			that.sockets[siteId] = new WebSocket(url);
			that.sockets[siteId].binaryType = "arraybuffer";
			let detector = new Writable();
			detector._write = function(chunk,encoding,cb) {
				console.log('presend')
				//console.log(chunk)
				let binary = that.convertAudioToBinaryMessage(chunk);
				//console.log(binary);
				try {
					
					if (that.openSockets[siteId]) { //  && that.sockets[siteId].OPEN) {
						console.log('send')
						that.sockets[siteId].send(binary);
					}
				} catch (e) {
					console.log(e)
				}
				cb()
			}
			
			// when we get audio data from the mic, send it to the WebSocket if possible
			that.sockets[siteId].onopen = function() {
				console.log('OPEN SOCKET')
				that.openSockets[siteId] = true;
			}	
				////const micStream = WebSocket.createWebSocketStream(that.sockets[siteId], { encoding: 'utf8' });
			
				////const micStream = new Writable({
				  ////write(chunk, encoding, callback) {
					//////console.log(chunk.toString());
					////// the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
					////let binary = that.convertAudioToBinaryMessage(chunk);
					//////console.log(binary);
					////try {
						//////if (that.openSockets[siteId]) { // && that.sockets[siteId].OPEN) {
							////console.log('send')
							////that.sockets[siteId].send(binary);
					//////	}
					////} catch (e) {
						////console.log(e)
					////}
					////callback();
				  ////}
				////});
				////micStream.on('data', function(rawAudioChunk) {
					////console.log('data')
					////// the audio stream is raw audio bytes. Transcribe expects PCM with additional metadata, encoded as binary
					//////let binary = that.convertAudioToBinaryMessage(rawAudioChunk);

					//////if (that.sockets[siteId].OPEN)
						//////that.sockets[siteId].send(binary);
				////})
				////resolve(micStream)
			////)
			//};

			//// handle messages, errors, and close events
			that.wireSocketEvents(siteId,that.sockets[siteId]);
			//resolve(detector)
			return detector;
		//})
	}
	
		
	wireSocketEvents(siteId,socket) {
		let that = this;
		// handle inbound messages from Amazon Transcribe
		socket.onmessage = function (message) {
			console.log('message')
			//convert the binary event stream message to JSON
			let messageWrapper = that.eventStreamMarshaller.unmarshall(Buffer.from(message.data));
			let messageBody = JSON.parse(String.fromCharCode.apply(String, messageWrapper.body));
			if (messageWrapper.headers[":message-type"].value === "event") {
				console.log('event message')
				console.log(messageBody.Message);
				that.handleEventStreamMessage(siteId,messageBody);
			}
			else {
				//transcribeException = true;
				console.log(messageBody.Message);
				//toggleStartStop();
			}
		};

		socket.onerror = function () {
			//if (that.openSockets.hasOwnProperty(siteId)) delete that.openSockets[siteId]
			//socketError = true;
			console.log('WebSocket connection error. Try again.');
		//	toggleStartStop();
		};
		
		socket.onclose = function (closeEvent) {
			if (that.openSockets.hasOwnProperty(siteId)) that.openSockets[siteId] = false;
			//micStream.stop();
			
			// the close event immediately follows the error event; only handle one.
			//if (!socketError && !transcribeException) {
				//if (closeEvent.code != 1000) {
					//console.log('Streaming Exception: ' + closeEvent.reason);
				//}
			////	toggleStartStop();
			//}
			console.log('CLOSE SOCKET')
			console.log(closeEvent)
		};
	}

	
	
	// AWS METHODS
	convertAudioToBinaryMessage(audioChunk) {
		let raw = audioChunk //mic.toRaw(audioChunk);

		if (raw == null)
			return;

		// downsample and convert the raw audio bytes to PCM
		let downsampledBuffer = audioUtils.downsampleBuffer(raw, this.getSampleRate());
		let pcmEncodedBuffer = audioUtils.pcmEncode(downsampledBuffer);

		// add the right JSON headers and structure to the message
		let audioEventMessage = this.getAudioEventMessage(Buffer.from(pcmEncodedBuffer));

		//convert the JSON object + headers into a binary event stream message
		let binary = this.eventStreamMarshaller.marshall(audioEventMessage);

		return binary;
	}

	getAudioEventMessage(buffer) {
		// wrap the audio data in a JSON envelope
		return {
			headers: {
				':message-type': {
					type: 'string',
					value: 'event'
				},
				':event-type': {
					type: 'string',
					value: 'AudioEvent'
				}
			},
			body: buffer
		};
	}

	createPresignedUrl() {
		let that = this;
		let endpoint = "transcribestreaming." + this.props.region + ".amazonaws.com:8443";

		// get a preauthenticated URL that we can use to establish our WebSocket
		return v4.createPresignedURL(
			'GET',
			endpoint,
			'/stream-transcription-websocket',
			'transcribe',
			crypto.createHash('sha256').update('', 'utf8').digest('hex'), {
				'key': that.props.accessKey,
				'secret': that.props.secret,
				'protocol': 'wss',
				'expires': 15,
				'region': that.props.region,
				'query': "language-code=" + that.props.languageCode + "&media-encoding=pcm&sample-rate=" + that.getSampleRate()
			}
		);
	}

	handleEventStreamMessage(siteId,messageJson) {
		let that = this;
		let results = messageJson.Transcript.Results;

		if (results.length > 0) {
			if (results[0].Alternatives.length > 0) {
				let transcript = results[0].Alternatives[0].Transcript;

				// fix encoding for accented characters
				transcript = decodeURIComponent(escape(transcript));
				console.log('TRANSCRIBE')
				console.log(transcript)
				that.speechCallback(data,siteId)
				//// update the textarea with the latest result
				//$('#transcript').val(transcription + transcript + "\n");

				//// if this transcript segment is final, add it to the overall transcription
				//if (!results[0].IsPartial) {
					////scroll the textarea down
					//$('#transcript').scrollTop($('#transcript')[0].scrollHeight);

					//transcription += transcript + "\n";
				//}
			}
		}
	}
	
	getSampleRate() {
		const languageCode = this.props.languageCode;
		if (languageCode == "en-US" || languageCode == "es-US")
			return 44100;
		else
			return 8000;
	}

	closeSocket (siteId) {
		if (sockets.hasOwnProperty(siteId) && sockets[siteId].OPEN) {
			//if (micStreams.hasOwnProperty(siteId())  micStreams[siteId].stop();

			// Send an empty frame so that Transcribe initiates a closure of the WebSocket after submitting all transcripts
			let emptyMessage = this.getAudioEventMessage(Buffer.from(new Buffer([])));
			let emptyBuffer = this.eventStreamMarshaller.marshall(emptyMessage);
			sockets[siteId].send(emptyBuffer);
		}
	}
	
	

}     

module.exports = HermodAWSTranscribeAsrService 



