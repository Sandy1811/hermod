const wiki = require('wikijs').default;
var wtf = require('wtf_wikipedia');

const wikiTools = {

	wiktionaryLookupNoun : function (word) {
		console.log('word lookup '+word)
		return new Promise(function(resolve,reject) {
			try {
				wiki({
					apiUrl: 'https://en.wiktionary.org/w/api.php',
					origin: null
				}).page(word)
				  .then(function(page) {
					  return new Promise(function(resolve,reject) {
							page.sections().then(function(sections) {
								if (sections && sections.length > 0 && sections[0].items) {
									sections[0].items.map(function(section) {
										if (section.title === "Noun" || section.title === "Verb" || section.title === "Adjective") {
											// strip word and plural then first sentence
											let parts = section.content.split("\n\n")
											let parts2 = parts.length > 1 ? parts[1].split(".\n") : null;
											console.log('meaning '+parts2[0])
			
											if (parts2.length > 0) resolve({page:page,data:parts2[0].replace(/ *\([^)]*\) */g, " ").trim()});
										
										}
									}) 
								}
								resolve(page,'')
							})
							
						})
					})
				.then((d) => resolve(d)).catch(function(e) {console.log(e); resolve(); }); 
			} catch (e) {
				resolve(page,'')
			}
		})
	}	
	,
	wikipediaLookup : function (word) {
		console.log('wiki lookup '+word)
		return new Promise(function(resolve,reject) {
			try {
				wiki({
					apiUrl: 'https://en.wikipedia.org/w/api.php',
					origin: null
				}).page(word)
				  .then(function(page) {
					  console.log(page)
					  return new Promise(function(resolve,reject) {
							page.summary().then(function(summary) {
								let parts = summary.split(". ")
								resolve({page:page,data:parts[0].replace(/ *\([^)]*\) */g, " ").trim()});
							})
						})
					})
				.then((d) => resolve(d)).catch(function(e) {console.log(e); resolve(); }) 
			} catch (e) {
				resolve(page,'')
			}
		})
	}
	,
	wikipediaLookupInfo : function (word) {
		console.log('wiki info '+word)
		return new Promise(function(resolve,reject) {
			try {
				wtf.fetch(word).then(doc => {
					if (doc) {
						let infoboxes = doc.infoboxes();
						if (infoboxes && infoboxes.length > 0) {
							resolve({data:infoboxes[0]});
						} else {
							resolve({data:{}})
						}
					} 
					resolve({data:{}})
				})
				//wiki({
					//apiUrl: 'https://en.wikipedia.org/w/api.php',
					//origin: null
				//}).page(word)
				  //.then(function(page) {
					  //console.log(page)
					  //return new Promise(function(resolve,reject) {
							//page.info().then(function(info) {
								//resolve({page:page,data:info});
							//})
						//})
					//})
				//.then((d) => resolve(d)).catch(function(e) {console.log(e); resolve(); }); 
			} catch (e) {
				resolve(page,{})
			}
		})
	}
	,
	wikipediaLookupSummary : function (word) {
		console.log('wiki lookup summary'+word)
		return new Promise(function(resolve,reject) {
			try {
				wiki({
					apiUrl: 'https://en.wikipedia.org/w/api.php',
					origin: null
				}).page(word)
				  .then(function(page) {
					  return new Promise(function(resolve,reject) {
							page.summary().then(function(summary) {
								resolve({page:page,data:summary.replace(/ *\([^)]*\) */g, " ").trim()});
							})
						})
					})
				.then((d) => resolve(d)).catch(function(e) {console.log(e); resolve(); }); 
			} catch (e) {
				resolve(page,'')
			}
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
			
