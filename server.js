let {sequelize, Todo} = require("./db.js");
let express = require("express");
let app = express();
let bodyParser = require("body-parser");

const port = process.env.PORT || 3000;

sequelize.sync().then(()=>{
	console.log("connected to database ssda");
	console.log(process.env.PORT);
});

let urlencoded = bodyParser.urlencoded({extended: false});

app.get("/", (req, res)=>{
	res.send("working");
});

app.post("/todo", urlencoded, (req, res)=>{
	Todo.create({
		description: req.body.description
	}).then( todo => {
		res.status(200).json( todo.toJSON() );
	}).catch( (err) => {
		res.status(404).send(err);
	});
});

app.post("/update/todo", urlencoded, (req, res)=>{
	Todo.update({
		status: req.body.status == "true"
	}, {
		where: {
			id: {
				$eq: req.body.id
			}
		}
	}).then( todo => {
		res.status(200).json( todo.toJSON() );
	}).catch( (err) => {
		res.status(404).send(err);
	});
});

app.delete("/todo/", urlencoded, (req, res)=>{
	let id = JSON.parse(req.body.id);
	
	Todo.destroy({
		where:{
			id: { $in:[...id.ids] }
		}
	}).then( () => {
		res.status(200).send( "deleted" );
	}).catch( () => {
		res.status(404).send("couldn't delete");
	});

});

app.get("/todo/:id", (req, res)=>{
	Todo.findById(req.params.id).then( todo => {
		res.status(200).json( todo.toJSON() );
	}).catch(()=>{
		res.status(404).send( "todo not found" );
	});
});

app.get("/todos", (req, res)=>{
	let prom;
	let bool = req.query.status && JSON.parse(req.query.status);
	if(typeof bool === "boolean")
		prom = Todo.findAll({
			where:{
				status:{ $eq: bool }
			}
		});
	else if(req.query.substr)
		prom = Todo.findAll({
			where:{
				description:{ $like: "%"+req.query.substr+"%" }
			}
		});
	else
		prom = Todo.findAll();

	prom.then( todos => {
		res.status(200).json( {todos : todos.map( todo => todo.toJSON() )} );
	}).catch(()=>{
		res.status(404).send( "todo not found" );
	});
});

app.get("/todo-count", (req, res)=>{
	Todo.findAll({
		attributes: [[sequelize.fn("COUNT", sequelize.col("id")), "todoCount"]]
	}).then( count => {
		res.json( count[0].dataValues );
	});
});

app.listen(port);