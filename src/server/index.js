const express = require('express');
const os = require('os');
const fs = require('fs');
const app = express();
// import file writing utils
const flUtils = require('./utils/fraudFileUtils')

// helper functions

// run rules engine on input files
const passInputFileToRulesEngine = function () {

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
	
	const rawEngineOutput = fs.readFileSync('./src/server/temp/engineOutput.json')
	const engineOutput = JSON.parse(rawEngineOutput)
	const browser = engineOutput.rbt
	const version = engineOutput.rbv
	console.log('name', browser.toLowerCase() + '.' + version + '.json')

	return browser.toLowerCase() + '.' + version + '.json'
}

// driver code

app.use(express.static('dist'));
app.get('/api/profile_browser', (req, res) => {
	// grab headers and user agent
	const headerStrings = req.rawHeaders

	const data = {}
	data.headers = {}

	for (i=0; i<headerStrings.length; i+=2){
		data.headers[headerStrings[i].toLowerCase()] = headerStrings[i+1]
	}
	data.user_agent = data.headers["user-agent"]
	
	// write the user agent to a file
	fs.writeFile('./src/server/temp/input.csv', data.user_agent, 'utf8', function (err) {
		if (err) {
			console.log("An error occured writing user-agent to a file\n", err)
		} else {
			console.log("Succes! User-agent written to input file")
		}
	})

	// create file name and write header data to json file titled the same
	const formattedHeaders = JSON.stringify(data)

	getFileName()
	.then((name) => {
		// TODO: If a filename exists, just add to it instead of replacing it
		fs.writeFile(`./src/server/results/${name}`, formattedHeaders, 'utf8', function (err) {

			if (err) {
				console.log("An error occured saving the headers\n", err)

			// return user-agent from JSON file to verify success
			} else {
				rawFileData = fs.readFileSync(`./src/server/results/${name}`)
				fileData = JSON.parse(rawFileData)

				console.log("User-Agent", fileData["user_agent"])
				console.log("Headers Saved Succesfully!")
			}
		})
	})
	.then(() => {
		flUtils.deleteAllFilesInFolder('./src/server/temp')
	})
	
	res.send({ username: os.userInfo().username })
});

app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));

/*
Chrome: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36

Safari: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15

Firefox: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:101.0) Gecko/20100101 Firefox/101.0

*/