const wiki = require('wikijs').default;
			wiki({
				apiUrl: 'https://en.wikipedia.org/w/api.php',
				origin: null
			}).page('television')
			  .then(function(page) {
				  return page.info()
				})
				.then(e => console.log(JSON.stringify(e)))
	
