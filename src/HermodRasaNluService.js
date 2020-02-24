var HermodService = require('./HermodService')

var stream = require('stream') 
var Readable = stream.Readable;
const axios = require('axios');
var nlp = require('compromise');
const yaml = require('js-yaml');
const fs   = require('fs');
 
class HermodRasaNluService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.props = props;
        let eventFunctions = {
            'hermod/+/nlu/parse' : this.sendRequest.bind(this)
        }	
        let state = {};	
        this.manager = this.connectToManager('NLU',props.manager,eventFunctions);
        // Get document, or throw exception on error
		if (props.slotMappingFile) {
			try {
			  var doc = yaml.safeLoad(fs.readFileSync(props.slotMappingFile, 'utf8'));
			  //console.log('slot mappings');
			  //console.log(doc);
			  state = {slotMappings:doc}
			} catch (e) {
			  console.log(e);
			}
		}
		this.state = state;
		this.mapSlots = this.mapSlots.bind(this)
    }
    
    // handle slot mappings

	mapSlots(message,intent,collateSlots) {
		let that = this;	
		let mappedSlots=[]
		//console.log('MAP SLOTS '+message+'---'+intent)
		//console.log(this.state.slotMappings)
		if (this.state.slotMappings.hasOwnProperty(intent)) {
			Object.keys(this.state.slotMappings[intent]).map(function(slot) {
				let patterns = that.state.slotMappings[intent][slot];
				const plugin={patterns:{}}
				if (patterns) patterns.map(function(pattern) {
					plugin.patterns[pattern] = "Word"
				})
				//console.log(message)
				//console.log(patterns)
				nlp.plugin(plugin);
				let doc = nlp(message);
				let res = doc.match('#Word').out('text')
		//console.log('MAP SLOTS FIND '+res)
				// don't override slots set by RASA
				if (res && res.length > 0 && !collateSlots.hasOwnProperty(slot)) {
					let start = message.indexOf(res);
					let end = start + res.length;	
					mappedSlots.push({
						value:  res,
						start: start,
						end: end,
						entity: slot,
						confidence: 1,
						extractor: 'CompromiseNLPEntityExtractor'
					})
				}
			})
		}
		return mappedSlots;
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
					let collateSlots = {}
					if (response.data.entities) response.data.entities.map(function(entity) {
						if (entity && entity.entity) collateSlots[entity.entity] = entity;
					})
					let mappedSlots = this.mapSlots(payload.text,matchingIntent.name,collateSlots);
					//console.log('MAPPED SLOTS')
					//console.log(matchingIntent.name);
					//console.log(payload);
					//console.log(response.data);
					//console.log(mappedSlots);
					
					if (mappedSlots) mappedSlots.map(function(entity) {
						collateSlots.entity = entity;
					});
					payload.entities = Object.values(collateSlots)
					console.log('MAPPED SLOTS')
					//console.log(matchingIntent.name);
					console.log(Object.assign(response.data,payload));
					that.sendMqtt('hermod/'+siteId+'/nlu/intent',Object.assign(response.data,payload));
				} else {
					that.sendMqtt('hermod/'+siteId+'/nlu/fail',Object.assign(response.data,payload));	  
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
