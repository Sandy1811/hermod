var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');

class HermodRasaNluService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        let eventFunctions = {
            'hermod/+/nlu/parse' : this.sendRequest.bind(this)
        }		
        this.manager = this.connectToManager('NLU',props.manager,eventFunctions);
    }
    
    // find a matching intent from the results of a NLU parse request
    // allow for payload to optionally have array of intents that are regex patterns defining allowed intent matches
    findMatchingIntent(payload,data) {
		let that = this;
		// bail out if no match on primary intent
		var minConfidence = that.props.minConfidence ? that.props.minConfidence : 0.3;
		if (data.intent && data.intent.name && data.intent.name.length > 0) {		
			if (payload.intents && payload.intents.length > 0) {
				// is primary matched intent ok with intent filters from payload 
				var found = false;
				for (i in payload.intents) {
					let intentPattern= payload.intents[i];
					let r =new RegExp(intentPattern);
					if (r.test(data.intent.name)) {
						if (intent.confidence >= minConfidence) {
							found = true;
							break;
						}
					}
				}
				if (found) {
					return data.intent;
				} else {
					// what about secondary matches
					if (data.intent_ranking && data.intent_ranking.length > 0) {
						for (var j in data.intent_ranking) {
							let intent = data.intent_ranking[j] 
							for (var i in payload.intents) {
								let intentPattern= payload.intents[i];
								let r =new RegExp(intentPattern);
								if (r.test(data.intent.name)) {
									if (intent.confidence >= minConfidence) {
										return intent;
									}
									
								}
							}
						}
					} else {
						return null;
					}
				}			
			} else {
				// no filter
				return data.intent;
			}
		} else {
			return null;
		}
	}
   
	sendRequest(topic,siteId,payload) {
		let that = this;
		that.sendMqtt('hermod/'+siteId+'/nlu/started',{dialogId:payload.dialogId});	
		if (payload.text && payload.text.length> 0) {		
			axios.post(this.props.rasaServer+"/model/parse",{text:payload.text}) 
			  .then(response => {
				var matchingIntent = this.findMatchingIntent(payload,response.data);
				if (matchingIntent) {
					that.sendMqtt('hermod/'+siteId+'/nlu/intent',Object.assign(payload,response.data));
				} else {
					that.sendMqtt('hermod/'+siteId+'/nlu/fail',Object.assign(payload,response.data));	  
				}
			  })
			  .catch(error => {
				  console.log(error);
				  that.sendMqtt('hermod/'+siteId+'/nlu/fail',payload);
			  });
		} else {
			that.sendMqtt('hermod/'+siteId+'/nlu/fail',payload);
		}
	}
	
}     
module.exports=HermodRasaNluService
