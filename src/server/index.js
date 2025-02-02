const express = require('express');
const app = express();
// import file writing utils
const flUtils = require('./utils/fraudFileUtils')

// helper functions

// convert header strings to an object
async function mapHeaderStrings (strings) {
	const data = {}
	data.headers = {}

	for (i=0; i<strings.length; i+=2){
		data.headers[strings[i].toLowerCase()] = strings[i+1]
	}
	data.user_agent = data.headers["user-agent"]

	return data
}

// run rules engine on input files
async function passInputFileToRulesEngine () {

	const inputPath = '/Users/kmantinaos/Documents/GitHub/simple-react-full-stack/src/server/temp/input.csv'
	const outputPath = '/Users/kmantinaos/Documents/GitHub/simple-react-full-stack/src/server/temp/engineOutput.json'

	return new Promise(function (resolve, reject) {
		var exec = require('child_process').exec;

		//syntax and how to use rules engine cli: https://confluence.integralads.com/pages/viewpage.action?spaceKey=EN&title=Running+Rules+Engine+CLI

		var javaCommandStr = 'java -cp rules-engine-2.jar com.beehive.analytics.App ' + 
		'-inputFileName ' + inputPath + 
		' -outputFileName ' + outputPath + 
		' -parseUserAgent true'

		exec(javaCommandStr, {cwd: '/Users/kmantinaos/Documents/GitHub/simple-react-full-stack/src/server'}, function (err, a, b) {
			if (err) {
				console.log('error passInputFileToRulesEngine()', err);
				reject();
			} else {

				resolve()
			}
		});
	})
};

// call rules engine and translate output into a file name
async function getFileName () {
	await passInputFileToRulesEngine()
	
	const engineOutput = await flUtils.loadJSON('./src/server/temp/engineOutput.json')
	const browser = engineOutput.rbt
	const version = engineOutput.rbv

	return browser.toLowerCase() + '.' + version + '.json'
}

// driver code

app.use(express.static('dist'));
app.get('/api/profile_browser', async (req, res) => {
	// grab headers and user agent
	const data = await mapHeaderStrings(req.rawHeaders)

	// write the user agent to input file
	flUtils.writeToFile('./src/server/temp/input.csv', data.user_agent)

	// create file name and write header data to json file titled the same
	getFileName()
	.then((name) => {
		flUtils.writeJSONToFile(`./src/server/definitions/${name}`, data)
		return name
	})
	.then((name) => {
		console.log(`Success! Request headers saved to ${name}`)
		flUtils.deleteAllFilesInFolder('./src/server/temp')
		res.send({ username: `you are browsing on ${name.slice(0, name.length-5)}`})
	})
	.catch(err => console.log(err))
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));

/*
Chrome: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36

Safari: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15

Firefox: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0

*/