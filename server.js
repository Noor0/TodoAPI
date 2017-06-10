let {sequelize, Todo, User, Token} = require("./db.js");
let express = require("express");
let app = express();
let bodyParser = require("body-parser");
let crypto = require("crypto-js");
let colors = require("colors/safe");
let expressJWT = require("express-jwt");
let ATP = require("./authorizeToProceed.js")(User, Token);

const port = process.env.PORT || 3000;

sequelize.sync().then(()=>{
	console.log(colors.red("connected to database"));
});

let urlencoded = bodyParser.urlencoded({extended: false});
app.use( expressJWT({secret: "secret"}).unless({path: ["/user/signup", "/user/login", "/todo-count"]}) );

app.get("/", (req, res)=>{
	res.send("working");
});



/*
**************************START OF USER ROUTES**************************
*/

app.get("/users", (req, res)=>{
	User.findAll({
		attributes: ["id", "email", "createdAt", "updatedAt"]
	}).then( users => {
		res.status(200).json(users);
	})
	.catch( err => {
		res.status(400).send(err);
	});
});



app.post("/user/signup", urlencoded, (req, res)=>{
	User.create({
		email: req.body.email,
		password: req.body.password
	}).then( user => {
		res.status(200).json(user.toPublicJSON());
	})
	.catch( err => {
		res.status(400).send(err);
	});
});



app.post("/user/login", urlencoded, (req, res)=>{
	if(req.body.email && req.body.password.length && req.body.password.length >= 5){
		User.findOne({
			where: {
				email: {
					$eq: req.body.email
				}
			}
		}).then( user => {
			if(user == null)
				res.status(401).json({message: "user not found"});

			let hash = crypto.SHA256(req.body.password+""+user.get("salt"));
			if( user.get("pass_hash") ===  hash.toString()){
				let token = user.genToken("authentication");
				Token.create({
					token,
					userId: user.get("id")
				}).then( ()=> res.status(200).send(token) )
				.catch( err => res.status(500).send(err) );
				
			}
			else
				throw new Error("incorrect password");
		}).catch( err => res.status(400).json(err.message) );
	}
	else
		res.status(400).send("incorrect email/password");
});



app.get("/user/logout", ATP,(req,res)=>{
	let token = req.headers.authorization.split(" ")[1];
	let tokenHash = crypto.MD5(token).toString();
	Token.destroy({
		where:{
			token_hash:{
				$eq: tokenHash
			}
		}
	}).then( token => {
		console.log(token);
		res.status(200).end();
	}).catch( e => res.status(401).send(e) );
});



app.post("/user/verify", ATP, (req, res)=>{
	res.json(req.user);
});

// app.post("/user/verify", urlencoded, (req, res)=>{
// 	if( req.headers.hasOwnProperty("authorization") ){
// 		new Promise((res, rej)=>{
// 			try{
// 				let data = jwt.verify(req.headers.authorization.split(" ")[1], "secret");
// 				res(data);
// 			}
// 			catch(e){
// 				rej(e);
// 			}
// 		}).then( data => {
// 				res.status(200).json(data);	
// 		}, () => {
// 			res.status(401).end();
// 		}).catch( err =>{
// 			res.status(500).send(err);
// 		});
// 	}
// 	else
// 		res.status(401).send("login first!");
// });

/*
**************************END OF USER ROUTES**************************
*/



/*
**************************START OF TODO ROUTES**************************
*/

app.post("/todo", urlencoded, ATP, (req, res)=>{
	Todo.create({
		userId: req.user.id,
		description: req.body.description
	}).then( todo => {
		res.status(200).json( todo.toJSON() );
	}).catch( (err) => {
		res.status(404).send(err);
	});
});



app.post("/update/todo", urlencoded, ATP, (req, res)=>{
	let prom;
	if(req.body.description !== undefined)
		prom = Todo.update({
			description: req.body.description
		}, {
			where: {
				id: {	$eq: req.body.id },
				userId: { $eq: req.user.id }
			}
		});
	else if(req.body.status !== undefined)
		prom = Todo.update({
			status: req.body.status == "true"
		}, {
			where: {
				id: {	$eq: req.body.id },
				userId: { $eq: req.user.id }
			}
		});
	else
		res.status(404).send("shit");

	prom.then( status => {
		if(!status[0])
			throw new Error("todo not found");
		res.status(200).end();
	}).catch( err => {
		res.status(404).send(err.toString());
	});
});



app.delete("/todo/", urlencoded, ATP,(req, res)=>{
	let id = JSON.parse(req.body.id);
	Todo.destroy({
		where:{
			id: { $in:[...id.ids] },
			userId: { $eq: req.user.id }
		}
	}).then( () => {
		res.status(200).end();
	}).catch( (e) => {
		res.status(404).send(e);
	});

});



app.get("/todo/:id", ATP,(req, res)=>{
	Todo.find({
		where:{
			id : { $eq: req.params.id	},
			userId: { $eq: req.user.id	}
		}
	}).then( todo => {
		res.status(200).json( todo.toJSON() );
	}).catch(()=>{
		res.status(404).send( "todo not found" );
	});
});



app.get("/todos", ATP, (req, res)=>{
	let prom;
	let bool = req.query.status && JSON.parse(req.query.status);
	if(typeof bool === "boolean")
		prom = Todo.findAll({
			where:{
				status: { $eq: bool },
				userId: { $eq: req.user.id}
			}
		});
	else if(req.query.substr)
		prom = Todo.findAll({
			where:{
				description:{ $like: "%"+req.query.substr+"%" },
				userId: { $eq: req.user.id }
			}
		});
	else
		prom = Todo.findAll({
			where:{
				userId: { $eq: req.user.id }
			}
		});

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

/*
**************************END OF TODO ROUTES**************************
*/

app.listen(port);
