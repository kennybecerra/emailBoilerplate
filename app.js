const fsp = require("fs").promises;
const express = require("express");
const handlebars = require("handlebars");
const helperMoment = require("helper-moment");
const mjml = require("mjml");
const cheerio = require("cheerio");
const WebSocket = require("ws");


handlebars.registerHelper('moment', helperMoment);

const app = express();
const PORT = 3232;




app.get("/src/mjml/:file", (req, res) => {

	let [file_name, file_extension] = req.params.file.split("."); 

	//Read all files that are needed 
	let mjmlFileRead = fsp.readFile(`./src/mjml/${file_name}.${file_extension}`, "utf8" )
	let hbsContextRead = fsp.readFile(`./src/context/context.json`, "utf8" )

	Promise.all([mjmlFileRead, hbsContextRead])
		.then(([mjmlData, hbsContext ]) => {

			// TODO -- MJML DATA cleanup before MJML Parse for href in buttons

			let postMJMLParse = mjml(mjmlData);
			let hbsTemplate = handlebars.compile(postMJMLParse.html);
			let postHbsParse = hbsTemplate(JSON.parse(hbsContext));

			if (postHbsParse.errors) console.log(errors)

			return Promise.all([ postMJMLParse, postHbsParse,
				fsp.readFile(`./miscellaneous/websocket.js`, "utf8" ),
				fsp.writeFile(`./dist/hbs/${file_name}.hbs`, postMJMLParse.html, "utf8"),
				fsp.writeFile(`./dist/html/${file_name}.html`, postHbsParse, "utf8")
			])
		})
		.then(([postMJMLParse, postHbsParse, socketScript]) => {

			const $ = cheerio.load(postHbsParse);
			$("body").append(`<script type="text/javascript">${socketScript}</script> `)
			const completeHTML = $.html();
	
			res.send(completeHTML)
		})
		.catch((err) => {
			res.send(err);
			throw new Error(err);
		}) 

})


app.get("/", (req, res) => {

	fsp.readdir(`./src/mjml`,  { encoding: "utf8", withFileTypes: true})
		.then( (firstLevel) => {
			console.log()
			
			return Promise.all([ 
				firstLevel, 
				fsp.readFile(`./miscellaneous/folderStructure.html`, "utf8"),
				fsp.readFile(`./miscellaneous/websocket.js`, "utf8" ), ])
		})
		.then( ([firstLevel, folderStructureHTML, socketScript] ) => {
			console.log(firstLevel)

			const $ = cheerio.load(folderStructureHTML);
			$("ul.collapsible").append(`
					<li>
						<div class="collapsible-header"><i class="material-icons">folder</i>MJML</div>
						<div class="collapsible-body">
						
						<ul class="collection">
						
							${firstLevel.map((file) => {
								if (file.isFile()) {
									return `
									<li class="collection-item"><div><i class="material-icons">insert_drive_file</i><span class="inline-text">${file.name}</span>
											<a href="./src/mjml/${file.name}" class="secondary-content">
												<i class="material-icons">send</i>
											</a>
										</div>
									</li>
									`
								}
							})}
					
						</ul>
					</div>
				</li>`)
			$("body").append(`<script type="text/javascript">${socketScript}</script> `)
			const completeHTML = $.html();

			res.send(completeHTML);
		})

})

app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));


const server = new WebSocket.Server({port: "8080"});

server.on("connection", ws => {

	ws.on("open", () => {
		ws.send("started the connection")
	})

	ws.on("close", () => {
		// console.log("closed the connection")
		ws.send("closed the connection")
	})

	ws.on("message", (data) => {
		console.log(`closed the connection : ${data}`)
		// ws.send("closed the connection")
	})
})
