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

				// Total of records in the table Events
				let total = json.length;

				// Number of records whose "squirrel" value is true
				let nTrue = 0;

				// Map to store the events' ocurrences
				let map = new Map();

				// Function to add an event count to the map
				function addToMap(event, squirrel) {
					let found = map.has(event);
					if (found) {
						let ev = map.get(event);
						if (squirrel) {
							ev['appTrue'] += 1;
						}
						else {
							ev['appFalse'] += 1;
						}
					}
					else {
						if (squirrel) {
							map.set(event, { appTrue: 1, appFalse: 0 });
						}
						else {
							map.set(event, { appTrue: 0, appFalse: 1 });
						}
					}
				}

				// Parsing HTML
				const root = parse(data.toString());
				const body = root.querySelector('body');

				//------------------------------------------------------------Events Table------------------------------------------------------------
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
								nTrue++;
							}
							row += '<th>' + obj + '</th>';
						}
					});

					// Add events to map
					item['events'].forEach((key) => addToMap(key, squirrel));

					if (squirrel) {
						tbody.appendChild(parse('<tr class="table-danger">' + row + '</tr>'));
					}
					else {
						tbody.appendChild(parse('<tr>' + row + '</tr>'));
					}
					i++;
				});
				//------------------------------------------------------------------------------------------------------------------------------------

				//------------------------------------------------------------Correlation Table-------------------------------------------------------
				// Reference to table of Correlation
				const tCorrelation = body.querySelector('#tCorrelation');

				// Head and body of the table
				const theadC = tCorrelation.querySelector('thead');
				const tbodyC = tCorrelation.querySelector('tbody');

				const tTitleC = theadC.querySelector('#tTitleC');
				const tSubtitlesC = theadC.querySelector('#tSubtitlesC');

				tTitleC.appendChild(parse('<h1>Correlation of Events</h1>'));

				tSubtitlesC.appendChild(parse('<th scope="col">#</th>'));
				tSubtitlesC.appendChild(parse('<th scope="col">Event</th>'));
				tSubtitlesC.appendChild(parse('<th scope="col">Correlation</th>'));

				let eventCorrelation = [];
				for (const [ key, value ] of map) {
					let fN = value['appFalse'];
					let tP = value['appTrue'];
					let fP = nTrue - value['appTrue'];
					let tN = total - fN - tP - fP;

					let corr = (tP * tN - fP * fN) / Math.sqrt((tP + fP) * (tP + fN) * (tN + fP) * (tN + fN));

					eventCorrelation.push({ event: key, Correlation: corr });
					//console.log(`${key}: ${value['appTrue']}`);
				}

				eventCorrelation.sort((firstEl, secondEl) => {
					let corFirst = firstEl['Correlation'];
					let corSecond = secondEl['Correlation'];
					if (corFirst > corSecond) {
						return -1;
					}
					if (corFirst < corSecond) {
						return 1;
					}
					return 0;
				});

				let num = 1;
				eventCorrelation.forEach((elem) => {
					tbodyC.appendChild(
						parse(
							'<tr>' +
								'<th>' +
								num +
								'</th>' +
								'<th>' +
								elem['event'] +
								'</th>' +
								'<th>' +
								elem['Correlation'] +
								'</th>' +
								'</tr>'
						)
					);
					num++;
				});

				//------------------------------------------------------------------------------------------------------------------------------------
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
