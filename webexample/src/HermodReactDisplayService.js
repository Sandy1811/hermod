import React from 'react'
import {Component} from 'react'
import HermodReactComponent from './HermodReactComponent'

export default class HermodReactDisplayService extends HermodReactComponent  {

    constructor(props) {
        super(props);
        if (!props.siteId || props.siteId.length === 0) {
            throw "TTS Server must be configured with a siteId property";
        }
        //this.props.config={}
        let that = this;
        this.state={}
        let eventFunctions = {
        // SESSION
            'hermod/+/display/image' : function(topic,siteId,payload) {
				if (siteId && siteId.length > 0) { 
                   that.setState({image:payload.image});
				}
            },
            'hermod/+/display/buttons' : function(topic,siteId,payload) {
				if (siteId && siteId.length > 0) { 
                   that.setState({buttons:payload.buttons});
				}
            },
            'hermod/+/display/attachment' : function(topic,siteId,payload) {
				if (siteId && siteId.length > 0) { 
                   that.setState({attachment:payload.attachment});
				}
            },
            'hermod/+/display/iframe' : function(topic,siteId,payload) {
				console.log(['IFRAME',payload])
				if (siteId && siteId.length > 0) { 
                console.log(['IFRAME TO '+payload.src])
				   if (payload.src) that.iframeTo(payload.src)
				}
            },
            'hermod/+/display/navigate' : function(topic,siteId,payload) {
				console.log(['NAVIGATE',payload])
				if (siteId && siteId.length > 0) { 
                console.log(['NAVIGATE TO '+payload.to,that.props.navigateTo])
				   if (that.props.navigateTo && payload.to) that.props.navigateTo(payload.to)
				}
            },
            'hermod/+/display/message' : function(topic,siteId,payload) {
				console.log(['MESSAGE',payload])
				if (siteId && siteId.length > 0) { 
                   if (payload.text) that.props.flashMessage(payload.text,payload.timeout)
				}
            }
        }
        this.iframeTo = this.iframeTo.bind(this)
        this.logger = this.connectToLogger(props.logger,eventFunctions);
    }  
    
    iframeTo(src) {
		this.setState({'iframe':src})
	}
    
    flashMessage(message,timeout) {
		console.log(['FLASH MESSAGE '+message,(timeout ? timeout : 3000)])
	}
    
    componentDidMount() {
    };
    
  


    render() {
        return <div id="HermodreactDisplayService"  >
        {this.state.iframe && <iframe src={this.state.iframe+'?printable=yes'} style={{height: '1000px', width:'400px'}} />}
        
        {this.state.image && <img src={this.state.image} style={{maxHeight: '100px'}} />}
        {this.state.buttons && <button>buttons{JSON.stringify(this.state.buttons)}</button>}
        {this.state.attachment && <a href={this.state.attachment}  >Download</a>}
        
        </div>
    };
//{JSON.stringify(this.state,null,1)}
        
  
}

