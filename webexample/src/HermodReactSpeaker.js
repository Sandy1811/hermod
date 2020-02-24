import React from 'react'
import {Component} from 'react'
import HermodReactComponent from './HermodReactComponent'

export default class HermodReactSpeaker extends HermodReactComponent  {

    constructor(props) {
        super(props);
        let that = this;
        
        if (!props.siteId || props.siteId.length === 0) {
            throw "Speaker must be configured with a siteId property";
        }
        this.stopPlaying = this.stopPlaying.bind(this);
        this.playSound = this.playSound.bind(this);
        this.setVolume = this.setVolume.bind(this);
        this.state = {} 
        this.gainNode = null
        this.oldVolume = null;
        let eventFunctions = {
        // SESSION
            'hermod/+/speaker/play' : function(destination,siteId,audio) {
               // console.log(['SPEAKER PLAY',destination,siteId,audio])
                if (siteId && siteId.length > 0) { // && siteId === that.props.siteId) {
                    that.sendMqtt("hermod/"+siteId+"/speaker/started",{}); 
						
                    that.playSound(audio).then(function(res) {
                        that.sendMqtt("hermod/"+siteId+"/speaker/finished",{}); 
					}); 
                }
            },
            'hermod/+/asr/start': function(topic,siteId,payload) {
                // quarter volume
                if (that.gainNode) {
					that.oldVolume = that.gainNode.gain.value
					that.gainNode.gain.value = that.gainNode.gain.value/4;
				}
            }
            ,
            'hermod/+/asr/stop': function(topic,siteId,payload) {
                // restore volume 
                if (that.gainNode) that.gainNode.gain.value = that.oldVolume;
            }
            ,
             'hermod/+/speaker/stop' : function(topic,siteId,payload) {
				that.stopPlaying()
			}
        }
        
        this.logger = this.connectToLogger(props.logger,eventFunctions);
        
    }  
   
    stopPlaying() {
		let that = this;
		if (this.gainNode)  this.gainNode.disconnect();
		//this.gainNode = null;
		that.sendMqtt("hermod/"+that.props.	siteId+"/speaker/finished",{}); 
		//that.sendMqtt("hermod/"+that.props.siteId+"/microphone/stop",{}); 
		//that.sendMqtt("hermod/"+that.props.siteId+"/dialog/end",{}); 
	}
   
    setVolume(volume) {
        if (this.gainNode) this.gainNode.gain.value = volume;
    };
    
    playSound(bytes) {
        let that = this;
        return new Promise(function(resolve,reject) {
            try {
				if (bytes && bytes.length > 0 && that.props.config && that.props.config.enableaudio !== "no") {
					var buffer = new Uint8Array( bytes.length );
					buffer.set( new Uint8Array(bytes), 0 );
					let audioContext = window.AudioContext || window.webkitAudioContext;
					let context = new audioContext();
					that.gainNode = context.createGain();
					// initial set volume
					that.gainNode.gain.value = that.props.config && that.props.config.outputvolume/100 ? that.props.config.outputvolume/100 : 0.5;
					that.oldVolume = that.gainNode.gain.value
					context.decodeAudioData(buffer.buffer, function(audioBuffer) {
						try {
							var source = context.createBufferSource();
							source.buffer = audioBuffer;
							source.connect(that.gainNode);
							that.gainNode.connect( context.destination );
							source.start(0);
							source.onended = function() {
								resolve();
							};
						} catch (e) {
							console.log(e)
							resolve()
						}
					});
				} else {
					resolve();
				}
			} catch (e) {
				console.log(e)
				resolve()
			}
        });                        
    }
    
    
    
    render() {
        return <span id="Hermodreactspeaker" ></span>
    };
}
