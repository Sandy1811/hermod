var config = require('./config')
// ensure siteId
config.siteId = config.siteId ? config.siteId :  'site'+parseInt(Math.random()*100000000,10);
      
console.log('hermod')      
        
var HermodSubscriptionManager = require('./HermodSubscriptionManager')
var manager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites,mqttServer:config.mqttServer});
manager.mqttConnect().then(function() {

	// Require then instantiate each service key passing contained properties to constructor
	Object.keys(config.services).map(function(serviceKey) {
		var classRef = null;
		// allow for explicit require path to service implementation
		if (config.services[serviceKey].require) {
			classRef = require(config.services[serviceKey].require);
		} else {
			classRef = require('./' + serviceKey);
		}
		var imanager = new HermodSubscriptionManager({siteId:config.siteId,username:config.username,password:config.password,allowedSites:config.allowedSites,mqttServer:config.mqttServer});
		imanager.mqttConnect().then(function() {

			var h = new classRef(Object.assign(config.services[serviceKey],{manager:imanager,siteId:config.siteId}));	// override siteId,logger
		});
	})	
})

// TODO ACTION WEBSERVER ON "http://localhost:5055/webhook"
const express = require('express')
const app = express()

const bodyParser= require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//app.use('/watson',require('./IbmWatsonSTT/app.js'));
// WATSON AUTH ENDPOINT
// TO RESTRICT ACCESS INTEGRATE WITH PARENT APPLICATION AS SECURE ENDPOINT
const watson = require('./ibm-watson-stt');
let portw = 5054
watson.listen(portw);
console.log('watson listening at:', portw);

const actions = config.actions

const port = 5055
app.get('/', (req, res) => {
  res.send('Hi from the action server')
})

app.post('*', (req, res) => {
	//console.log('ACTION HIT') 
	//console.log(req.body);
	if (req.body && req.body.next_action) {
		if (actions.hasOwnProperty(req.body.next_action)) {
			// call action with tracker slots as parameters
			//console.log(['run action '+req.body.next_action,req.body.tracker.slots])
			//if (actions[req.body.next_action].then) {
				console.log(['promise action '+req.body.next_action,JSON.stringify(req.body.tracker)])
				// action parameters - tracker slots, mqttManager, siteId, complete tracker
				actions[req.body.next_action]((req.body && req.body.tracker && req.body.tracker.slots ? req.body.tracker.slots : {}),manager,config.siteId,req.body.tracker).then(	function(message) {
					//console.log('promise action complete '+req.body.next_action)
					res.send(message)
				}) 	   
			//} else {  
				//console.log('non promise action '+req.body.next_action)
			
				//res.send(actions[req.body.next_action]((req.body && req.body.tracker && req.body.tracker.slots ? req.body.tracker.slots : {})))
			//}  
		} else {
			//console.log('no such action '+req.body.next_action)
			res.send({error:'no such action - '+req.body.next_action})
		}
	} else {   
		//console.log('no next action ')
		res.send({error:'no such action - '+req.body.next_action})
	}

})

app.listen(port, () => console.log(`RASA Hermod Action Server listening on port ${port}!`))

console.log('hermod done')    
