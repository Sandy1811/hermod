var HermodMqttServer = require('./HermodMqttServer')

/**
 * This class handles subscriptions and publishing to mqtt for a
 * suite of services running in the same node process.
 * Services can register subscription callbacks when constructed
 * Services can also add subscription callbacks on the fly and clean them up afterwards. 
 */
class HermodSubscriptionManager  extends HermodMqttServer {
    constructor(props) {
        super(props);
        this.subscriptions = {};
        this.subscriptionIndex = {};
        let that = this;
        if (!this.props.siteId || this.props.siteId.length === 0) {
            throw "Subscription manager must be configured with a siteId property";
        }
    }

    addSubscription(topic,callback,oneOff = false) {
		if (topic && topic.length && typeof callback === "function") {
			let subscriptionId = parseInt(Math.random()*100000000,10);
			// lookup or create
			let topicSubscription = {};
			if (this.subscriptions.hasOwnProperty(topic)) {
				topicSubscription = this.subscriptions[topic]
			} else {
				// real subscription when first created
				this.subscribe(topic)
			}
			topicSubscription[subscriptionId] = {oneOff:oneOff,callBack:callback}
			this.subscriptions[topic] = topicSubscription;
			this.subscriptionIndex[subscriptionId] = topic;
			return subscriptionId;
		}
	}
	
	getSubscription(id) {
		if (this.subscriptionIndex.hasOwnProperty(id)) {
			return this.subscriptions[this.subscriptionIndex[id]][id];
		}
	}
	
	removeSubscription(id) {
		let topic = this.subscriptionIndex[id];
		if (topic) {
			delete this.subscriptions[topic][id];
			delete this.subscriptionIndex[id];
		}
		// unsub and cleanup if no more subscriptions on  this topic
		if (this.subscriptions.hasOwnProperty(topic) && Object.keys(this.subscriptions[topic]).length == 0) {
			this.unsubscribe(topic);
			delete this.subscriptions[topic];
		}
	}
	
    
    
    afterConnect() {
	}
     
    /** Take an object containing callback functions keyed to mqtt topics
		- subscribe to relevant topics (allowing for siteId)
		- save callbacks for onMessageArrived
     */
   addCallbacks(service,eventCallbackFunctions,oneOff = false,subscribeAll=true,siteId,timeout) {
	   if (!siteId) siteId = this.props.siteId;
		//console.log(['MANAGER ADDCALLBACKS',service,subscribeAll,eventCallbackFunctions])
        let that = this;
		let callbackIds=[]
        if (eventCallbackFunctions) {
            Object.keys(eventCallbackFunctions).map(function(key,loopKey) {
                let value = eventCallbackFunctions[key];
                if (typeof value === "function") {
		            let siteTopic = key;
                    let topicParts = key.split('/') 
                    
                    // don't force dialog service to configured site
                   let tkey = siteTopic.replace("hermod/+/","hermod/"+siteId+"/");
					callbackIds.push(that.addSubscription(tkey,value,oneOff));
					// subscribeAll is used for site specific services - tts, speaker, microphone
					if (!oneOff && subscribeAll && that.props.allowedSites && that.props.allowedSites.length > 0) {
						that.props.allowedSites.split(",").map(function(siteIdI) {
							if (siteId !== siteIdI) {
								let thisKey = siteTopic.replace("hermod/+/","hermod/"+siteIdI+"/");
								callbackIds.push(that.addSubscription(thisKey,value,false));
							}
						});
					}
				}
            });
        }
        return callbackIds;
    };
   
 

	removeCallbackById(callbackId) {
	//	console.log(['REMOVE EVENTCALLBACKS',callbackId])
       this.removeSubscription(callbackId);
	}

       
    /**
     * Handle published message for all subscribed topics on all services.
     */
    onMessageArrived(topic,message) {
		let that = this;
		let parts = topic ? topic.split("/") : [];
        let payload = null
		if (parts.length > 0 && parts[0] === "hermod") {
            // Audio Messages pass through message body direct
            if (parts.length > 3 && (parts[2]==="speaker"&& parts[3]==="play"  )) {
				payload = message;
			} else if (parts.length > 3 && (parts[2]==="microphone" && parts[3]==="audio"))  {
				payload = message;
			} else {
				// only log non audio
				try {
                  payload = JSON.parse(message.toString());  
                } catch (e) {
		//    console.log(['JSON PARSE ERROR',message.toString()]);
				  payload = {}
                }
             }
			
			
			let siteId = parts[1];
			let callbacks = this.subscriptions[topic];
			if (callbacks) {
				for (var subscriptionId in callbacks) {
					let value = callbacks[subscriptionId]
					value.callBack.bind(that)(topic,siteId,payload);
					if (value.oneOff) {
						this.removeCallbackById(subscriptionId)
					}
				};
			}	
	
        }
    };
}
module.exports = HermodSubscriptionManager
