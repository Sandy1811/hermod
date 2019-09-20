const wiki = require('wikijs').default;
const wikiTools = {

	wiktionaryLookupNoun : function (word) {
		console.log('word lookup '+word)
		return new Promise(function(resolve,reject) {
			wiki({
				apiUrl: 'https://en.wiktionary.org/w/api.php',
				origin: null
			}).page(word)
			  .then(function(page) {
				  return new Promise(function(resolve,reject) {
						page.sections().then(function(sections) {
							if (sections && sections.length > 0 && sections[0].items) {
								sections[0].items.map(function(section) {
									if (section.title === "Noun") {
										// strip word and plural then first sentence
										let parts = section.content.split("\n\n")
										let parts2 = parts.length > 1 ? parts[1].split(".\n") : null;
										console.log('meaning '+parts2[0])
		
										if (parts2.length > 0) resolve(parts2[0]);
									}
								}) 
							}
							resolve()
						})
						
					})
				})
			.then((d) => resolve(d)); 
		})
	}	
	,
	wikipediaLookup : function (word) {
		console.log('wiki lookup '+word)
		return new Promise(function(resolve,reject) {
			wiki({
				apiUrl: 'https://en.wikipedia.org/w/api.php',
				origin: null
			}).page(word)
			  .then(function(page) {
				  return new Promise(function(resolve,reject) {
						//page.sections().then(function(sections) {
							//if (sections && sections.length > 0 && sections[0].items) {
								//sections[0].items.map(function(section) {
									//if (section.title === "Noun") {
										//// strip word and plural then first sentence
										//let parts = section.content.split("\n\n")
										//let parts2 = parts.length > 1 ? parts[1].split(".\n") : null;
										//console.log('meaning '+parts2[0])
		
										//if (parts2.length > 0) resolve(parts2[0]);
									//}
								//}) 
							//}
							//resolve()
						//})
						page.summary().then(function(summary) {
							let parts = summary.split(". ")
							resolve(parts[0]);
						})
					})
				})
			.then((d) => resolve(d)); 
		})
	}	
}

module.exports=wikiTools
		
	
	
//summary,sections,images,info,fullInfo
//let promises = [];
		  ////promises.push(page.fullInfo())
		  ////promises.push(page.categories())
		  ////promises.push(page.summary())
		  ////promises.push(page.images())
		  ////promises.push(page.mainImage())
		  ////promises.push(page.tables())
		  //promises.push(page.sections())
		    //Promise.all(promises).then(function(all) {
				//resolve(all);  
			  //})
		   ////,page.categories(),page.images(),page.sections()]
		  //})
			
