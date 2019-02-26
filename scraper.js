// This is a template for a Node.js scraper on morph.io (https://morph.io)

var cheerio = require("cheerio");
var request = require("request");
var sqlite3 = require("sqlite3").verbose();

function initDatabase(callback) {
	// Set up sqlite database.
	var db = new sqlite3.Database("data.sqlite");
	db.serialize(function() {
		db.run("CREATE TABLE IF NOT EXISTS data (name TEXT, title TEXT, state TEXT, phone TEXT, photoURL TEXT)");
		callback(db);
	});
}

function updateRow(db, name, title, state, phone, photoURL) {
	// Insert some data.
	var statement = db.prepare("INSERT INTO data VALUES (?, ?, ?, ?, ?)");
	statement.run(name, title, state, phone, photoURL);
	statement.finalize();
}

function readRows(db) {
	// Read some data.
	db.each("SELECT * FROM data", function(err, row) {
		// 	"AL": {Name: "John Merrill", Phone: "334-242-7200", Title: "Secretary of State", PhotoURL: "http://www.nass.org/images/stories/merrill-al.jpg"},
		console.log("\"" + row.state + "\": {Name: \"" + row.name + "\", Phone: \""+row.phone+"\", Title: \""+row.title+"\", PhotoURL: \""+row.photoURL+"\"},");
	});
}

function fetchPage(url, callback) {
	// Use request to read in pages.
	request(url, function (error, response, body) {
		if (error) {
			console.log("Error requesting page: " + error);
			return;
		}

		callback(body);
	});
}

function run(db) {
	// Use request to read in pages.
	fetchPage("https://www.nass.org/membership", function (body) {
		// Use cheerio to find things in the page with css selectors.
		var $ = cheerio.load(body);

		var elements = $("section.sos .view-content>article").each(function () {
			var state = $(this).find("h2").text().trim();
			var name = $(this).children().eq(2).text().trim();
			var photo = $(this).find("img").attr('src');
			var title = $(this).children().eq(3).text().trim();
			var phone = $(this).children().eq(5).text().trim();

			updateRow(db, name, title, state, phone, photo);
		});

		readRows(db);

		db.close();
	});
}

initDatabase(run);
