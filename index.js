const fs = require('fs');
const http = require('http');
const parse = require('node-html-parser').parse;
const axios = require('axios');

const url =
	'https://gist.githubusercontent.com/josejbocanegra/b1873c6b7e732144355bb1627b6895ed/raw/d91df4c8093c23c41dce6292d5c1ffce0f01a68b/newDatalog.json';

function setTables(callback) {
	axios
		.get(url)
		.then((response) => {
			let json = response.data;
			fs.readFile('index.html', (err, data) => {
				if (err) throw err;

				const root = parse(data.toString());
				const body = root.querySelector('body');

				// Reference to table of Events
				const tEvents = body.querySelector('#tEvents');

				// Head and body of the table
				const thead = tEvents.querySelector('thead');
				const tbody = tEvents.querySelector('tbody');

				const tTitle = thead.querySelector('#tTitle');
				const tSubtitles = thead.querySelector('#tSubtitles');

				tTitle.appendChild(parse('<h1>Events</h1>'));

				const keys = [ 'events', 'squirrel' ];

				// Set Subtitles of the table
				tSubtitles.appendChild(parse('<th scope="col">#</th>'));
				keys.forEach((key) => tSubtitles.appendChild(parse('<th scope="col">' + key + '</th>')));

				/*
				let keysAppend = [];

				keys.forEach((key) => keysAppend.push(parse('<th scope="col">' + key + '</th>')));

				tSubtitles.set_content(keysAppend);
				*/

				let i = 1;
				json.forEach((item) => {
					let row = '<th>' + i + '</th>';
					let squirrel = false;
					keys.forEach((key) => {
						let obj = item[key];
						if (Array.isArray(obj)) {
							row += '<th>' + obj.join() + '</th>';
						}
						else {
							if (typeof obj == 'boolean' && obj == true) {
								squirrel = true;
							}

							row += '<th>' + obj + '</th>';
						}
					});

					if (squirrel) {
						tbody.appendChild(parse('<tr class="table-danger">' + row + '</tr>'));
					}
					else {
						tbody.appendChild(parse('<tr>' + row + '</tr>'));
					}
					i++;
				});

				callback(root.toString());
			});
		})
		.catch(function(error) {
			// handle error
			console.log(error);
		})
		.then(function() {
			// always executed
		});
}

http
	.createServer((req, res) => {
		if (req.url == '/') {
			setTables((data) => {
				res.end(data);
			});
		}
		else {
			res.end('Esta página no existe');
		}
	})
	.listen(8081);
