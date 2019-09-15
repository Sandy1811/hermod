var HermodService = require('./HermodService')

class HermodJovoService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.state={messages:[]}
        let eventFunctions = {
            // TODO START THESE LISTENERS WHEN GET WEB REQUEST THEN STOP WHEN CONTINUE OR END
            'hermod/+/tts/say' : function(topic,siteId,payload) {
				if (payload.text && payload.text.length > 0 ) {
					let messages = this.state.messages;
					messages.push({type:'text',text:payload.text})
					that.setState({messages:messages})
				}
            },
            'hermod/+/display/image' : function(topic,siteId,payload) {
				if (payload.text && payload.text.length > 0 ) {
					let messages = this.state.messages;
					messages.push({type:'image',text:payload.image})
					that.setState({messages:messages})
				}
            }
            ,
            'hermod/+/dialog/end' : function(topic,siteId,payload) {
				// send jovo say
				if (payload.text && payload.text.length > 0 ) {
				}
			},
            'hermod/+/dialog/continue' : function(topic,siteId,payload) {
				// send jovo ask
				if (payload.text && payload.text.length > 0 ) {
				}
			}
            //,
            //'hermod/+/speaker/play' : function(topic,siteId,payload) {
				//if (payload.text && payload.text.length > 0 ) {
					//let messages = this.state.messages;
					//messages.push({type:'sound',audio:payload})
					//that.setState({messages:messages})				}
            //}
        }
        this.manager = this.connectToManager('TTS',props.manager,eventFunctions);
    }  
        
  

}
module.exports = HermodJovoService
