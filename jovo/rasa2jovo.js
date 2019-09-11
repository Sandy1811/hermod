var data = require('./sara.json')
var jovoBase = require('./jovo_base_model.json')
var intents = {};
var inputTypes = {}
var values={}

function addValue(value,entityType) {
	// save value to inputTypes
	inputTypes[entityType].values[value]={value:value}
	// also keep index of values back to entityTypes to support synonyms
	if (!values.hasOwnProperty(value)) values[value] = {};
	values[value][entityType] = 1;
}

const examples = data.hasOwnProperty('rasa_nlu_data') && data.rasa_nlu_data.hasOwnProperty('common_examples') ? data.rasa_nlu_data.common_examples : null;

if (examples) {
	examples.map(function(example) {
		//console.log(example)
		if (example.intent) {
			if (!intents.hasOwnProperty(example.intent)) {
				intents[example.intent] = {name:example.intent,phrases:[]};
			}
			intents[example.intent].phrases.push(example.text);
			if (example.entities) {
				if (!intents[example.intent].hasOwnProperty(example.intent)) intents[example.intent].inputs = {}
				example.entities.map(function(entity) {
					const entityType = entity.entity+"Type"
					intents[example.intent].inputs[entity.entity] = {name: entity.entity,type:entityType}
					// also input type index
					if (!inputTypes.hasOwnProperty(entityType)) inputTypes[entityType] = {name:entityType, values:{}}
					addValue(entity.value,entityType);
					//inputTypes[entityType].values[entity.value]=1
				}) 
			}
		}
	});
}

// integrate lookup_tables into inputTypes as values
const lookup_tables = data.hasOwnProperty('rasa_nlu_data') && data.rasa_nlu_data.hasOwnProperty('lookup_tables') ? data.rasa_nlu_data.lookup_tables : null;

if (lookup_tables) {
	lookup_tables.map(function(lookup_table) {
		let lookupType = lookup_table.name+'Type'
		if (inputTypes.hasOwnProperty(lookupType)) {
			if (lookup_table.elements) {
				lookup_table.elements.map(function(element) {
					inputTypes[lookupType].values[element] = 1; 
				})
			}
		}
	})
}


// integrate synonyms into inputTypes
const synonyms = data.hasOwnProperty('rasa_nlu_data') && data.rasa_nlu_data.hasOwnProperty('entity_synonyms') ? data.rasa_nlu_data.entity_synonyms : null;
if (synonyms) {
	synonyms.map(function(synonym) {
		if (synonym.value && values.hasOwnProperty(synonym.value)) {
			//console.log(synonym)

			// for each inputType mapped to this value, updte synonyms
			Object.keys(values[synonym.value]).map(function(inputType) {
				//console.log(inputType)
				//console.log('SET SYN')
				//console.log(synonym)
				inputTypes[inputType].values[synonym.value].synonyms = synonym.synonyms
			})
		} 
		//let lookupType = lookup_table.name+'Type'
		//if (inputTypes.hasOwnProperty(lookupType)) {
			//if (lookup_table.elements) {
				//lookup_table.elements.map(function(element) {
					//inputTypes[lookupType].values[element] = 1; 
				//})
			//}
		//}
		
	})
}

// where object fields have been used for collation, convert back to array

Object.keys(intents).map(function(intentKey) {
	if (intents[intentKey].hasOwnProperty('inputs')) intents[intentKey].inputs = Object.values(intents[intentKey].inputs);
});

Object.keys(inputTypes).map(function(inputType) {
	if (inputTypes[inputType].hasOwnProperty('values')) inputTypes[inputType].values = Object.values(inputTypes[inputType].values);
});


var final = jovoBase
final.intents = Object.values(intents);
final.inputTypes = Object.values(inputTypes);
console.log("============================================================");
console.log("============================================================");
console.log(JSON.stringify(final));
//console.log("============================================================");
//console.log("============================================================");
 //console.log(JSON.stringify(Object.values(inputTypes)));


