//const wiki = require('wikijs').default;
			//wiki({
				//apiUrl: 'https://en.wikipedia.org/w/api.php',
				//origin: null
			//}).page('Australia')
			  //.then(function(page) {
				  //return page.info()
				//})
				//.then(e => console.log(JSON.stringify(e)))
	
	////fetch('https://kgsearch.googleapis.com/v1/entities:search?limit=100&types=MusicGroup&types=Person&key=AIzaSyDj5IgbuLmaoSrcNwBadk7ayEw2kfrNWaA&query='+shortSearchKeyGoogle)
				//.then(function(response) {
					//return response.json()
				//}).then(function(json) {
					//if (json.error) {
						//isError = true
					//}
					//console.log(json)
					//if (json && json && json.itemListElement && json.itemListElement.length > 0) {
						//resolve({key:'google',value:json.itemListElement})
					//} else {
						//resolve({key:'google',value:null})
					//}
				//})
			//}))
var wtf = require('wtf_wikipedia');

wtf.fetch('New Zealand').then(doc => {

  console.log(doc.categories());
  //['Oral communication', 'Vocal music', 'Vocal skills']

  //console.log(doc.sections('As communication').text());
  // 'A traditional whistled language named Silbo Gomero..'

  console.log(doc.images(0).thumb());
  // 'https://upload.wikimedia.org..../300px-Duveneck_Whistling_Boy.jpg'

  console.log(doc.sections('See Also').links().map(link => link.page))
  //['Slide whistle', 'Hand flute', 'Bird vocalization'...]
  console.log('INFO');
  console.log(doc.infoboxes())
  doc.infoboxes().map(function(box) {
	  console.log(['CAP',box.get('capital').text()])
	 // console.log(box.json());
  })
  
});
