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

const actions = {
	action_welcome:function() {return {responses:[{text:'Hi, how can I help?'}]}},
	action_eek:function() {},
	action_dostuff:function() {
		return {
			"events": [
			//{
			//"event": "slot",
			//"timestamp": 1559744410
			//}
			],
			"responses": [
			{
			"text": "all done"
			}
			]
		}
	},
	
}

const port = 5055
app.get('/', (req, res) => {
  res.send('Hi from the action server')
})
app.post('*', (req, res) => {
	console.log('ACTION HIT')
	console.log(req.body);
	if (req.body && req.body.next_action) {
		if (actions.hasOwnProperty(req.body.next_action)) {
			res.send(actions[req.body.next_action](req.body))
		} else {
			res.send({error:'no such action - '+req.body.next_action})
		}
	} else {
		res.send({error:'no such action - '+req.body.next_action})
	}

})

app.listen(port, () => console.log(`RASA Hermod Action Server listening on port ${port}!`))

console.log('hermod done')    
